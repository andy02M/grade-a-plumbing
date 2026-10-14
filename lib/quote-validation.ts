export type QuoteAttachment = {
  filename: string;
  content: string;
  contentType: string;
};
export type QuotePayload = {
  name: string;
  phone: string;
  email?: string;
  suburb: string;
  service: string;
  message?: string;
  source?: string;
  requestId?: string;
  postcode?: string;
  state?: string;
  locationId?: string;
  preferredContact?: string;
  preferredDay?: string;
  preferredDate?: string;
  preferredTime?: string;
  attachments?: QuoteAttachment[];
};
export function validateQuote(payload: Partial<QuotePayload>) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return "Invalid request.";
  for (const key of ["name", "phone", "suburb", "service"] as const)
    if (typeof payload[key] !== "string" || !payload[key]!.trim())
      return `Please enter your ${key}.`;
  for (const key of [
    "name",
    "phone",
    "email",
    "suburb",
    "service",
    "message",
    "source",
    "requestId",
    "postcode",
    "state",
    "locationId",
    "preferredContact",
    "preferredDay",
    "preferredDate",
    "preferredTime",
  ] as const)
    if (
      payload[key] !== undefined &&
      (typeof payload[key] !== "string" ||
        payload[key]!.length > (key === "message" ? 5000 : 300))
    )
      return "Invalid or oversized field.";
  if (!/^(?:\+?61|0)[2-478]\d{8}$/.test(payload.phone!.replace(/[\s()-]/g, "")))
    return "Please enter a valid Australian phone number.";
  if (
    payload.email?.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
  )
    return "Please enter a valid email address.";
  if (
    payload.preferredContact &&
    !["phone", "email", "sms"].includes(payload.preferredContact)
  )
    return "Invalid contact preference.";
  if (payload.preferredContact === "email" && !payload.email?.trim())
    return "Enter an email address for email contact.";
  if (payload.postcode && !/^\d{4}$/.test(payload.postcode))
    return "Select a valid postcode.";
  if (payload.state && !["VIC", "NSW"].includes(payload.state))
    return "Select a valid state.";
  if (
    payload.preferredDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(payload.preferredDate) ||
      Number.isNaN(Date.parse(payload.preferredDate + "T00:00:00Z")))
  )
    return "Select a valid preferred date.";
  if (payload.requestId && !/^[a-f0-9-]{36}$/i.test(payload.requestId))
    return "Invalid request reference.";
  if (payload.attachments !== undefined) {
    if (!Array.isArray(payload.attachments) || payload.attachments.length > 1)
      return "Only one photo is supported.";
    for (const a of payload.attachments) {
      if (
        !a ||
        typeof a.filename !== "string" ||
        !a.filename ||
        a.filename.length > 150 ||
        typeof a.content !== "string" ||
        a.content.length > 2800000 ||
        !["image/png", "image/jpeg", "image/webp"].includes(a.contentType) ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(a.content)
      )
        return "Invalid photo. Use JPG, PNG or WebP up to 2 MB.";
      const bytes = Buffer.from(a.content, "base64");
      if (!bytes.length || bytes.length > 2 * 1024 * 1024)
        return "Photo exceeds 2 MB.";
      const valid =
        a.contentType === "image/png"
          ? bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
          : a.contentType === "image/jpeg"
            ? bytes.subarray(0, 3).toString("hex") === "ffd8ff"
            : bytes.subarray(0, 4).toString() === "RIFF" &&
              bytes.subarray(8, 12).toString() === "WEBP";
      if (!valid) return "Photo contents do not match its file type.";
    }
  }
  return null;
}
