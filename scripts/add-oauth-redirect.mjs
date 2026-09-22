import path from "node:path";
import { chromium } from "playwright";

const uri = "https://gmb-autopilot-fawn.vercel.app/api/google/oauth/callback";
const profileDir = path.resolve(".gmb-browser-profile");
const clientUrl =
  "https://console.cloud.google.com/auth/clients/372601706543-u24k0l3m0hu5u1rj26opkbm8nk2bb41h.apps.googleusercontent.com?project=grade-a-plumbing-maps";

const context = await chromium.launchPersistentContext(profileDir, {
  channel: "msedge",
  headless: false,
  viewport: { width: 1500, height: 1000 }
});

const page = context.pages()[0] || await context.newPage();
page.setDefaultTimeout(30_000);

try {
  await page.goto(clientUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);

  let redirectInputs = page.locator('input[placeholder="https://www.example.com"]');
  let values = await redirectInputs.evaluateAll((items) => items.map((item) => item.value));
  console.log(`Redirect values before: ${JSON.stringify(values)}`);

  if (!values.includes(uri)) {
    if ((await redirectInputs.count()) < 2) {
      await page.locator('button[aria-label="Add URI"]').nth(1).click({ force: true });
      await page.waitForTimeout(1500);
    }
    redirectInputs = page.locator('input[placeholder="https://www.example.com"]');
    await redirectInputs.last().fill(uri);
    await redirectInputs.last().dispatchEvent("input");
    await redirectInputs.last().dispatchEvent("change");
    await page.waitForTimeout(1000);
  }

  const saveResult = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const data = buttons.map((button, index) => ({ index, text: (button.innerText || "").trim(), aria: button.getAttribute("aria-label"), disabled: button.disabled, classes: button.className }));
    const save = buttons.find((button) => (button.innerText || "").trim() === "Save");
    if (!save) return { clicked: false, data };
    save.click();
    return { clicked: true, data };
  });
  console.log(`Save result: ${JSON.stringify(saveResult).slice(0, 20000)}`);
  await page.waitForTimeout(12000);

  const verify = await context.newPage();
  await verify.goto(clientUrl, { waitUntil: "domcontentloaded" });
  await verify.waitForTimeout(8000);
  values = await verify.locator('input[placeholder="https://www.example.com"]').evaluateAll((items) =>
    items.map((item) => item.value)
  );

  console.log(`Redirect values after reload: ${JSON.stringify(values)}`);
  console.log(values.includes(uri) ? "Saved redirect URI persisted." : "Saved URI did not persist.");
  await verify.screenshot({ path: ".gmb-browser-state/google-cloud-oauth-client-after-save.png", fullPage: true }).catch(() => {});
} finally {
  await context.close();
}
