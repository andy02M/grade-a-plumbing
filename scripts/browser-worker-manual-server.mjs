import http from "node:http";
import {spawn} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";
import fs from "node:fs";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workerScript = path.join(root, "scripts", "browser-worker.mjs");
const profileCreateScript = path.join(root, "scripts", "browser-profile-create.mjs");
const stateDir = path.join(root, ".gmb-browser-state");
const configPath = path.join(stateDir, "autopilot-worker.json");
const browserProfileDir = path.join(root, ".gmb-browser-profile");
function accountBrowserProfileDir(email) {
  const key = crypto.createHash("sha256").update(String(email || "").trim().toLowerCase()).digest("hex").slice(0, 24);
  return path.join(root, ".gmb-browser-profiles", key);
}
const port = Number(process.env.GMB_BROWSER_MANUAL_PORT || 53683);
const allowedOrigin = "https://gmb-autopilot-fawn.vercel.app";
let active = null;
let lastRun = null;
let lastRequestedEmail = "";

async function readBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk.toString();
  if (!body) return {};
  try { return JSON.parse(body); } catch { return {}; }
}

function writeJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function status() {
  let pairedEmail = "";
  try { pairedEmail = JSON.parse(fs.readFileSync(configPath, "utf8")).emails?.[0] || ""; } catch {}
  return { ok: true, running: !!active, lastRun, port, pairedEmail };
}

function configureWorker(body) {
  const token = String(body?.token || "");
  const email = String(body?.email || "").trim().toLowerCase();
  const expiresAt = Number(body?.expiresAt || 0);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return { error: "Invalid browser pairing token." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Choose a valid Google account email." };
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return { error: "Browser pairing has already expired." };
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({ token, expiresAt, emails: [email] }), { encoding: "utf8", mode: 0o600 });
  return { configured: true, pairedEmail: email, expiresAt };
}

function runWorker(extraArgs = []) {
  if (active) return { started: false, running: true, lastRun };
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, [workerScript, ...extraArgs], { cwd: root, windowsHide: !extraArgs.includes("--visible") });
  active = { child, startedAt };
  let output = "";
  child.stdout.on("data", chunk => { output += chunk.toString(); output = output.slice(-4000); });
  child.stderr.on("data", chunk => { output += chunk.toString(); output = output.slice(-4000); });
  child.on("exit", code => {
    lastRun = { startedAt, finishedAt: new Date().toISOString(), code, output: output.trim().slice(-2000) };
    active = null;
  });
  return { started: true, running: true, startedAt };
}

function runAccountSync(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))) {
    return { started: false, running: !!active, error: "Enter a valid Google account email." };
  }
  if (active) return { started: false, running: true, lastRun };
  lastRequestedEmail = String(email).toLowerCase();
  const startedAt = new Date().toISOString();
  // A prior sign-in helper can leave Edge holding the persistent profile lock.
  // Close only Edge processes using our dedicated profile, allow Chromium to
  // release the lock, then start one visible sync worker. The worker itself
  // waits for interactive Google sign-in and resumes the same sync run.
  stopWorkerProfileEdge(accountBrowserProfileDir(lastRequestedEmail));
  active = { child: null, startedAt, pending: true };
  const startSyncWorker = () => {
    if (!active || active.startedAt !== startedAt) return;
    const child = spawn(process.execPath, [workerScript, "--sync"], {
      cwd: root,
      windowsHide: false,
      env: { ...process.env, GMB_BROWSER_ACCOUNTS: lastRequestedEmail }
    });
    active = { child, startedAt };
    let output = "";
    child.stdout.on("data", chunk => { output += chunk.toString(); output = output.slice(-8000); });
    child.stderr.on("data", chunk => { output += chunk.toString(); output = output.slice(-8000); });
    child.on("exit", code => {
      const secureSignIn = output.match(/SECURE_EDGE_SIGNIN_REQUIRED:([^\s]+)/);
      if (secureSignIn) {
        const accountEmail = secureSignIn[1].trim().toLowerCase();
        const profileDir = accountBrowserProfileDir(accountEmail);
        const executable = process.env.GMB_EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
        const target = `https://accounts.google.com/AddSession?Email=${encodeURIComponent(accountEmail)}&continue=${encodeURIComponent("https://business.google.com/locations")}`;
        const login = spawn(executable, [`--user-data-dir=${profileDir}`, "--profile-directory=Default", "--no-first-run", "--disable-background-mode", target], {
          cwd: root, windowsHide: false, stdio: "ignore"
        });
        active = { child: login, startedAt, interactiveSignIn: true };
        lastRun = { startedAt, finishedAt: new Date().toISOString(), code: null, output: `Ordinary Edge opened for ${accountEmail}. Finish Google sign-in and close that Edge window; sync will resume automatically.` };
        login.on("exit", () => {
          if (!active || active.startedAt !== startedAt) return;
          active = { child: null, startedAt, pending: true };
          setTimeout(startSyncWorker, 2500);
        });
        return;
      }
      lastRun = { startedAt, finishedAt: new Date().toISOString(), code, output: output.trim().slice(-6000) };
      active = null;
    });
  };
  setTimeout(startSyncWorker, 1800);
  return { started: true, running: true, startedAt };
}

function runProfileCreate(body) {
  const email=String(body?.email||"").toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {started:false,error:"Choose a valid Gmail account."};
  if(!body?.settings?.title||!body?.settings?.categoryLabel)return {started:false,error:"Business name and category are required."};
  if(active)return {started:false,running:true,lastRun};
  fs.mkdirSync(stateDir,{recursive:true});
  const payloadPath=path.join(stateDir,`profile-create-${Date.now()}.json`);
  fs.writeFileSync(payloadPath,JSON.stringify({email,draftId:body.draftId||"",dryRun:body.dryRun===true,settings:body.settings}),{encoding:"utf8",mode:0o600});
  const startedAt=new Date().toISOString();
  // Profile creation and account sync share one dedicated persistent Edge
  // profile. Clear any stale automation-only Edge process first so the visible
  // creation browser cannot silently fail with Chromium profile-lock exit 21.
  stopWorkerProfileEdge(accountBrowserProfileDir(email));
  active={child:null,startedAt,pending:true};
  setTimeout(()=>{
    if(!active||active.startedAt!==startedAt)return;
    const child=spawn(process.execPath,[profileCreateScript,"--payload",payloadPath],{cwd:root,windowsHide:false});
    active={child,startedAt};let output="";
    child.stdout.on("data",chunk=>{output+=chunk.toString();output=output.slice(-12000);});
    child.stderr.on("data",chunk=>{output+=chunk.toString();output=output.slice(-12000);});
    child.on("exit",code=>{lastRun={startedAt,finishedAt:new Date().toISOString(),code,output:output.trim().slice(-10000)};active=null;fs.rmSync(payloadPath,{force:true});});
  },1800);
  return {started:true,running:true,startedAt};
}

function stopWorkerProfileEdge(profileDir = browserProfileDir) {
  const escapedProfile = profileDir.replace(/'/g, "''");
  const script = `$profile='${escapedProfile}'; Get-CimInstance Win32_Process -Filter "name = 'msedge.exe'" | Where-Object { $_.CommandLine -like "*$profile*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  return spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], { windowsHide: true });
}

function openGoogleLogin() {
  if (active) return { started: false, running: true, lastRun };
  const startedAt = new Date().toISOString();
  let loginEmail = lastRequestedEmail;
  if (!loginEmail) {
    try { loginEmail = String(JSON.parse(fs.readFileSync(configPath, "utf8")).emails?.[0] || "").toLowerCase(); } catch {}
  }
  const loginProfileDir = loginEmail ? accountBrowserProfileDir(loginEmail) : browserProfileDir;
  stopWorkerProfileEdge(loginProfileDir);
  const target = "https://accounts.google.com/AddSession?continue=https%3A%2F%2Fbusiness.google.com%2Flocations";
  const executable = process.env.GMB_EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  setTimeout(() => {
    const child = spawn(executable, [`--user-data-dir=${loginProfileDir}`, "--profile-directory=Default", "--no-first-run", "--disable-background-mode", target], { cwd: root, detached: true, stdio: "ignore", windowsHide: false });
    child.unref();
  }, 1500);
  lastRun = { startedAt, finishedAt: new Date().toISOString(), code: 0, output: "Opened Microsoft Edge for Google sign-in. Finish sign-in, close Edge, then run Sync via browser again." };
  return { started: true, running: false, startedAt, requiresManualSignIn: true };
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  if (request.method === "OPTIONS") return writeJson(response, 204, {});
  if (origin && origin !== allowedOrigin) return writeJson(response, 403, { ok: false, error: "Origin not allowed." });
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  if (request.method === "GET" && url.pathname === "/status") return writeJson(response, 200, status());
  if (request.method === "POST" && url.pathname === "/configure") {
    const body = await readBody(request); const result = configureWorker(body);
    return writeJson(response, result.error ? 400 : 200, { ok: !result.error, ...result });
  }
  if (request.method === "POST" && url.pathname === "/run") return writeJson(response, 200, { ok: true, ...runWorker() });
  if (request.method === "POST" && url.pathname === "/schedule-google") return writeJson(response, 200, { ok: true, ...runWorker(["--google-schedule", "--visible"]) });
  if (request.method === "POST" && url.pathname === "/sync-account") {
    const body = await readBody(request);
    const result = runAccountSync(body.email);
    return writeJson(response, result.error ? 400 : 200, { ok: !result.error, ...result });
  }
  if (request.method === "POST" && url.pathname === "/google-login") return writeJson(response, 200, { ok: true, ...openGoogleLogin() });
  if (request.method === "POST" && url.pathname === "/create-profile") {
    const body=await readBody(request);const result=runProfileCreate(body);
    return writeJson(response,result.error?400:200,{ok:!result.error,...result});
  }
  writeJson(response, 404, { ok: false, error: "Not found." });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`GMB AutoPilot manual browser runner listening on http://127.0.0.1:${port}`);
});
