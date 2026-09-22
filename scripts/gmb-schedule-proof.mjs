import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = "https://gmb-autopilot-fawn.vercel.app";
const output = path.join(root, "artifacts", "automation");
const context = await chromium.launchPersistentContext(path.join(root, ".gmb-browser-profile"), {
  channel: "msedge",
  headless: true,
  viewport: { width: 1440, height: 1100 }
});

try {
  await fs.mkdir(output, { recursive: true });
  const page = await context.newPage();
  await page.goto(`${app}/dashboard`, { waitUntil: "networkidle" });
  if (!page.url().startsWith(`${app}/dashboard`)) throw new Error("Dashboard session expired.");
  await page.getByRole("heading", { name: "Make every profile count." }).waitFor();
  await page.screenshot({ path: path.join(output, "gmb-schedule-overview.png"), fullPage: true });
  await page.getByRole("navigation", { name: "Automation menu" }).getByRole("button", { name: /Schedule/ }).click();
  await page.getByText("Saved publishing queue", { exact: true }).waitFor();
  await page.getByLabel("Filter post status").selectOption("SCHEDULED");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(output, "gmb-scheduled-queue.png"), fullPage: false });
  const state = await page.evaluate(async () => (await fetch("/api/automation/state", { cache: "no-store" })).json());
  const inRange = state.posts.filter(post => {
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: post.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(post.scheduledFor));
    return date >= "2026-10-01" && date <= "2026-12-31" && post.status !== "CANCELLED";
  });
  console.log(JSON.stringify({ total: inRange.length, statuses: Object.groupBy(inRange, post => post.status), first: inRange[0]?.scheduledFor, last: inRange.at(-1)?.scheduledFor }, null, 2));
} finally {
  await context.close();
}
