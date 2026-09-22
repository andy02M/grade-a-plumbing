import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const i = process.argv.indexOf("--payload");
if (i < 0) throw new Error("Missing profile payload.");
const payload = JSON.parse(await fs.readFile(process.argv[i + 1], "utf8"));
const s = payload.settings;
const fixtureUrl = payload.fixtureBaseUrl ? new URL(payload.fixtureBaseUrl) : null;
if (fixtureUrl && !["127.0.0.1", "localhost"].includes(fixtureUrl.hostname))
  throw new Error("Fixture mode is restricted to localhost.");
if (fixtureUrl && (!payload.dryRun || !payload.fixtureRunAllPages))
  throw new Error("Fixture mode requires dryRun and fixtureRunAllPages.");
const traverseAllPages = !payload.dryRun || Boolean(fixtureUrl && payload.fixtureRunAllPages);
const stateDir = path.join(root, ".gmb-browser-state");
await fs.mkdir(stateDir, { recursive: true });
let stepIndex = 0;
const context = await chromium.launchPersistentContext(
  path.join(root, ".gmb-browser-profile"),
  {
    channel: "msedge",
    headless: Boolean(fixtureUrl),
    viewport: { width: 1440, height: 1000 },
  },
);
const page = context.pages()[0] || (await context.newPage());
page.on("pageerror", (error) => console.log(`Browser page error: ${error.message}`));
page.setDefaultTimeout(12000);
const shown = async (x) =>
  x
    .first()
    .isVisible()
    .catch(() => false);
const clean = (value) => String(value || "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "step";
async function pageHeadingText() {
  const h = page.getByRole("heading").first();
  if (await shown(h)) return (await h.innerText().catch(() => "")).trim();
  return (await page.title().catch(() => "")).trim() || page.url();
}
async function screenshotStep(label) {
  stepIndex += 1;
  const file = path.join(stateDir, `${String(stepIndex).padStart(2, "0")}-${clean(label)}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  console.log(`[${stepIndex}] ${label} | heading="${await pageHeadingText()}" | url=${page.url()} | screenshot=${file}`);
  return file;
}
async function failStep(message, label = "error") {
  const file = await screenshotStep(label);
  throw new Error(`${message} Screenshot: ${file}`);
}
async function click(names) {
  for (const name of names) {
    for (const role of ["button", "link", "radio"]) {
      const x = page.getByRole(role, { name, exact: false });
      if (await shown(x)) {
        await x.first().click();
        return true;
      }
    }
    const x = page.getByText(name, { exact: false });
    if (await shown(x)) {
      await x.first().click();
      return true;
    }
  }
  return false;
}
async function clickAndVerify(names, verify, description) {
  const before = await pageHeadingText();
  if (!(await click(names))) await failStep(`Could not click ${description}.`, `${clean(description)}-missing`);
  await page.waitForTimeout(1000);
  const ok = await verify().catch(() => false);
  if (!ok) {
    await failStep(`Clicked ${description}, but the expected UI did not appear. Previous heading: ${before}.`, `${clean(description)}-verify-failed`);
  }
  await screenshotStep(`${description}-verified`);
}
async function clickVisibleTextNearestButton(pattern, description) {
  const matches = await page.locator("text=" + String(pattern).replace(/^\/(.*)\/[a-z]*$/i, "$1")).all().catch(() => []);
  for (const match of matches) {
    if (!(await match.isVisible().catch(() => false))) continue;
    const clicked = await match.evaluate((node) => {
      const isClickable = (el) => {
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute("role");
        return tag === "button" || tag === "a" || role === "button" || role === "menuitem";
      };
      let el = node;
      for (let depth = 0; el && depth < 6; depth += 1, el = el.parentElement) {
        if (isClickable(el)) {
          el.click();
          return true;
        }
      }
      node.click();
      return true;
    }).catch(() => false);
    if (clicked) {
      await page.waitForTimeout(800);
      return true;
    }
  }
  if (description) console.log(`Could not click ${description} via visible text fallback.`);
  return false;
}
async function openAddSingleBusiness() {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(1500);
  const addBusinessClicked =
    (await click([/^Add business$/i, /Add business/i])) ||
    (await page.locator('button:has-text("Add business"), [role="button"]:has-text("Add business")').first().click().then(() => true).catch(() => false)) ||
    (await clickVisibleTextNearestButton(/Add business/i, "Add business"));
  if (!addBusinessClicked) {
    throw new Error("Could not click Add business on Google Business Profile Manager.");
  }
  await page.waitForTimeout(900);
  if (!(await page.getByText(/Add single business/i).first().isVisible().catch(() => false))) {
    await failStep("Clicked Add business, but the Add single business menu item did not become visible.", "add-business-menu-missing");
  }
  await screenshotStep("add-business-menu-open");
  const addSingleClicked =
    (await click([/^Add single business$/i, /Add single business/i])) ||
    (await page.locator('[role="menuitem"]:has-text("Add single business"), text="Add single business"').first().click().then(() => true).catch(() => false)) ||
    (await clickVisibleTextNearestButton(/Add single business/i, "Add single business"));
  if (!addSingleClicked) {
    throw new Error("Could not click Add single business after opening the Add business menu.");
  }
  if (!(await waitForHeading(/Confirm your business|Start building your Business Profile|Get your business on Google/i))) {
    await failStep("Clicked Add single business, but Google did not open the business creation flow.", "add-single-business-navigation-failed");
  }
  await screenshotStep("add-single-business-opened");
}
async function onBusinessIdentityPage() {
  return await heading(/Start building your Business Profile|Get your business on Google/i);
}
async function visibleValue(locator) {
  if (!(await locator.count().catch(() => 0))) return null;
  if (!(await locator.isVisible().catch(() => false))) return null;
  return await locator.inputValue().catch(async () => await locator.textContent().catch(() => null));
}
async function fill(labels, value) {
  if (value === undefined || value === null || value === "") return false;
  for (const label of labels) {
    const a = page.getByLabel(label, { exact: false });
    if (await shown(a)) {
      await a.first().fill(String(value));
      return true;
    }
    const p = page.getByPlaceholder(label, { exact: false });
    if (await shown(p)) {
      await p.first().fill(String(value));
      return true;
    }
  }
  return false;
}
async function fillVerified(labels, value, description) {
  if (value === undefined || value === null || value === "") return false;
  for (const label of labels) {
    const candidates = [
      page.getByLabel(label, { exact: false }).first(),
      page.getByPlaceholder(label, { exact: false }).first(),
    ];
    for (const input of candidates) {
      if (!(await input.count().catch(() => 0))) continue;
      if (!(await input.isVisible().catch(() => false))) continue;
      await input.click().catch(() => {});
      await input.fill(String(value));
      await page.waitForTimeout(300);
      const actual = await visibleValue(input);
      if (String(actual || "").trim().includes(String(value).trim())) {
        console.log(`Verified ${description}: ${actual}`);
        await screenshotStep(`${description}-filled`);
        return true;
      }
    }
  }
  await failStep(`Could not fill and verify ${description} with value "${value}".`, `${clean(description)}-fill-failed`);
  return false;
}
async function fieldContainsVerifiedValue(labels, expected) {
  for (const label of labels) {
    for (const input of [
      page.getByLabel(label, { exact: false }).first(),
      page.getByPlaceholder(label, { exact: false }).first(),
    ]) {
      if (!(await input.count().catch(() => 0)) || !(await input.isVisible().catch(() => false))) continue;
      const actual = await visibleValue(input);
      if (String(actual || "").trim().toLowerCase().includes(String(expected).trim().toLowerCase())) return true;
    }
  }
  return false;
}
async function next() {
  const beforeHeading = await pageHeadingText();
  const beforeUrl = page.url();
  const beforeBody = await page.locator("body").innerText().catch(() => "");
  if (!(await click([/^Next$/i, /^Continue$/i])))
    await failStep("Could not find Next or Continue on the current Google page.", "next-button-missing");
  await page.waitForTimeout(1500);
  const afterHeading = await pageHeadingText();
  const afterUrl = page.url();
  const afterBody = await page.locator("body").innerText().catch(() => "");
  if (afterHeading === beforeHeading && afterUrl === beforeUrl && afterBody === beforeBody)
    await failStep(`Clicked Next/Continue on "${beforeHeading}", but no visible page change occurred.`, "next-page-unchanged");
  await screenshotStep(`next-from-${clean(beforeHeading)}-verified`);
}
async function heading(re) {
  const headings = page.getByRole("heading");
  const count = await headings.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const item = headings.nth(index);
    if (!(await item.isVisible().catch(() => false))) continue;
    const text = (await item.innerText().catch(() => "")).trim();
    re.lastIndex = 0;
    if (re.test(text)) return true;
  }
  return false;
}
async function waitForHeading(re, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await heading(re)) return true;
    await page.waitForTimeout(250);
  }
  return false;
}
async function suggestion(value) {
  const o = page.getByRole("option").filter({ hasText: value }).first();
  if (await shown(o)) await o.click();
  else {
    const x = page.getByText(value, { exact: false }).first();
    if (await shown(x)) await x.click();
  }
}
async function suggestionVerified(value, description) {
  const before = await page.locator("body").innerText().catch(() => "");
  let selected = false;
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline && !selected) {
    const o = page.getByRole("option").filter({ hasText: value }).first();
    if (await shown(o)) {
      await o.click();
      selected = true;
      break;
    }
    const x = page.locator('[role="listbox"] [role="option"], [role="listbox"] li').filter({ hasText: value }).first();
    if (await shown(x)) {
      await x.click();
      selected = true;
      break;
    }
    await page.waitForTimeout(250);
  }
  if (!selected) {
    const focused = page.locator(":focus");
    if (await focused.count().catch(() => 0)) {
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      selected = true;
    }
  }
  await page.waitForTimeout(700);
  const body = await page.locator("body").innerText().catch(() => "");
  const visible = body.toLowerCase().includes(String(value).toLowerCase());
  const changed = body !== before;
  const focusedValue = await page.locator(":focus").inputValue().catch(() => "");
  const retained = String(focusedValue).toLowerCase().includes(String(value).toLowerCase());
  if (!selected || (!visible && !changed && !retained)) {
    await failStep(`Selected ${description}, but no visible selection/change was detected for "${value}".`, `${clean(description)}-selection-unverified`);
  }
  console.log(`Verified ${description} selection: ${value}`);
  await screenshotStep(`${description}-selected`);
}
async function selectChoiceVerified(name, description) {
  const candidates = [
    page.getByRole("radio", { name, exact: false }).first(),
    page.getByLabel(name, { exact: false }).first(),
  ];
  for (const choice of candidates) {
    if (!(await choice.count().catch(() => 0)) || !(await choice.isVisible().catch(() => false))) continue;
    await choice.click();
    await page.waitForTimeout(350);
    const checked = await choice.isChecked().catch(async () => (await choice.getAttribute("aria-checked")) === "true");
    if (!checked) await failStep(`Clicked ${description}, but it was not visibly selected.`, `${clean(description)}-not-selected`);
    await screenshotStep(`${description}-selected`);
    return;
  }
  await failStep(`Could not find selectable choice for ${description}.`, `${clean(description)}-missing`);
}
async function upload(paths) {
  const valid = [];
  for (const p of paths || []) {
    try {
      await fs.access(p);
      valid.push(p);
    } catch {
      console.log(`Photo skipped (not found): ${p}`);
    }
  }
  const input = page.locator('input[type="file"]').first();
  if (valid.length && (await input.count())) {
    await input.setInputFiles(valid);
    const uploaded = await input.evaluate((node) => node.files?.length || 0).catch(() => 0);
    if (uploaded !== valid.length)
      await failStep(`Expected ${valid.length} uploaded files, but the input contains ${uploaded}.`, "file-upload-count-failed");
    await page.waitForTimeout(fixtureUrl ? 100 : Math.min(120000, 5000 + valid.length * 1200));
    await screenshotStep(`uploaded-${valid.length}-files-verified`);
    return true;
  }
  return false;
}
try {
  await page.goto(
    fixtureUrl
      ? new URL(`/locations?email=${encodeURIComponent(payload.email)}`, fixtureUrl).href
      : `https://business.google.com/locations?authuser=${encodeURIComponent(payload.email)}&gmbsrc=ww-ww-ot-gs-z-gmb-l-z-h~z-ogb-u`,
    { waitUntil: "domcontentloaded" },
  );
  if (new URL(page.url()).hostname === "accounts.google.com")
    throw new Error(
      `Sign into ${payload.email} using Open secure Edge sign-in, close Edge, then run again.`,
    );
  const acct = page.locator('[aria-label^="Google Account:"]').first();
  if (await acct.count()) {
    const label = await acct.getAttribute("aria-label");
    if (label && !label.toLowerCase().includes(payload.email))
      throw new Error(`Wrong Google account. Expected ${payload.email}.`);
  }
  await screenshotStep("locations-page-loaded");
  await openAddSingleBusiness();
  if (await heading(/Confirm your business/i)) {
    await clickAndVerify([/^Next$/i], async () => await waitForHeading(/Start building your Business Profile|Get your business on Google/i), "confirm-business-next");
  }
  if (!(await onBusinessIdentityPage())) {
    await failStep("Expected Google's business name/category page before filling the fields.", "business-identity-page-missing");
  }
  await fillVerified([/Business name/i], s.title, "business-name");
  await fillVerified([/Business category/i], s.categoryLabel || s.categoryName, "business-category");
  await page.waitForTimeout(700);
  await suggestionVerified(s.categoryLabel || s.categoryName, "business-category");
  if (payload.dryRun && !traverseAllPages) {
    const evidence = path.join(
      root,
      ".gmb-browser-state",
      "profile-create-dry-run.png",
    );
    const visibleTitle = await fieldContainsVerifiedValue([/Business name/i], s.title);
    const visibleCategory = await fieldContainsVerifiedValue([/Business category/i], s.categoryLabel || s.categoryName);
    if (!visibleTitle || !visibleCategory) {
      await failStep(
        `Dry-run verification failed. Visible title=${visibleTitle}; visible category=${visibleCategory}.`,
        "dry-run-visible-field-check-failed",
      );
    }
    await page.screenshot({ path: evidence, fullPage: true });
    console.log(
      `DRY RUN PASSED: account verified, creation form opened, and sample name/category filled. Stopped before Next. Evidence: ${evidence}`,
    );
    await page.waitForTimeout(5000);
  } else await next();
  if (traverseAllPages && (await heading(/location customers can visit/i))) {
    const expectedNext = s.businessType === "SERVICE_AREA" ? /Where do you serve|contact details|postal address/i : /address|located/i;
    await selectChoiceVerified(s.businessType === "SERVICE_AREA" ? /^No$/i : /^Yes$/i, "business-location-type");
    await clickAndVerify([/^Next$/i], async () => await heading(expectedNext), "location-type-next");
  }
  if (
    s.businessType !== "SERVICE_AREA" &&
    (await heading(/address|located/i))
  ) {
    await fillVerified([/Street address/i], s.addressLine, "street-address");
    await fillVerified([/Suburb|City/i], s.city, "suburb-city");
    await fillVerified([/Postcode|Postal/i], s.postalCode, "postcode");
    await next();
  }
  if (await heading(/Where do you serve/i)) {
    for (const a of (s.serviceAreas || []).slice(0, 20)) {
      await fillVerified([/Search and select areas/i], a.placeName, `service-area-${a.placeName}`);
      await page.waitForTimeout(400);
      await suggestionVerified(a.placeName, `service-area-${a.placeName}`);
    }
    await next();
  }
  if (await heading(/contact details/i)) {
    await fillVerified([/^Phone number/i], s.phone, "phone-number");
    await fillVerified([/Website/i], s.websiteUri, "website");
    if (s.chatEnabled) {
      await clickAndVerify([/Text message/i], async () => true, "chat-text-message");
      await fillVerified([/Contact phone number/i], s.chatPhone || s.phone, "chat-phone-number");
    }
    await next();
  }
  if (await heading(/postal address to verify/i)) {
    const a = s.verificationAddress || {};
    await fillVerified([/Street address/i], a.addressLine, "verification-street-address");
    await fillVerified([/Suburb|City/i], a.city, "verification-suburb-city");
    await fillVerified([/Postcode|Postal/i], a.postalCode, "verification-postcode");
    await clickAndVerify([/Verify later/i, /Later/i], async () => await waitForHeading(/Add your services/i), "verify-later");
  }
  if (await heading(/Add your services/i)) {
    for (const service of s.services || []) {
      const x = page.getByText(service, { exact: true });
      if (await shown(x)) {
        const beforeClass = await x.getAttribute("class").catch(() => "");
        await x.click();
        await page.waitForTimeout(250);
        const afterClass = await x.getAttribute("class").catch(() => "");
        const selected = await x.evaluate((node) => {
          const el = node.closest('[role="checkbox"], [aria-checked], button') || node;
          return el.getAttribute("aria-checked") === "true" || el.getAttribute("aria-pressed") === "true" || /selected|checked/i.test(el.className || "");
        }).catch(() => false);
        if (!selected && beforeClass === afterClass)
          await failStep(`Clicked service "${service}", but no selected state was detected.`, `service-${service}-not-selected`);
        await screenshotStep(`service-${service}-selected`);
      }
    }
    for (const custom of s.customServices || []) {
      if (await click([/Add custom service/i])) {
        await fillVerified([/service name/i], custom, `custom-service-${custom}`);
        await click([/^Save$/i, /^Add$/i]);
        await screenshotStep(`custom-service-${custom}-saved`);
      }
    }
    await next();
  }
  if (await heading(/opening hours/i)) {
    if (s.allDay)
      for (const day of [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ]) {
        const row = page.getByText(day, { exact: true }).locator("xpath=..");
        const x = row
          .locator('input[type="checkbox"],button[role="switch"]')
          .first();
        if ((await x.count()) && !(await x.isChecked().catch(() => false))) {
          await x.click();
          await page.waitForTimeout(200);
        }
        const enabled = await x.isChecked().catch(async () => (await x.getAttribute("aria-checked")) === "true");
        if ((await x.count()) && !enabled)
          await failStep(`${day} was not visibly enabled in opening hours.`, `opening-hours-${day}-failed`);
      }
    await screenshotStep("opening-hours-configured");
    await next();
  }
  if (await heading(/business description/i)) {
    await fillVerified([/description/i], s.description, "business-description");
    await next();
  }
  if (await heading(/shop front photo/i)) {
    if (await upload(s.shopFrontPhoto ? [s.shopFrontPhoto] : [])) await next();
    else await click([/^Skip$/i, /^Next$/i]);
  }
  if (await heading(/photos of your work/i)) {
    if (await upload(s.workPhotos || [])) await next();
    else await click([/^Skip$/i]);
  }
  if (await heading(/advertising credit/i))
    await clickAndVerify([/^Skip$/i], async () => await waitForHeading(/custom domain name/i), "advertising-credit-skip");
  if (await heading(/custom domain name/i))
    await clickAndVerify([/^Skip$/i], async () => await waitForHeading(/edits will be visible/i), "custom-domain-skip");
  if (await heading(/edits will be visible/i))
    await clickAndVerify([/^Continue$/i], async () => fixtureUrl ? await waitForHeading(/Simulation complete/i) : true, "profile-onboarding-continue");
  await page.waitForTimeout(2500);
  console.log(
    payload.dryRun
      ? `Dry run finished for ${s.title}. ${fixtureUrl ? "All simulated pages were verified; no Google page was contacted." : "No profile was submitted or created."}`
      : `Profile onboarding completed for ${s.title}. Verification was not submitted.`,
  );
  await page
    .screenshot({
      path: path.join(
        root,
        ".gmb-browser-state",
        `profile-${String(payload.draftId || Date.now()).replace(/[^a-z0-9_-]/gi, "")}.png`,
      ),
      fullPage: true,
    })
    .catch(() => {});
  await page.waitForTimeout(fixtureUrl ? 100 : 30000);
} catch (error) {
  console.error(error.message);
  await page
    .screenshot({
      path: path.join(root, ".gmb-browser-state", "profile-create-error.png"),
      fullPage: true,
    })
    .catch(() => {});
  process.exitCode = 1;
} finally {
  await context.close();
}
