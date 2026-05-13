import { NextResponse } from "next/server";
import { site } from "@/lib/site";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CallPayload = Record<string, unknown>;

type NormalizedCall = {
  callId: string;
  customerNumber: string;
  businessNumber: string;
  direction: string;
  duration: string;
  endedReason: string;
  eventType: string;
  provider: string;
  recordingUrl: string;
  status: string;
  summary: string;
  timestamp: string;
};

type AlertStage = "started" | "completed" | "missed" | "ignored";

const recentAlerts = new Map<string, number>();
const dedupeWindowMs = 10 * 60 * 1000;

export async function GET(request: Request) {
  const authError = validateWebhookSecret(request);

  if (authError) {
    return authError;
  }

  const result = await sendTelegramMessage(
    [
      "Test call notification",
      "",
      `Business: ${site.name}`,
      `Website: ${site.baseUrl}`,
      "This confirms Telegram call alerts are connected."
    ].join("\n")
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const authError = validateWebhookSecret(request);

  if (authError) {
    return authError;
  }

  try {
    const payload = await parsePayload(request);
    const call = normalizeCallPayload(payload, request);
    const alertStage = getAlertStage(call);
    const dedupeKey = `${call.provider}:${call.callId || call.customerNumber}:${alertStage}`;

    if (alertStage === "ignored") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (wasRecentlySent(dedupeKey)) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const result = await sendTelegramMessage(formatCallAlert(call, alertStage));

    if (!result.ok) {
      console.error("Telegram call alert failed", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    rememberAlert(dedupeKey);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Call alert webhook failed", error);
    return NextResponse.json({ error: "Call alert webhook failed." }, { status: 500 });
  }
}

function validateWebhookSecret(request: Request) {
  const expectedSecret = process.env.CALL_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return null;
  }

  const url = new URL(request.url);
  const providedSecret =
    url.searchParams.get("secret") ??
    request.headers.get("x-call-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

async function parsePayload(request: Request): Promise<CallPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as CallPayload;
  }

  const body = await request.text();

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(body));
  }

  try {
    return JSON.parse(body) as CallPayload;
  } catch {
    return { rawBody: body };
  }
}

function normalizeCallPayload(payload: CallPayload, request: Request): NormalizedCall {
  const message = getObject(payload.message) ?? payload;
  const call = getObject(message.call) ?? getObject(payload.call) ?? payload;
  const url = new URL(request.url);
  const eventType =
    firstString(
      message.type,
      payload.type,
      request.headers.get("x-webhook-event"),
      payload.CallStatus,
      payload.CallStatusCallbackEvent,
      url.searchParams.get("event")
    ) || "call-update";

  const provider =
    firstString(payload.provider, url.searchParams.get("provider")) ||
    (payload.CallSid ? "Twilio" : "Vapi");

  const customer = getObject(call.customer) ?? {};
  const phoneNumber = getObject(call.phoneNumber) ?? {};
  const artifact = getObject(call.artifact) ?? getObject(message.artifact) ?? {};
  const analysis = getObject(call.analysis) ?? getObject(message.analysis) ?? {};

  return {
    callId: firstString(call.id, message.callId, payload.CallSid, payload.callSid) || "Unknown",
    customerNumber:
      firstString(
        customer.number,
        customer.phoneNumber,
        call.customerNumber,
        message.customerNumber,
        payload.From,
        payload.Caller,
        payload.from
      ) || "Unknown",
    businessNumber:
      firstString(
        phoneNumber.number,
        phoneNumber.twilioPhoneNumber,
        message.phoneNumber,
        payload.To,
        payload.Called,
        payload.to
      ) || site.phone,
    direction: firstString(call.direction, message.direction, payload.Direction, payload.direction) || "Inbound",
    duration:
      firstString(
        call.durationSeconds,
        call.duration,
        message.durationSeconds,
        payload.CallDuration,
        payload.callDuration
      ) || "Not available yet",
    endedReason: firstString(message.endedReason, call.endedReason, payload.endedReason) || "",
    eventType,
    provider,
    recordingUrl:
      firstString(
        call.recordingUrl,
        artifact.recordingUrl,
        artifact.stereoRecordingUrl,
        payload.RecordingUrl,
        payload.recordingUrl
      ) || "",
    status:
      firstString(
        message.status,
        call.status,
        payload.CallStatus,
        payload.callStatus,
        payload.CallStatusCallbackEvent
      ) || eventType,
    summary: firstString(analysis.summary, message.summary, call.summary, payload.summary) || "",
    timestamp: firstString(payload.timestamp, message.timestamp, call.createdAt, call.startedAt) || new Date().toISOString()
  };
}

function formatCallAlert(call: NormalizedCall, alertStage: AlertStage) {
  const heading = getHeading(alertStage);
  const lines = [
    heading,
    "",
    `From: ${call.customerNumber}`,
    `To: ${call.businessNumber}`,
    `Status: ${getDisplayStatus(call, alertStage)}`,
    `Direction: ${call.direction}`,
    `Provider: ${call.provider}`,
    `Call ID: ${call.callId}`,
    `Time: ${formatTimestamp(call.timestamp)}`
  ];

  if (call.duration && call.duration !== "Not available yet") {
    lines.push(`Duration: ${formatDuration(call.duration)}`);
  }

  if (call.endedReason) {
    lines.push(`Ended reason: ${call.endedReason}`);
  }

  if (call.summary) {
    lines.push("", `Summary: ${call.summary}`);
  }

  if (call.recordingUrl) {
    lines.push("", `Recording: ${call.recordingUrl}`);
  }

  return lines.join("\n");
}

function getHeading(alertStage: AlertStage) {
  if (alertStage === "completed") {
    return "Grade A Plumbing call completed";
  }

  if (alertStage === "missed") {
    return "Grade A Plumbing missed or failed call";
  }

  return "New Grade A Plumbing customer call";
}

function getAlertStage(call: NormalizedCall): AlertStage {
  const type = call.eventType.toLowerCase();
  const status = call.status.toLowerCase();
  const hasCompletedDetails = Boolean(call.endedReason || call.recordingUrl || call.summary);

  if (
    type.includes("transcript") ||
    type.includes("conversation") ||
    type.includes("speech") ||
    type.includes("model-output") ||
    type.includes("function") ||
    type.includes("tool") ||
    type.includes("assistant-request") ||
    type.includes("transfer") ||
    type.includes("knowledge-base") ||
    type.includes("voice-request")
  ) {
    return "ignored";
  }

  if (type.includes("end-of-call") || type.includes("hang") || hasCompletedDetails) {
    return ["busy", "failed", "no-answer", "canceled", "cancelled"].includes(status) ? "missed" : "completed";
  }

  if (["ended", "completed"].includes(status)) {
    return type.includes("status-update") ? "ignored" : "completed";
  }

  if (["busy", "failed", "no-answer", "canceled", "cancelled"].includes(status)) {
    return "missed";
  }

  if (type.includes("status-update")) {
    return status === "in-progress" ? "started" : "ignored";
  }

  if (call.provider.toLowerCase().includes("twilio")) {
    return ["initiated", "in-progress"].includes(status) ? "started" : "ignored";
  }

  if (type.includes("assistant.started") || type.includes("call-started") || type.includes("call-start")) {
    return "started";
  }

  return "ignored";
}

function getDisplayStatus(call: NormalizedCall, alertStage: AlertStage) {
  if (alertStage === "completed") {
    return "ended";
  }

  if (alertStage === "missed") {
    return call.status;
  }

  return call.status === "in-progress" ? "in progress" : call.status;
}

function formatTimestamp(value: string) {
  const numericValue = Number(value);
  const date = Number.isFinite(numericValue)
    ? new Date(numericValue < 10000000000 ? numericValue * 1000 : numericValue)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Melbourne"
  }).format(date);
}

function formatDuration(value: string) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds)) {
    return value;
  }

  if (seconds < 60) {
    return `${seconds.toFixed(1)} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  return `${minutes} min ${remainingSeconds} sec`;
}

function wasRecentlySent(key: string) {
  const now = Date.now();
  const sentAt = recentAlerts.get(key);

  for (const [recentKey, timestamp] of recentAlerts.entries()) {
    if (now - timestamp > dedupeWindowMs) {
      recentAlerts.delete(recentKey);
    }
  }

  return Boolean(sentAt && now - sentAt < dedupeWindowMs);
}

function rememberAlert(key: string) {
  recentAlerts.set(key, Date.now());
}

function getObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object" || typeof value === "function") continue;

    const text = String(value).trim();
    if (text) return text;
  }

  return "";
}
