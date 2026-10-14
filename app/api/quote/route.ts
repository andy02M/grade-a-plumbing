import { NextResponse } from "next/server";
import { site } from "@/lib/site";
import { measurementContext } from "@/lib/measurement";
import { validateQuote, type QuotePayload } from "@/lib/quote-validation";
import catalogue from "@/components/manus/location-catalog.json";
import { SYDNEY_LOCATIONS } from "@/components/manus/locationData";
export const runtime = "nodejs";
const inFlight = new Map<string, Promise<{ referenceId: string }>>();
const accepted = new Map<string, { referenceId: string; expires: number }>();
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 3000000)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    let payload: QuotePayload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const error = validateQuote(payload);
    if (error) return NextResponse.json({ error }, { status: 400 });
    if (payload.locationId) {
      const locality = [...catalogue.locations, ...SYDNEY_LOCATIONS].find(
        (l) => l.id === payload.locationId,
      );
      if (
        !locality ||
        locality.name !== payload.suburb ||
        locality.postcode !== payload.postcode ||
        locality.state !== payload.state
      )
        return NextResponse.json(
          { error: "Select a matching suburb, postcode and state." },
          { status: 400 },
        );
    }
    const key = payload.requestId || crypto.randomUUID();
    for (const [id, item] of accepted)
      if (item.expires < Date.now()) accepted.delete(id);
    if (accepted.size > 1000) accepted.delete(accepted.keys().next().value!);
    let result = accepted.get(key);
    if (!result) {
      let pending = inFlight.get(key);
      if (!pending) {
        pending = sendQuoteEmail(payload, key);
        inFlight.set(key, pending);
      }
      try {
        const receipt = await pending;
        result = { ...receipt, expires: Date.now() + 86400000 };
        accepted.set(key, result);
      } finally {
        inFlight.delete(key);
      }
    }
    const context = measurementContext(
      request.headers.get("x-forwarded-host") ??
        request.headers.get("host") ??
        "",
      payload.source === "Homepage quote form"
        ? "/"
        : payload.source?.startsWith("/")
          ? payload.source
          : "/contact/",
    );
    if (
      context &&
      request.headers.get("dnt") !== "1" &&
      request.headers.get("sec-gpc") !== "1"
    )
      console.info(
        "site_measurement",
        JSON.stringify({ event: "quote_accepted", ...context }),
      );
    return NextResponse.json({
      ok: true,
      referenceId: result.referenceId,
      message:
        "Your quote request has been received. We will review it and contact you.",
    });
  } catch {
    console.error("quote_submission_failed");
    return NextResponse.json(
      {
        error:
          "We could not submit your quote right now. Please call " +
          site.phone +
          " or email " +
          site.email +
          ".",
      },
      { status: 503 },
    );
  }
}
async function sendQuoteEmail(payload: QuotePayload, key: string) {
  if (!process.env.RESEND_API_KEY)
    throw Error("Email configuration unavailable");
  const referenceId = key.slice(0, 8).toUpperCase();
  const lines = [
    "Reference: " + referenceId,
    "Source: " + (payload.source || "Website quote form"),
    "Name: " + payload.name.trim(),
    "Phone: " + payload.phone.trim(),
    "Email: " + (payload.email?.trim() || "Not provided"),
    "Suburb: " + payload.suburb,
    "Postcode: " + (payload.postcode || "Not provided"),
    "State: " + (payload.state || "Not provided"),
    "Service: " + payload.service,
    "Preferred contact: " + (payload.preferredContact || "phone"),
    "Preferred day/date: " + (payload.preferredDay || "Not specified"),
    "Preferred date: " + (payload.preferredDate || "Not specified"),
    "Preferred time: " + (payload.preferredTime || "Not specified"),
    "Message: " + (payload.message || "No message provided"),
  ];
  // Stable request body and provider idempotency protect retries across server instances.
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "Idempotency-Key": "quote-" + key,
    },
    body: JSON.stringify({
      from:
        process.env.QUOTE_FROM_EMAIL ||
        "Grade A Plumbing Quotes <onboarding@resend.dev>",
      to: [site.email, "zenn@gradeaplumbing.store"],
      reply_to: payload.email || undefined,
      subject: "New free quote request from " + payload.name,
      text: lines.join("\n"),
      attachments: payload.attachments?.map((a) => ({
        filename: a.filename.replace(/[^a-zA-Z0-9._-]/g, "_"),
        content: a.content,
      })),
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw Error("Email provider did not accept request");
  return { referenceId };
}
