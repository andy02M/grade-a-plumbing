import { chromium } from "playwright";
import path from "node:path";

const context = await chromium.launchPersistentContext(path.resolve(".gmb-browser-profile"), {
  channel: "msedge", headless: false, viewport: { width: 1440, height: 1000 },
});
const page = context.pages()[0] || await context.newPage();
page.setDefaultTimeout(15_000);

async function fillFollowingInput(label, value) {
  const labelNode = page.getByText(label, { exact: true }).first();
  if (!(await labelNode.isVisible())) throw new Error(`Missing branding field: ${label}`);
  const input = labelNode.locator('xpath=following::input[not(@type="file")][1]');
  await input.fill(value);
  if ((await input.inputValue()) !== value) throw new Error(`Branding value did not persist: ${label}`);
}

try {
  await page.goto("https://console.cloud.google.com/auth/branding?project=grade-a-plumbing-maps", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(7000);
  await fillFollowingInput("Application home page", "https://gmb-autopilot-fawn.vercel.app");
  await fillFollowingInput("Application privacy policy link", "https://gmb-autopilot-fawn.vercel.app/privacy");
  await fillFollowingInput("Application Terms of Service link", "https://gmb-autopilot-fawn.vercel.app/terms");
  await page.screenshot({ path: ".gmb-browser-state/oauth-branding-filled-before-save.png", fullPage: true });
  const save = page.getByRole("button", { name: "Save", exact: true });
  if (await save.isEnabled()) {
    await save.click();
    await page.waitForTimeout(5000);
  }
  await page.screenshot({ path: ".gmb-browser-state/oauth-branding-saved.png", fullPage: true });

  await page.goto("https://console.cloud.google.com/auth/audience?project=grade-a-plumbing-maps", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(7000);
  const publish = page.getByRole("button", { name: "Publish app", exact: true });
  if (!(await publish.isEnabled())) throw new Error("Publish app is still disabled after saving Branding.");
  await publish.click();
  await page.waitForTimeout(1200);
  const dialog = page.getByRole("dialog");
  console.log(`DIALOG=${JSON.stringify(await dialog.allTextContents())}`);
  if (await dialog.isVisible()) {
    const confirm = dialog.getByRole("button", { name: /Confirm|Publish/i }).last();
    if (!(await confirm.isVisible())) throw new Error("Google opened a publish dialog without a confirm button.");
    await confirm.click();
  } else {
    const confirm = page.getByRole("button", { name: "Confirm", exact: true }).last();
    if (!(await confirm.isVisible())) throw new Error("Google showed the publish confirmation without a visible Confirm button.");
    await confirm.click();
  }
  await page.waitForTimeout(7000);
  const body = await page.locator("body").innerText();
  console.log(body.slice(-5000));
  if (!/Publishing status\s+In production/i.test(body)) throw new Error("Audience page did not confirm In production status.");
  await page.screenshot({ path: ".gmb-browser-state/oauth-audience-in-production.png", fullPage: true });
  console.log("OAUTH_APP_PUBLISHED_IN_PRODUCTION");
} finally {
  await context.close();
}
