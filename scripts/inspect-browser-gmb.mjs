import { chromium } from "playwright";
import path from "node:path";
const context = await chromium.launchPersistentContext(path.resolve(".gmb-browser-profile"), { channel: "msedge", headless: true });
try {
  const page = await context.newPage();
  await page.goto("https://business.google.com/locations", { waitUntil: "domcontentloaded" });
  await page.locator("body").waitFor();
  console.log(JSON.stringify({ origin: new URL(page.url()).origin, pathname: new URL(page.url()).pathname, text: (await page.locator("body").innerText()).slice(0,16000), controls: await page.locator("a,button,[role=button]").evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,text:n.textContent?.trim().slice(0,120),label:n.getAttribute("aria-label"),href:n instanceof HTMLAnchorElement && /business\.google\.com/.test(n.href)?n.href:undefined})).slice(0,100)) },null,2));
} finally { await context.close(); }
