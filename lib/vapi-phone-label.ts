type PhoneNumber = { id?: string; name?: string; number?: string; twilioPhoneNumber?: string };
const cache = new Map<string, { label: string; expires: number }>();

export function cleanPhoneLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s*[|&]\s*/).map(part => part.trim().replace(/\s+/g, " "))
    .filter(Boolean).join(" | ").slice(0, 240);
}

export async function resolveVapiPhoneLabel(options: { id: string; label: string; number: string }) {
  if (options.label.trim()) return cleanPhoneLabel(options.label);
  const key = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY;
  if (!key || (!options.id && !options.number)) return "";
  const cacheKey = options.id || options.number;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.label;
  try {
    const base = (process.env.VAPI_API_BASE_URL || "https://api.vapi.ai").replace(/\/$/, "");
    const response = await fetch(`${base}/phone-number${options.id ? `/${encodeURIComponent(options.id)}` : ""}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(4000), cache: "no-store"
    });
    if (!response.ok) return "";
    const result = await response.json() as PhoneNumber | PhoneNumber[];
    const digits = (value: string) => value.replace(/\D/g, "");
    const record = Array.isArray(result)
      ? result.find(item => digits(item.number || item.twilioPhoneNumber || "") === digits(options.number))
      : result;
    const label = cleanPhoneLabel(record?.name || "");
    if (label) cache.set(cacheKey, { label, expires: Date.now() + 5 * 60 * 1000 });
    return label;
  } catch {
    // A label lookup failure must not prevent delivery of the call alert.
    return "";
  }
}

export function insertPhoneLabel(text: string, label: string) {
  if (!label) return text;
  const lines = text.split(/\r?\n/);
  const index = lines.length >= 4 && lines[0] === lines[3] ? 4 : 1;
  lines.splice(index, 0, "", `📍 ${cleanPhoneLabel(label)}`);
  return lines.join("\n");
}
