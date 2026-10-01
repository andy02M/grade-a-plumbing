import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
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
const browserProfilePath = fixtureUrl
  ? path.join(path.dirname(process.argv[i + 1]), `fixture-browser-${String(payload.draftId || "test").replace(/[^a-z0-9_-]/gi, "")}`)
  : path.join(
      root,
      ".gmb-browser-profiles",
      crypto.createHash("sha256").update(String(payload.email || "").trim().toLowerCase()).digest("hex").slice(0, 24),
    );
await fs.mkdir(stateDir, { recursive: true });
let stepIndex = 0;
const context = await chromium.launchPersistentContext(
  browserProfilePath,
  {
    channel: "msedge",
    headless: Boolean(fixtureUrl),
    ...(fixtureUrl
      ? { viewport: { width: 1440, height: 1000 } }
      : {
          viewport: null,
          slowMo: 250,
          args: ["--start-maximized", "--disable-background-mode"],
        }),
  },
);
const page = context.pages()[0] || (await context.newPage());
if (!fixtureUrl) await page.bringToFront();
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
async function visibleCount(locator) {
  const count = await locator.count().catch(() => 0);
  let visible = 0;
  for (let index = 0; index < count; index += 1) {
    if (await locator.nth(index).isVisible().catch(() => false)) visible += 1;
  }
  return visible;
}
async function firstVisibleLocator(locator, timeoutMs = 0) {
  const deadline = Date.now() + timeoutMs;
  do {
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const candidate = locator.nth(index);
      if (await candidate.isVisible().catch(() => false)) return candidate;
    }
    if (Date.now() < deadline) await page.waitForTimeout(250);
  } while (Date.now() < deadline);
  return null;
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
async function addCustomServiceVerified(value) {
  const before = await visibleCount(page.locator('input[maxlength="120"], textarea[maxlength="120"]'));
  if (!(await click([/Add custom service/i]))) {
    await failStep(`Could not open a custom service field for "${value}".`, `custom-service-${value}-field-missing`);
  }
  await page.waitForTimeout(350);
  const prompt = page.getByText(/Don.t see a service you offer\?\s*Create your own/i).first();
  const candidates = [
    page.locator('input[maxlength="120"], textarea[maxlength="120"]').filter({ visible: true }).last(),
    prompt.locator('xpath=following::*[self::input or self::textarea][1]'),
  ];
  let input = null;
  for (const candidate of candidates) {
    if (await candidate.count().catch(() => 0) && await candidate.isVisible().catch(() => false)) {
      input = candidate;
      break;
    }
  }
  if (!input) {
    await failStep(`Google opened custom services but no editable field appeared for "${value}".`, `custom-service-${value}-input-missing`);
  }
  await input.fill(String(value));
  await input.press("Tab").catch(() => {});
  await page.waitForTimeout(350);
  const actual = await input.inputValue().catch(() => "");
  const after = await visibleCount(page.locator('input[maxlength="120"], textarea[maxlength="120"]'));
  if (actual.trim() !== String(value).trim() || after < Math.max(1, before)) {
    await failStep(`Custom service "${value}" was not retained in Google's visible field.`, `custom-service-${value}-not-retained`);
  }
  console.log(`Verified custom service: ${actual}`);
  await screenshotStep(`custom-service-${value}-saved`);
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
async function serviceAreaSuggestionVerified(value, description) {
  const base = String(value).replace(/,?\s+(?:VIC|Victoria)(?:\s+\d{4})?(?:,?\s+Australia)?$/i, "").trim();
  // Google presents Melbourne CBD as a two-line suggestion headed "CBD"
  // with "Melbourne VIC, Australia" underneath. Keep this alias deliberately
  // narrow and still require the configured region/country below.
  const areaAliases = /^Melbourne\s+CBD$/i.test(base) ? [base, "CBD"] : [base];
  const matchesAreaName = (text) => areaAliases.some((alias) =>
    text.toLowerCase().includes(alias.toLowerCase()),
  );
  const configuredLocation = String(s.serviceAreaSuggestionLocation || "VIC, Australia").trim();
  const locationParts = configuredLocation.split(",").map((part) => part.trim()).filter(Boolean);
  const matchesConfiguredLocation = (text) => locationParts.every((part) =>
    /^(?:VIC|Victoria)$/i.test(part)
      ? /\b(?:VIC|Victoria)\b/i.test(text)
      : text.toLowerCase().includes(part.toLowerCase()),
  );
  const scopes = [
    page.getByRole("option"),
    page.locator('[role="listbox"] [role="option"], [role="listbox"] li'),
  ];
  let selectedText = "";
  const deadline = Date.now() + (fixtureUrl ? 500 : 10000);
  while (Date.now() < deadline && !selectedText) {
    for (const scope of scopes) {
      const count = await scope.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const option = scope.nth(index);
        if (!(await option.isVisible().catch(() => false))) continue;
        const text = (await option.innerText().catch(() => "")).trim();
        if (
          matchesAreaName(text) &&
          matchesConfiguredLocation(text)
        ) {
          await option.click();
          selectedText = text;
          break;
        }
      }
      if (selectedText) break;
    }
    if (!selectedText) await page.waitForTimeout(250);
  }
  if (!selectedText) {
    // Service areas are optional and Google does not recognize every locality
    // name. Preserve evidence, clear the unsuccessful query, and continue to
    // the next configured suburb without selecting a similarly named place.
    const areaField = page.getByLabel(/Search and select areas/i).first();
    await screenshotStep(`${description}-unavailable-skipped`);
    await areaField.fill("").catch(() => {});
    await page.keyboard.press("Escape").catch(() => {});
    console.log(`Skipped unavailable service area: ${base} (no exact ${configuredLocation} suggestion).`);
    return false;
  }
  await page.waitForTimeout(500);
  const body = await page.locator("body").innerText().catch(() => "");
  const areaField = page.getByLabel(/Search and select areas/i).first();
  const fieldValue = await areaField.inputValue().catch(() => "");
  const chipVisible = matchesAreaName(body) && matchesConfiguredLocation(body);
  const visibleOrRetained = chipVisible || (
    matchesAreaName(fieldValue) &&
    matchesConfiguredLocation(fieldValue)
  );
  if (!visibleOrRetained || !matchesConfiguredLocation(selectedText)) {
    await failStep(`Selected ${description}, but the visible chip did not match "${configuredLocation}".`, `${clean(description)}-configured-location-selection-unverified`);
  }
  if (fieldValue && !matchesAreaName(fieldValue)) {
    await areaField.fill("").catch(() => {});
  }
  console.log(`Verified ${description} selection: ${selectedText}`);
  await screenshotStep(`${description}-selected`);
  return true;
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
    // Google occasionally paints the radio as checked before its Material form
    // controller has enabled Next. Wait for the real action state and, if
    // necessary, click the visible label to deliver the user-level event its
    // controller expects. Never click a disabled Next button.
    const nextButton = page.getByRole("button", { name: /^Next$/i }).first();
    const nextEnabled = async () =>
      (await nextButton.count().catch(() => 0)) > 0 &&
      (await nextButton.isVisible().catch(() => false)) &&
      (await nextButton.isEnabled().catch(() => false)) &&
      (await nextButton.getAttribute("aria-disabled").catch(() => null)) !== "true";
    let ready = false;
    for (let attempt = 0; attempt < 20 && !ready; attempt += 1) {
      ready = await nextEnabled();
      if (!ready) await page.waitForTimeout(250);
    }
    if (!ready) {
      const label = page.getByText(name, { exact: true }).last();
      if ((await label.count().catch(() => 0)) && (await label.isVisible().catch(() => false))) await label.click().catch(() => {});
      await choice.focus().catch(() => {});
      await choice.press("Space").catch(() => {});
      for (let attempt = 0; attempt < 20 && !ready; attempt += 1) {
        ready = await nextEnabled();
        if (!ready) await page.waitForTimeout(250);
      }
    }
    if (!ready) await failStep(`Selected ${description}, but Google's Next button stayed disabled.`, `${clean(description)}-next-disabled`);
    await screenshotStep(`${description}-selected`);
    return;
  }
  await failStep(`Could not find selectable choice for ${description}.`, `${clean(description)}-missing`);
}
async function setOpeningDateVerified(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return;
  const [year, month, day] = value.split("-");
  const monthName = new Intl.DateTimeFormat("en-AU", { month: "long", timeZone: "UTC" }).format(new Date(`${year}-${month}-01T00:00:00Z`));
  const openingDate = await firstVisibleLocator(page.getByText(/^Opening date$/i, { exact: true }), 10000);
  if (!openingDate)
    await failStep("Opening date was not visible in Edit profile.", "post-create-opening-date-missing");
  await openingDate.click();
  await page.waitForTimeout(350);
  const yearInput = await firstVisibleLocator(
    page.getByPlaceholder(/^Year/i).or(page.getByRole("textbox", { name: /^Year/i })),
    10000,
  );
  if (!yearInput)
    await failStep("Opening date editor did not open.", "post-create-opening-date-editor-missing");
  await yearInput.fill(year);
  const chooseDatePart = async (name, option) => {
    const control = await firstVisibleLocator(
      page.getByRole("combobox", { name }).or(page.getByText(name, { exact: false })),
      10000,
    );
    if (!control)
      await failStep(`${name} control was not visible in Opening date.`, `post-create-${name}-missing`);
    await control.click();
    const choice = await firstVisibleLocator(
      page.getByRole("option", { name: option, exact: true }).or(page.getByText(option, { exact: true })),
      10000,
    );
    if (!choice)
      await failStep(`${option} was not available in Opening date.`, `post-create-${name}-option-missing`);
    await choice.click();
  };
  await chooseDatePart(/Month/i, monthName);
  await chooseDatePart(/Day/i, String(Number(day)));
  const save = await firstVisibleLocator(page.getByRole("button", { name: /^Save$/i }), 10000);
  if (!save) await failStep("Save was not visible in Opening date.", "post-create-opening-date-save-missing");
  await save.click();
  await page.waitForTimeout(600);
  if (await yearInput.isVisible().catch(() => false))
    await failStep("Opening date Save did not close the editor.", "post-create-opening-date-save-failed");
  const body = await page.locator("body").innerText();
  if (!body.includes(year)) await failStep("Saved opening date was not visibly confirmed.", "post-create-opening-date-unverified");
  await screenshotStep("post-create-opening-date-verified");
}
async function setAttributeGroupVerified(groupName, labels) {
  const firstLabel = await firstVisibleLocator(page.getByText(labels[0], { exact: true }));
  if (!firstLabel) {
    const group = await firstVisibleLocator(page.getByText(groupName, { exact: true }), 10000);
    if (!group)
      await failStep(`${groupName} was not visible in Edit profile.`, `post-create-${groupName}-missing`);
    await group.click();
    await page.waitForTimeout(350);
  }
  for (const label of labels) {
    const labelNode = await firstVisibleLocator(page.getByText(label, { exact: true }), 10000);
    if (!labelNode)
      await failStep(`${label} was not available in ${groupName}.`, `post-create-${label}-missing`);
    const row = labelNode.locator("xpath=ancestor::*[.//button[normalize-space()='Yes'] and .//button[normalize-space()='No']][1]");
    const desired = s.attributes?.[label] === true ? "Yes" : "No";
    const choice = row.getByRole("button", { name: new RegExp(`^${desired}$`, "i") }).first();
    if (!(await choice.isVisible().catch(() => false)))
      await failStep(`${desired} was not available for ${label}.`, `post-create-${label}-${desired}-missing`);
    await choice.click();
    await page.waitForTimeout(180);
    const selected = await choice.evaluate((node) =>
      node.getAttribute("aria-pressed") === "true" || node.getAttribute("aria-checked") === "true" || /selected|checked|activated/i.test(node.className || "") || !!node.querySelector("svg"),
    ).catch(() => false);
    if (!selected) await failStep(`${label} did not visibly select ${desired}.`, `post-create-${label}-selection-unverified`);
  }
  const save = await firstVisibleLocator(page.getByRole("button", { name: /^Save$/i }), 10000);
  if (!save)
    await failStep(`Save was not visible for ${groupName}.`, `post-create-${groupName}-save-missing`);
  await save.click();
  await page.waitForTimeout(600);
  if (await save.isVisible().catch(() => false))
    await failStep(`${groupName} did not close after Save.`, `post-create-${groupName}-save-failed`);
  await screenshotStep(`post-create-${groupName}-verified`);
}
async function configurePostCreationProfile() {
  if (!(await click([/^Edit profile$/i])))
    await failStep("Edit profile was not available after onboarding.", "post-create-edit-profile-missing");
  const businessInformation = await firstVisibleLocator(
    page.getByText(/^Business information$/i, { exact: true }),
    30000,
  );
  if (!businessInformation)
    await failStep("Edit profile did not open Business information.", "post-create-business-information-missing");
  await screenshotStep("post-create-edit-profile-opened");
  await setOpeningDateVerified(s.openingDate);
  const moreTab = await firstVisibleLocator(
    page.getByRole("tab", { name: /^More$/i }).or(page.getByText(/^More$/i, { exact: true })),
    10000,
  );
  if (!moreTab)
    await failStep("More tab was not visible in Business information.", "post-create-more-tab-missing");
  await moreTab.click();
  await page.waitForTimeout(500);
  const groups = [
    ["From the business", ["Identifies as women-owned"]],
    ["Crowd", ["LGBTQ+ friendly"]],
    ["Offerings", ["Offers repair services"]],
    ["Payments", ["Cash only", "Accepts credit cards", "Credit cards", "American Express", "China Union Pay", "Diners Club", "Discover", "JCB", "Mastercard", "VISA", "Accepts NFC mobile payments"]],
    ["Service options", ["Offers online estimates"]],
  ];
  for (const [group, labels] of groups) await setAttributeGroupVerified(group, labels);
  await screenshotStep("post-create-attributes-complete");
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
    await clickAndVerify(
      [/^Next$/i],
      async () => await waitForHeading(expectedNext, 30000),
      "location-type-next",
    );
  }
  if (
    s.businessType !== "SERVICE_AREA" &&
    (await heading(/address|located/i))
  ) {
    await fillVerified([/Street address/i], s.addressLine, "street-address");
    await fillVerified([/Suburb|City/i], s.city, "suburb-city");
    await fillVerified([/Postcode|Postal/i], s.postalCode, "postcode");
    await clickAndVerify(
      [/^Next$/i],
      async () => await waitForHeading(/contact details|verify your business|Add your services/i, 30000),
      "business-address-next",
    );
  }
  if (await heading(/Where do you serve/i)) {
    for (const a of (s.serviceAreas || []).slice(0, 20)) {
      const areaName = String(a.placeName || "").replace(/,?\s+(?:VIC|Victoria)(?:\s+\d{4})?(?:,?\s+Australia)?$/i, "").trim();
      const configuredLocation = String(s.serviceAreaSuggestionLocation || "VIC, Australia").trim();
      const query = `${areaName}, ${configuredLocation}`;
      await fillVerified([/Search and select areas/i], query, `service-area-${areaName}`);
      await page.waitForTimeout(400);
      await serviceAreaSuggestionVerified(areaName, `service-area-${areaName}`);
    }
    await clickAndVerify(
      [/^Next$/i],
      async () => await waitForHeading(/contact details|postal address to verify|verify your business/i, 30000),
      "service-areas-next",
    );
  }
  if (await heading(/contact details/i)) {
    await fillVerified([/^Phone number/i], s.phone, "phone-number");
    await fillVerified([/Website/i], s.websiteUri, "website");
    if (s.chatEnabled) {
      await clickAndVerify([/Text message/i], async () => true, "chat-text-message");
      await fillVerified([/Contact phone number/i], s.chatPhone || s.phone, "chat-phone-number");
    } else {
      // Chat is optional. When the owner has not explicitly enabled it, leave
      // the entire section untouched: do not open its selector and do not fill
      // its dependent contact-number field.
      console.log("Optional chat ignored as requested.");
      await screenshotStep("chat-optional-ignored");
    }
    await clickAndVerify(
      [/^Next$/i],
      async () => await waitForHeading(
        /postal address to verify|mailing address to verify|verify your business|verification|Add your services/i,
        30000,
      ),
      "contact-details-next",
    );
  }
  if (await heading(/postal address to verify|mailing address.*verify|address.*verification/i)) {
    // Verification is always a manual owner task. Do not populate or submit the
    // private verification address; explicitly defer it and prove Google moved
    // on before the automation continues.
    await screenshotStep("manual-verification-address-page-detected");
    await clickAndVerify(
      [/^Verify later$/i, /^Do this later$/i, /^Later$/i, /^Skip$/i],
      async () => await waitForHeading(/Add your services|(?:opening|business) hours|business description/i, 30000),
      "verify-later",
    );
  }
  if (await heading(/Add your services/i)) {
    // Google initially collapses part of the category's service catalogue.
    // Expand every visible Show more control before looking for services so
    // configured services cannot be silently skipped merely because hidden.
    for (let expansion = 0; expansion < 8; expansion += 1) {
      const showMore = page.getByRole("button", { name: /Show more/i }).filter({ visible: true }).first();
      if (!(await showMore.count().catch(() => 0)) || !(await showMore.isVisible().catch(() => false))) break;
      const beforeBody = await page.locator("body").innerText().catch(() => "");
      await showMore.click().catch(async () => await showMore.click({ force: true }));
      await page.waitForTimeout(500);
      const afterBody = await page.locator("body").innerText().catch(() => "");
      const stillVisible = await showMore.isVisible().catch(() => false);
      if (beforeBody === afterBody && stillVisible) {
        await failStep("Clicked Show more, but the visible services did not expand.", "services-show-more-unverified");
      }
      await screenshotStep(`services-show-more-${expansion + 1}-expanded`);
    }
    if (await page.getByRole("button", { name: /Show more/i }).first().isVisible().catch(() => false)) {
      await failStep("Google still shows a collapsed service list after expansion attempts.", "services-still-collapsed");
    }
    for (const service of s.services || []) {
      // Google uses both "waste disposal" and "garbage disposal" for the
      // same plumber services depending on the current UI/locale rollout.
      const servicePattern = /^Waste disposal installation$/i.test(service)
        ? /^(?:Waste|Garbage) disposal installation$/i
        : /^Waste disposal repair$/i.test(service)
          ? /^(?:Waste|Garbage) disposal repair$/i
          : new RegExp(`^${String(service).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      const x = page.getByText(servicePattern, { exact: true });
      if (await shown(x)) {
        const control = x.locator("xpath=ancestor-or-self::*[@role='checkbox' or @aria-checked or @aria-pressed or self::button][1]");
        const target = (await control.count().catch(() => 0)) ? control : x;
        const selectedBefore = await target.evaluate((node) => {
          const el = node.closest('[role="checkbox"], [aria-checked], [aria-pressed], button') || node;
          return el.getAttribute("aria-checked") === "true" || el.getAttribute("aria-pressed") === "true" || /selected|checked/i.test(el.className || "");
        }).catch(() => false);
        const beforeClass = await target.getAttribute("class").catch(() => "");
        if (!selectedBefore) {
          await target.click().catch(async () => {
            // Google Material's decorative ripple can intercept a normal click.
            // Clicking the semantic control directly is safe and still verified below.
            await target.click({ force: true });
          });
        }
        await page.waitForTimeout(250);
        const afterClass = await target.getAttribute("class").catch(() => "");
        const selected = await target.evaluate((node) => {
          const el = node.closest('[role="checkbox"], [aria-checked], button') || node;
          return el.getAttribute("aria-checked") === "true" || el.getAttribute("aria-pressed") === "true" || /selected|checked/i.test(el.className || "");
        }).catch(() => false);
        if (!selected && beforeClass === afterClass)
          await failStep(`Clicked service "${service}", but no selected state was detected.`, `service-${service}-not-selected`);
        await screenshotStep(`service-${service}-selected`);
      }
    }
    for (const custom of s.customServices || []) {
      await addCustomServiceVerified(custom);
    }
    await clickAndVerify(
      [/^Next$/i],
      async () => await waitForHeading(/(?:opening|business) hours|business description|shop front photo|photos of your work/i, 30000),
      "services-next",
    );
  }
  if (await heading(/(?:opening|business) hours/i)) {
    if (s.allDay)
      for (const [dayIndex, day] of [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ].entries()) {
        const dayLabel = page.getByText(day, { exact: true }).first();
        const expandedRow = dayLabel.locator(
          "xpath=ancestor::*[.//*[@role='switch'] or .//input[@type='checkbox']][1]",
        );
        const row = (await expandedRow.count().catch(() => 0))
          ? expandedRow
          : dayLabel.locator("xpath=..");
        let x = row
          .locator('input[type="checkbox"],button[role="switch"]')
          .first();
        const semanticToggleFound = (await x.count().catch(() => 0)) > 0 && (await x.isVisible().catch(() => false));
        const closedLabels = page.getByText(/^Closed$/i, { exact: true });
        const closedBefore = await visibleCount(closedLabels);
        let visualTogglePoint = null;
        if (!semanticToggleFound) {
          // Google's live onboarding switches are unlabeled Material divs and
          // their generated class names change. Anchor the click to the visible
          // Closed label on the same weekday row instead of a CSS class.
          const closedForDay = dayLabel.locator("xpath=following::*[normalize-space()='Closed'][1]");
          const dayBox = await dayLabel.boundingBox().catch(() => null);
          const closedBox = await closedForDay.boundingBox().catch(() => null);
          if (!dayBox || !closedBox || Math.abs((dayBox.y + dayBox.height / 2) - (closedBox.y + closedBox.height / 2)) > 45) {
            await failStep(`${day} opening-hours switch could not be identified.`, `opening-hours-${day}-switch-missing`);
          }
          visualTogglePoint = { x: Math.max(dayBox.x + dayBox.width + 10, closedBox.x - 28), y: closedBox.y + closedBox.height / 2 };
        }
        const checkedBefore = semanticToggleFound
          ? await x.isChecked().catch(async () => (await x.getAttribute("aria-checked").catch(() => null)) === "true")
          : false;
        if (!checkedBefore) {
          if (semanticToggleFound) await x.click();
          else await page.mouse.click(visualTogglePoint.x, visualTogglePoint.y);
          await page.waitForTimeout(400);
        }
        const enabled = semanticToggleFound
          ? await x.isChecked().catch(async () => (await x.getAttribute("aria-checked").catch(() => null)) === "true")
          : (await visibleCount(closedLabels)) < closedBefore;
        if (!enabled)
          await failStep(`${day} was not visibly enabled in opening hours.`, `opening-hours-${day}-failed`);
        await page.waitForTimeout(250);
        const hoursText = page.getByText(/^(?:Open\s*)?24\s*hours$/i, { exact: true });
        const dayShows24Hours = async () => {
          const dayBox = await dayLabel.boundingBox().catch(() => null);
          if (!dayBox) return false;
          const count = await hoursText.count().catch(() => 0);
          for (let index = 0; index < count; index += 1) {
            const box = await hoursText.nth(index).boundingBox().catch(() => null);
            if (box && Math.abs((box.y + box.height / 2) - (dayBox.y + dayBox.height / 2)) < 50) return true;
          }
          // In Google's live Material form, the chosen "24 hours" is stored
          // as the Opens at input value rather than rendered as a text node.
          const inputs = page.locator("input");
          const inputCount = await inputs.count().catch(() => 0);
          for (let index = 0; index < inputCount; index += 1) {
            const input = inputs.nth(index);
            if (!(await input.isVisible().catch(() => false))) continue;
            const value = await input.inputValue().catch(() => "");
            if (!/^(?:Open\s*)?24\s*hours$/i.test(value.trim())) continue;
            const box = await input.boundingBox().catch(() => null);
            if (box && Math.abs((box.y + box.height / 2) - (dayBox.y + dayBox.height / 2)) < 50) return true;
          }
          return false;
        };
        if (!(await dayShows24Hours())) {
          const allTimeControls = page.locator('[role="combobox"], select').or(
            page.getByRole("button", { name: /\b(?:am|pm)\b|\d{1,2}:\d{2}/i }),
          ).or(
            page.getByPlaceholder(/Opens at|Closes at/i),
          ).or(
            page.getByRole("textbox", { name: /Opens at|Closes at/i }),
          );
          const dayBox = await dayLabel.boundingBox();
          const nearbyControls = [];
          const allCount = await allTimeControls.count().catch(() => 0);
          for (let index = 0; index < allCount; index += 1) {
            const control = allTimeControls.nth(index);
            if (!(await control.isVisible().catch(() => false))) continue;
            const box = await control.boundingBox().catch(() => null);
            if (box && Math.abs((box.y + box.height / 2) - (dayBox.y + dayBox.height / 2)) < 55)
              nearbyControls.push(control);
          }
          let selected24Hours = false;
          // Use Google's opening-time control first. Its menu exposes the
          // special 24-hour option used by the live onboarding flow.
          for (const control of nearbyControls) {
            if (!(await control.isVisible().catch(() => false))) continue;
            const controlBox = await control.boundingBox().catch(() => null);
            if (!controlBox) continue;
            // Google ignores synthetic HTMLElement.click() on these Material
            // time inputs. A pointer click at the verified visible control
            // creates the trusted interaction needed to open its menu.
            await page.mouse.click(controlBox.x + controlBox.width / 2, controlBox.y + controlBox.height / 2);
            await page.waitForTimeout(350);
            await screenshotStep(`opening-hours-${day}-time-menu-open`);
            const optionCandidates = [
              page.getByRole("option", { name: /24\s*hours|open\s*24/i }).first(),
              page.getByRole("menuitem", { name: /24\s*hours|open\s*24/i }).first(),
              page.getByText(/^(?:Open\s*)?24\s*hours$/i, { exact: true }).last(),
            ];
            for (const option of optionCandidates) {
              if (!(await option.count().catch(() => 0)) || !(await option.isVisible().catch(() => false))) continue;
              await option.click().catch(async () => await option.click({ force: true }));
              selected24Hours = true;
              break;
            }
          }
          await page.waitForTimeout(250);
          if (!selected24Hours || !(await dayShows24Hours())) {
            await failStep(`${day} was enabled, but 24-hour opening was not visibly selected.`, `opening-hours-${day}-24-hours-failed`);
          }
        }
        await screenshotStep(`opening-hours-${day}-24-hours-verified`);
      }
    await screenshotStep("opening-hours-configured");
    await clickAndVerify(
      [/^Next$/i],
      async () => await waitForHeading(/business description|(?:shop\s*front|store\s*front|storefront) photo|photos of your work/i, 30000),
      "opening-hours-next",
    );
  }
  if (await heading(/business description/i)) {
    await fillVerified([/description/i], s.description, "business-description");
    await clickAndVerify(
      [/^Next$/i],
      async () => await waitForHeading(/(?:shop\s*front|store\s*front|storefront) photo|photos of your work/i, 30000),
      "business-description-next",
    );
  }
  if (await heading(/(?:shop\s*front|store\s*front|storefront) photo/i)) {
    if (await upload(s.shopFrontPhoto ? [s.shopFrontPhoto] : [])) {
      await clickAndVerify(
        [/^Next$/i],
        async () => await waitForHeading(/photos of your work|advertising credit/i, 30000),
        "shop-front-photo-next",
      );
    } else {
      await clickAndVerify(
        [/^Skip$/i, /^Next$/i],
        async () => await waitForHeading(/photos of your work|advertising credit/i, 30000),
        "shop-front-photo-skip",
      );
    }
  }
  if (await heading(/photos of your work/i)) {
    if (await upload(s.workPhotos || [])) {
      await clickAndVerify(
        [/^Next$/i],
        async () => await waitForHeading(/advertising credit|custom domain name|edits will be visible/i, 30000),
        "work-photos-next",
      );
    } else {
      await clickAndVerify(
        [/^Skip$/i],
        async () => await waitForHeading(/advertising credit|custom domain name|edits will be visible/i, 30000),
        "work-photos-skip",
      );
    }
  }
  if (await heading(/advertising credit/i))
    await clickAndVerify([/^Skip$/i], async () => await waitForHeading(/custom domain name/i), "advertising-credit-skip");
  if (await heading(/custom domain name/i))
    await clickAndVerify([/^Skip$/i], async () => await waitForHeading(/edits will be visible/i), "custom-domain-skip");
  if (await heading(/edits will be visible/i))
    await clickAndVerify(
      [/^Continue$/i],
      async () => fixtureUrl
        ? await waitForHeading(/Simulation complete/i)
        : await page.getByText(/^Edit profile$/i, { exact: true }).first().waitFor({ state: "visible", timeout: 30000 }).then(() => true).catch(() => false),
      "profile-onboarding-continue",
    );
  if (!fixtureUrl && await page.getByText(/^Edit profile$/i, { exact: true }).first().isVisible().catch(() => false))
    await configurePostCreationProfile();
  await page.waitForTimeout(2500);
  if (
    !payload.dryRun &&
    !fixtureUrl &&
    !(
      await heading(
        /edits will be visible|your business profile|your business is not visible|manage your business profile/i,
      )
    )
  ) {
    await failStep(
      `The runner reached an unhandled page "${await pageHeadingText()}" and will not report onboarding success.`,
      "profile-onboarding-incomplete",
    );
  }
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
