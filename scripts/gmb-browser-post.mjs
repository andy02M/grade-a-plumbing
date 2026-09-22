import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import { getBrowserPostForDate, getTodayInMelbourne } from "./gmb-browser-posts.mjs";

const date = process.env.GMB_POST_DATE || getTodayInMelbourne();
const dryRun = process.env.GMB_BROWSER_DRY_RUN !== "false";
const profileDir = process.env.GMB_BROWSER_PROFILE_DIR || path.resolve(".gmb-browser-profile");
const locationName = process.env.GMB_BROWSER_LOCATION_NAME || "Grade A Plumbing Melbourne";
const browserChannel = process.env.GMB_BROWSER_CHANNEL || "msedge";
const scheduleTime = process.env.GMB_BROWSER_SCHEDULE_TIME || "";
const stateDir = path.resolve(".gmb-browser-state");
const postedFile = path.join(stateDir, `${date}.json`);

const post = getBrowserPostForDate(date);
if (!post) {
  console.log(`No GMB campaign post is scheduled for ${date}.`);
  process.exit(0);
}

await fs.mkdir(stateDir, { recursive: true });
if (await exists(postedFile)) {
  console.log(`Already recorded a browser-post attempt for ${date}. Remove ${postedFile} to retry.`);
  process.exit(0);
}

console.log(`${dryRun ? "Dry run" : "Live run"} for ${date}: ${post.service} in ${post.suburb}`);
if (scheduleTime) console.log(`Scheduling for ${formatGoogleDate(date)} at ${scheduleTime}.`);
console.log(post.summary);
console.log(post.url);

const context = await chromium.launchPersistentContext(profileDir, {
  args: ["--disable-blink-features=AutomationControlled"],
  channel: browserChannel,
  headless: false,
  viewport: { height: 900, width: 1440 }
});

const page = context.pages()[0] || await context.newPage();
page.setDefaultTimeout(20_000);

try {
  await page.goto("https://business.google.com/locations", { waitUntil: "domcontentloaded" });
  await pauseIfHumanStepNeeded(page);
  await openLocation(page, locationName);
  await openPostComposer(page);
  await fillPost(page, post);

  if (dryRun) {
    await page.screenshot({ fullPage: true, path: path.resolve(".gmb-browser-state", `${date}-dry-run-filled.png`) }).catch(() => {});
    console.log("Dry run complete. The post should be drafted in the visible browser, but it was not published.");
    console.log("Set GMB_BROWSER_DRY_RUN=false to allow the script to click the final publish button.");
    if (process.env.GMB_BROWSER_PAUSE_ON_DRY_RUN === "true") await page.pause();
    process.exit(0);
  }

  await clickPublish(page);
  await fs.writeFile(postedFile, JSON.stringify({ date, post, postedAt: new Date().toISOString() }, null, 2));
  console.log(`Posted and recorded ${postedFile}.`);
} catch (error) {
  console.error("\nBrowser posting stopped before completion.");
  console.error(error instanceof Error ? error.message : error);
  console.error("\nIf Google is asking for sign-in, verification, or a CAPTCHA, complete it in the visible browser and rerun this command.");
  process.exitCode = 1;
} finally {
  if (process.env.GMB_BROWSER_KEEP_OPEN !== "true") await context.close();
}

async function openLocation(page, name) {
  const locationLink = page.getByText(name, { exact: false }).first();
  await locationLink.waitFor({ state: "visible" });
  await locationLink.click();
  await page.waitForLoadState("domcontentloaded").catch(() => {});
}

async function openPostComposer(page) {
  const groups = [
    page.locator("button").filter({ hasText: /^Add update$/i }),
    page.getByRole("button", { name: /^add update$/i }),
    page.getByRole("button", { name: /add update|post update|update customers|add post|create post/i }),
    page.getByText(/^add update$/i),
    page.getByText(/add update|post update|update customers|add post|create post/i)
  ];

  for (const group of groups) {
    const candidates = await group.all();
    for (const candidate of candidates) {
      if (await clickOnscreen(page, candidate)) {
        await getComposerFrame(page);
        return;
      }
    }
  }

  const screenshotPath = path.resolve(".gmb-browser-state", `${date}-composer-not-open.png`);
  await page.screenshot({ fullPage: true, path: screenshotPath }).catch(() => {});
  throw new Error(`Could not open the Google Business Profile post/update composer. Screenshot: ${screenshotPath}`);
}

async function clickOnscreen(page, locator) {
  try {
    if (!(await locator.isVisible()) || !(await locator.isEnabled())) return false;
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.click({ force: true }).catch(async () => {
      await locator.evaluate((element) => {
        if (element instanceof HTMLElement) element.click();
      });
    });
    return true;
  } catch {
    return false;
  }
}

async function getComposerFrame(page) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const frame = page.frames().find((item) => /\/local\/business\/.+\/promote\/updates\/add/.test(item.url()));
    if (frame && await frame.locator("textarea").first().isVisible().catch(() => false)) return frame;
    await page.waitForTimeout(500);
  }

  const screenshotPath = path.resolve(".gmb-browser-state", `${date}-composer-frame-missing.png`);
  await page.screenshot({ fullPage: true, path: screenshotPath }).catch(() => {});
  throw new Error(`Could not find the Google post composer frame. Screenshot: ${screenshotPath}`);
}

async function fillPost(page, post) {
  const text = `${post.summary}\n\nLearn more: ${post.url}`;
  const frame = await getComposerFrame(page);
  const description = frame.locator("textarea").first();
  await description.fill(text);
  await ensureComposerContainsPostText(page, text, description);
  if (scheduleTime) await schedulePost(frame, date, scheduleTime);
  await chooseCallNowButton(frame);
}

async function chooseCallNowButton(frame) {
  const buttonTab = frame.locator("button").filter({ hasText: /^Button$/i }).first();
  if (await isUsable(buttonTab)) await buttonTab.click({ force: true });

  const currentButton = frame.locator("button").filter({ hasText: /^(None|Book|Order online|Buy|Learn more|Sign up|Call now)$/i }).first();
  if (await isUsable(currentButton)) await currentButton.click({ force: true });

  const callNow = frame.locator("[role='menuitem']").filter({ hasText: /^Call now$/i }).first();
  await callNow.waitFor({ state: "visible", timeout: 10_000 });
  await callNow.click({ force: true });

  await frame.locator("button").filter({ hasText: /^Call now$/i }).first().waitFor({ state: "visible", timeout: 10_000 });
}

async function schedulePost(frame, postDate, postTime) {
  const scheduleSwitch = frame.getByRole("switch", { name: /schedule post/i }).first();
  await scheduleSwitch.waitFor({ state: "visible", timeout: 10_000 });

  if (await scheduleSwitch.getAttribute("aria-checked") !== "true") {
    await scheduleSwitch.click({ force: true });
  }

  const textInputs = frame.locator("input[type='text']");
  const dateInput = textInputs.nth(0);
  const timeInput = frame.locator("input[aria-label='Time'], input[role='combobox']").first();
  await dateInput.waitFor({ state: "visible", timeout: 10_000 });
  await timeInput.waitFor({ state: "visible", timeout: 10_000 });

  const googleDate = formatGoogleDate(postDate);
  await dateInput.fill(googleDate);
  await timeInput.fill(postTime);
  await timeInput.press("Enter").catch(() => {});

  const dateValue = await dateInput.inputValue().catch(() => "");
  const timeValue = await timeInput.inputValue().catch(() => "");
  if (dateValue !== googleDate || timeValue !== postTime) {
    throw new Error(`Could not set schedule date/time. Expected ${googleDate} ${postTime}, got ${dateValue} ${timeValue}.`);
  }
}

function formatGoogleDate(postDate) {
  const [year, month, day] = postDate.split("-");
  return `${day}/${month}/${year}`;
}

async function ensureComposerContainsPostText(page, text, target) {
  const expected = text.slice(0, 80);
  await page.waitForTimeout(500);
  const fieldValue = await target.inputValue().catch(async () => target.innerText().catch(() => ""));
  if (!fieldValue.includes(expected)) {
    const screenshotPath = path.resolve(".gmb-browser-state", `${date}-composer-missing-text.png`);
    await page.screenshot({ fullPage: true, path: screenshotPath }).catch(() => {});
    throw new Error(`The composer does not contain the intended post text. Screenshot: ${screenshotPath}`);
  }
}

async function clickPublish(page) {
  const frame = await getComposerFrame(page);
  const publish = frame.locator("button").filter({ hasText: /^Post$/i }).last();
  if (!(await isUsable(publish))) throw new Error("Could not find the final publish button.");
  await publish.click();
  await selectAllCopyProfilesIfPresent(page);
  await confirmPublishIfPresent(page);
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function selectAllCopyProfilesIfPresent(page) {
  const scope = await findScopeWithText(page, /copy the update to other profiles that you manage/i, 8_000);
  if (!scope) return;

  const selectAllTargets = [
    scope.getByRole("checkbox", { name: /select all/i }).first(),
    scope.locator("input[type='checkbox']").first(),
    scope.getByText(/^select all$/i).first()
  ];

  for (const target of selectAllTargets) {
    if (await isUsable(target)) {
      await target.click();
      break;
    }
  }

  const continueTargets = [
    scope.getByRole("button", { name: /continue|next|publish|post/i }).last(),
    scope.locator("button").filter({ hasText: /continue|next|publish|post/i }).last(),
    scope.getByText(/continue|next|publish|post/i).last()
  ];

  for (const target of continueTargets) {
    if (await isUsable(target)) {
      await target.click();
      return;
    }
  }
}

async function confirmPublishIfPresent(page) {
  for (const scope of getScopes(page)) {
    const confirmTargets = [
      scope.getByRole("button", { name: /publish|post|save/i }).last(),
      scope.locator("button").filter({ hasText: /publish|post|save/i }).last()
    ];

    for (const target of confirmTargets) {
      if (await isUsable(target)) {
        await target.click().catch(() => {});
        return;
      }
    }
  }
}

async function findScopeWithText(page, pattern, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const scope of getScopes(page)) {
      if (await scope.getByText(pattern).first().isVisible().catch(() => false)) return scope;
    }
    await page.waitForTimeout(500);
  }
  return null;
}

function getScopes(page) {
  return [page, ...page.frames()];
}

async function pauseIfHumanStepNeeded(page) {
  const url = page.url();
  const body = await page.locator("body").innerText().catch(() => "");
  if (/accounts\.google\.com/.test(url) || /captcha|verify it'?s you|sign in|2-step/i.test(body)) {
    console.log(`Google needs a manual account step in the visible ${browserChannel} browser.`);
    console.log("Complete sign-in or verification there, then rerun this command.");
    await page.pause();
  }
}

async function isUsable(locator) {
  try {
    return await locator.isVisible() && await locator.isEnabled();
  } catch {
    return false;
  }
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}
