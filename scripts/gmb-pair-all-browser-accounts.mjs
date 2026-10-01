import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = "https://gmb-autopilot-fawn.vercel.app";
const context = await chromium.launchPersistentContext(path.join(root, ".gmb-browser-profile"), {
  channel: "msedge",
  headless: true,
});

try {
  const stateResponse = await context.request.get(`${app}/api/automation/state`);
  const state = await stateResponse.json();
  if (!stateResponse.ok()) throw new Error(state.error || "Could not load the authenticated workspace.");
  const eligibleAccountIds = new Set(state.profiles
    .filter(profile => profile.canOperateLocalPost !== false && !["SUSPENDED", "UNAVAILABLE", "VERIFICATION_REQUIRED", "NEEDS_VERIFICATION"].includes(profile.status))
    .map(profile => profile.googleAccountId));
  const emails = state.accounts.filter(account => eligibleAccountIds.has(account.id)).map(account => account.email.toLowerCase());
  const pairResponse = await context.request.post(`${app}/api/automation/browser`, {
    headers: { Origin: app },
    data: { action: "pair" },
  });
  const pair = await pairResponse.json();
  if (!pairResponse.ok()) throw new Error(pair.error || "Could not pair the browser publisher.");
  const configPath = path.join(root, ".gmb-browser-state", "autopilot-worker.json");
  await fs.writeFile(configPath, JSON.stringify({ token: pair.token, expiresAt: pair.expiresAt, emails }), { mode: 0o600 });
  console.log(JSON.stringify({ paired: true, accounts: emails, expiresAt: pair.expiresAt }, null, 2));
} finally {
  await context.close();
}
