import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import { getBrowserPostForDate } from "./gmb-browser-posts.mjs";

const date = process.env.GMB_POST_DATE || "2026-09-13";
const profileDir = process.env.GMB_BROWSER_PROFILE_DIR || path.resolve(".gmb-browser-profile");
const browserChannel = process.env.GMB_BROWSER_CHANNEL || "msedge";
const stateDir = path.resolve(".gmb-browser-state");
const post = getBrowserPostForDate(date);

if (!post) throw new Error(`No post found for ${date}.`);

const context = await chromium.launchPersistentContext(profileDir, {
  channel: browserChannel,
  headless: false,
  viewport: { height: 1000, width: 1440 }
});

const page = context.pages()[0] || await context.newPage();
page.setDefaultTimeout(25_000);

try {
  await fs.mkdir(stateDir, { recursive: true });
  await page.goto("https://business.google.com/locations", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const profiles = await page.evaluate(() => {
    return [...document.querySelectorAll("tr, [role=row]")]
      .map((row) => row.innerText || "")
      .filter((text) => /Grade A Plumb/.test(text))
      .map((text) => {
        const columns = text.split("\t").map((part) => part.trim()).filter(Boolean);
        const name = columns.find((part) => /^Grade A Plumb/.test(part)) || "";
        const status = columns.find((part) => /^(Verified|Verification required|Suspended)$/i.test(part)) || "Unknown";
        return { name, status };
      })
      .filter((profile) => profile.name);
  });

  const expectedText = post.summary.slice(0, 90);
  const results = [];

  for (const profile of profiles) {
    if (profile.status !== "Verified") {
      results.push({ ...profile, checked: false, found: false, reason: profile.status });
      continue;
    }

    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(profile.name)}`, {
      waitUntil: "domcontentloaded"
    });
    await page.waitForTimeout(2500);
    const body = await page.locator("body").innerText().catch(() => "");
    results.push({
      ...profile,
      checked: true,
      found: body.includes(expectedText)
    });
  }

  const report = {
    date,
    searchedFor: expectedText,
    totalProfiles: profiles.length,
    verifiedProfiles: profiles.filter((profile) => profile.status === "Verified").length,
    verifiedFound: results.filter((result) => result.checked && result.found).length,
    verifiedMissing: results.filter((result) => result.checked && !result.found).map((result) => result.name),
    skipped: results.filter((result) => !result.checked),
    results
  };

  const reportPath = path.join(stateDir, `${date}-verify-all.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, reportPath }, null, 2));
} finally {
  await context.close();
}
