import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import { getBrowserPostForDate } from "./gmb-browser-posts.mjs";

const date = process.env.GMB_POST_DATE || "2026-09-13";
const profileDir = process.env.GMB_BROWSER_PROFILE_DIR || path.resolve(".gmb-browser-profile");
const browserChannel = process.env.GMB_BROWSER_CHANNEL || "msedge";
const locationName = process.env.GMB_BROWSER_LOCATION_NAME || "Grade A Plumbing Melbourne";
const post = getBrowserPostForDate(date);

if (!post) throw new Error(`No post found for ${date}.`);

const context = await chromium.launchPersistentContext(profileDir, {
  channel: browserChannel,
  headless: false,
  viewport: { height: 1000, width: 1500 }
});

const page = context.pages()[0] || await context.newPage();
page.setDefaultTimeout(20_000);

try {
  await page.goto("https://business.google.com/locations", { waitUntil: "domcontentloaded" });
  await page.getByText(locationName, { exact: false }).first().click();
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  const updateButtons = [
    page.getByRole("button", { name: /updates|posts|view updates|see updates/i }).first(),
    page.getByText(/updates|posts|view updates|see updates/i).first()
  ];

  for (const button of updateButtons) {
    if (await isUsable(button)) {
      await button.click().catch(() => {});
      break;
    }
  }

  await page.waitForTimeout(3000);
  const visibleText = await page.locator("body").innerText().catch(() => "");
  const screenshotDir = path.resolve(".gmb-browser-state");
  await fs.mkdir(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `${date}-verify.png`);
  await page.screenshot({ fullPage: true, path: screenshotPath });

  const found = visibleText.includes(post.summary.slice(0, 80)) || visibleText.includes(post.url);
  console.log(JSON.stringify({
    date,
    found,
    screenshotPath,
    searchedFor: post.summary
  }, null, 2));
} finally {
  await context.close();
}

async function isUsable(locator) {
  try {
    return await locator.isVisible() && await locator.isEnabled();
  } catch {
    return false;
  }
}
