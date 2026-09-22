import http from "node:http";
import {spawn} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workerScript = path.join(root, "scripts", "browser-worker.mjs");
const profileCreateScript = path.join(root, "scripts", "browser-profile-create.mjs");
const stateDir = path.join(root, ".gmb-browser-state");
const browserProfileDir = path.join(root, ".gmb-browser-profile");
const port = Number(process.env.GMB_BROWSER_MANUAL_PORT || 53683);
const allowedOrigin = "https://gmb-autopilot-fawn.vercel.app";
let active = null;
let lastRun = null;

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
  return { ok: true, running: !!active, lastRun, port };
}

function runWorker() {
  if (active) return { started: false, running: true, lastRun };
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, [workerScript], { cwd: root, windowsHide: true });
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
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, [workerScript, "--sync"], {
    cwd: root,
    windowsHide: true,
    env: { ...process.env, GMB_BROWSER_ACCOUNTS: String(email).toLowerCase() }
  });
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

function runProfileCreate(body) {
  const email=String(body?.email||"").toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {started:false,error:"Choose a valid Gmail account."};
  if(!body?.settings?.title||!body?.settings?.categoryLabel)return {started:false,error:"Business name and category are required."};
  if(active)return {started:false,running:true,lastRun};
  fs.mkdirSync(stateDir,{recursive:true});
  const payloadPath=path.join(stateDir,`profile-create-${Date.now()}.json`);
  fs.writeFileSync(payloadPath,JSON.stringify({email,draftId:body.draftId||"",dryRun:body.dryRun===true,settings:body.settings}),{encoding:"utf8",mode:0o600});
  const startedAt=new Date().toISOString();
  const child=spawn(process.execPath,[profileCreateScript,"--payload",payloadPath],{cwd:root,windowsHide:false});
  active={child,startedAt};let output="";
  child.stdout.on("data",chunk=>{output+=chunk.toString();output=output.slice(-8000);});
  child.stderr.on("data",chunk=>{output+=chunk.toString();output=output.slice(-8000);});
  child.on("exit",code=>{lastRun={startedAt,finishedAt:new Date().toISOString(),code,output:output.trim().slice(-6000)};active=null;fs.rmSync(payloadPath,{force:true});});
  return {started:true,running:true,startedAt};
}

function stopWorkerProfileEdge() {
  const escapedProfile = browserProfileDir.replace(/'/g, "''");
  const script = `$profile='${escapedProfile}'; Get-CimInstance Win32_Process -Filter "name = 'msedge.exe'" | Where-Object { $_.CommandLine -like "*$profile*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], { windowsHide: true });
}

function openGoogleLogin() {
  if (active) return { started: false, running: true, lastRun };
  const startedAt = new Date().toISOString();
  stopWorkerProfileEdge();
  const target = "https://accounts.google.com/AddSession?continue=https%3A%2F%2Fbusiness.google.com%2Flocations";
  const executable = process.env.GMB_EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  setTimeout(() => {
    const child = spawn(executable, [`--user-data-dir=${browserProfileDir}`, "--profile-directory=Default", "--no-first-run", target], { cwd: root, detached: true, stdio: "ignore", windowsHide: false });
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
  if (request.method === "POST" && url.pathname === "/run") return writeJson(response, 200, { ok: true, ...runWorker() });
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
