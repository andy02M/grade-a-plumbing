import { AutomationError, type AutomationProfile, type PostContent } from "./automation-types";

export function requiredText(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new AutomationError(`${label} must contain 1–${max} characters.`);
  return value.trim();
}

function webUrl(value: unknown, label: string, required = false) {
  if (!value && !required) return undefined;
  if (typeof value !== "string" || value.length > 2048) throw new AutomationError(`${label} must be a valid web address.`);
  try {
    const parsed = new URL(value);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    return parsed.toString();
  } catch { throw new AutomationError(`${label} must begin with https:// or http://.`); }
}

export function validateContent(value: Record<string, unknown>): PostContent {
  const summary = requiredText(value.summary, "Post text", 1500);
  const ctaType = value.ctaType;
  if (ctaType !== "CALL" && ctaType !== "LEARN_MORE" && ctaType !== "BOOK" && ctaType !== "NONE") throw new AutomationError("Choose a supported button type.");
  const url = ctaType === "BOOK" || ctaType === "LEARN_MORE" ? webUrl(value.url, "Button link", true) : undefined;
  const imageUrl = webUrl(value.imageUrl, "Image link");
  for (const match of summary.matchAll(/\{\{(.*?)\}\}/g)) {
    if (!["business_name", "city", "phone", "website"].includes(match[1].trim())) throw new AutomationError(`Unknown template variable: ${match[1]}.`);
  }
  return { summary, ctaType, ...(url ? { url } : {}), ...(imageUrl ? { imageUrl } : {}) };
}

export function renderContent(content: PostContent, profile: AutomationProfile): PostContent {
  const variables: Record<string, string | undefined> = { business_name: profile.title, city: profile.city, phone: profile.phone, website: profile.websiteUri };
  const summary = content.summary.replace(/\{\{(.*?)\}\}/g, (_match, name: string) => {
    const value = variables[name.trim()];
    if (!value) throw new AutomationError(`${profile.title} has no ${name.trim().replaceAll("_", " ")}. Update the profile or remove that variable.`);
    return value;
  });
  if (/\{\{|\}\}/.test(summary)) throw new AutomationError("A template variable is incomplete.");
  if (content.ctaType === "CALL" && !profile.phone && profile.transport !== "browser") throw new AutomationError(`${profile.title} has no phone number for the Call now button.`);
  return validateContent({ ...content, summary });
}

export function localDateTimeToUtc(date: string, time: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new AutomationError("Choose a valid date and time.");
  const wallClock = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(wallClock) || new Date(wallClock).toISOString().slice(0,10) !== date) throw new AutomationError("Choose a valid calendar date.");
  let formatter: Intl.DateTimeFormat;
  try { formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }); }
  catch { throw new AutomationError("Choose a valid time zone, such as Australia/Melbourne."); }
  const partsAt = (timestamp: number) => Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(p => [p.type, p.value]));
  let candidate = wallClock;
  for (let i = 0; i < 4; i++) {
    const p = partsAt(candidate);
    const represented = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    const correction = wallClock - represented;
    candidate += correction;
    if (!correction) break;
  }
  const p = partsAt(candidate);
  if (`${p.year}-${p.month}-${p.day}` !== date || `${p.hour}:${p.minute}` !== time) throw new AutomationError(`${date} ${time} does not exist in ${timezone} because clocks change. Choose another time.`);
  return new Date(candidate).toISOString();
}

export function campaignDates(startDate: string, endDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new AutomationError("Choose valid start and end dates.");
  const start = Date.parse(`${startDate}T00:00:00Z`), end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || new Date(start).toISOString().slice(0,10) !== startDate || new Date(end).toISOString().slice(0,10) !== endDate || end < start || end - start > 365 * 86400000) throw new AutomationError("The campaign must span 1–366 valid days, with the end after the start.");
  return Array.from({ length: (end - start) / 86400000 + 1 }, (_, i) => new Date(start + i * 86400000).toISOString().slice(0,10));
}
