import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = "https://gmb-autopilot-fawn.vercel.app";
const values = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));
const startDate = String(values.start || "");
const endDate = String(values.end || "");
const apply = values.apply === true;
const syncMissing = values.syncMissing === true || values["sync-missing"] === true;

if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
  throw new Error("Use --start=YYYY-MM-DD --end=YYYY-MM-DD and optionally --apply.");
}

const context = await chromium.launchPersistentContext(path.join(root, ".gmb-browser-profile"), {
  channel: "msedge",
  headless: true
});

try {
  const page = await context.newPage();
  await page.goto(`${app}/dashboard`, { waitUntil: "domcontentloaded" });
  if (!page.url().startsWith(`${app}/dashboard`)) throw new Error("The GMB AutoPilot dashboard session has expired. Sign in again.");
  const state = await page.evaluate(async () => {
    const response = await fetch("/api/automation/state", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load dashboard state.");
    return data;
  });
  const profiles = state.profiles
    .filter(profile => profile.canOperateLocalPost !== false && !["SUSPENDED", "UNAVAILABLE", "VERIFICATION_REQUIRED", "NEEDS_VERIFICATION"].includes(profile.status))
    .filter((profile, index, all) => all.findIndex(other => profileKey(other) === profileKey(profile)) === index);
  let templates = state.templates.filter(template => /fun|trust|plumb|local|daily|help|service/i.test(`${template.name} ${template.text || template.summary || ""}`));
  let selectedTemplates = templates.length ? templates : state.templates;
  if (apply && !selectedTemplates.length) {
    const seeds = [
      ["Trust builder 01 · Bad timing", "Plumbing problems have a gift for terrible timing. {{business_name}} turns up, explains the options clearly, and gets things flowing again—with no mysterious plumber-speak. Need a hand? Give us a call."],
      ["Trust builder 02 · Pipe orchestra", "If your pipes have started their own percussion section, it may be time for a professional audience. {{business_name}} provides clear advice, careful workmanship, and practical plumbing solutions. Call us before the encore."],
      ["Trust builder 03 · Tiny drip", "A tiny drip is just your tap practising to become a bigger invoice. {{business_name}} can inspect the problem, explain what is needed, and fix it properly. Friendly service and straightforward communication—call today."],
      ["Trust builder 04 · DIY plot twist", "Every DIY plumbing video looks easy until the surprise indoor fountain appears. {{business_name}} brings the right tools, honest advice, and experienced workmanship. Save the towels and call a professional."],
      ["Trust builder 05 · Cold shower", "A cold shower builds character, but you probably have enough character already. {{business_name}} can help diagnose hot-water problems and explain the repair options clearly. Call us for dependable plumbing support."],
      ["Trust builder 06 · Drain patience", "Blocked drains are excellent at testing patience and terrible at respecting schedules. {{business_name}} offers practical help, clear communication, and tidy workmanship. Give us a call and let the water get back to work."],
      ["Trust builder 07 · Leak detective", "Water should stay inside the pipes—it is a simple rule, but leaks love breaking it. {{business_name}} will investigate carefully, explain the findings, and recommend a sensible fix. Call us when your plumbing goes off-script."]
    ];
    selectedTemplates = await page.evaluate(async entries => {
      const created = [];
      for (const [name, summary] of entries) {
        const response = await fetch("/api/automation/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, summary, ctaType: "CALL" })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Could not create ${name}.`);
        created.push(data.template);
      }
      return created;
    }, seeds);
  }
  const existingInRange = state.posts.filter(post => {
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: post.timezone || state.settings.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(post.scheduledFor));
    return localDate >= startDate && localDate <= endDate && post.status !== "CANCELLED";
  });
  const report = {
    authenticated: true,
    profiles: profiles.length,
    templates: selectedTemplates.map(template => ({ id: template.id, name: template.name })),
    existingInRange: existingInRange.length,
    range: { startDate, endDate },
    timezone: state.settings.timezone || "Australia/Melbourne"
  };
  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    if (!profiles.length) throw new Error("No eligible profiles are available.");
    if (!selectedTemplates.length) throw new Error("No templates are available. Create templates before scheduling.");
    const result = await page.evaluate(async body => {
      const response = await fetch("/api/automation/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Scheduling failed.");
      return data;
    }, {
      startDate,
      endDate,
      time: String(values.time || "09:00"),
      timezone: report.timezone,
      profileIds: profiles.map(profile => profile.id),
      templateIds: selectedTemplates.map(template => template.id),
      ...(syncMissing ? { action: "sync-missing" } : {})
    });
    console.log(JSON.stringify({ ...report, result }, null, 2));
  }
} finally {
  await context.close();
}

function profileKey(profile) {
  try {
    const url = profile.browserUrl ? new URL(profile.browserUrl) : undefined;
    const nativeId = url?.pathname.match(/\/n\/([0-9]+)/)?.[1];
    if (nativeId) return `browser:${nativeId}:${url?.searchParams.get("fid") || ""}`;
  } catch {}
  return profile.metadata?.placeId || profile.metadata?.duplicateLocation || profile.locationName;
}
