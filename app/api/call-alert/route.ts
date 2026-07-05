import { after, NextResponse } from "next/server";
import { site } from "@/lib/site";
import { sendTelegramAudio, sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const vapiApiBaseUrl = process.env.VAPI_API_BASE_URL ?? "https://api.vapi.ai";
const recordingPollAttempts = 18;
const recordingPollDelayMs = 10000;

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
  outcome: string;
  status: string;
  summary: string;
  timestamp: string;
  lead: LeadDetails;
};

type LeadDetails = {
  customerName: string;
  phoneNumber: string;
  address: string;
  suburbLocation: string;
  serviceNeeded: string;
  issueSummary: string;
  urgency: string;
  preferredTime: string;
  photosOrVideosAvailable: string;
  paymentPreference: string;
  appointmentStatus: string;
  nextAction: string;
};

type AlertStage = "started" | "completed" | "missed" | "recording" | "ignored";

const recentAlerts = new Map<string, number>();
const dedupeWindowMs = 10 * 60 * 1000;

export async function GET(request: Request) {
  const authError = validateWebhookSecret(request);

  if (authError) {
    return authError;
  }

  const url = new URL(request.url);

  if (url.searchParams.get("status") === "1") {
    const callId = url.searchParams.get("callId")?.trim();
    const environment = {
      hasCallWebhookSecret: Boolean(process.env.CALL_WEBHOOK_SECRET),
      hasTelegramBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasTelegramChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
      hasVapiPrivateKey: Boolean(getVapiPrivateKey())
    };

    if (callId) {
      if (!getVapiPrivateKey()) {
        return NextResponse.json({
          ok: true,
          environment,
          vapiLookup: {
            attempted: false,
            error: "Missing VAPI_PRIVATE_KEY or VAPI_API_KEY in the live deployment."
          }
        });
      }

      const fetchedPayload = await fetchVapiCall(callId);

      if (!fetchedPayload) {
        return NextResponse.json({
          ok: true,
          environment,
          vapiLookup: {
            attempted: true,
            ok: false,
            callId,
            error: "Could not fetch this call from the Vapi API. Check the Vapi private key and call ID."
          }
        });
      }

      const fetchedCall = normalizeCallPayload(buildFetchedCallMessage(fetchedPayload), request);

      return NextResponse.json({
        ok: true,
        environment,
        vapiLookup: {
          attempted: true,
          ok: true,
          apiBaseUrl: vapiApiBaseUrl,
          callId: fetchedCall.callId,
          status: fetchedCall.status,
          eventType: fetchedCall.eventType,
          hasRecordingUrl: Boolean(fetchedCall.recordingUrl),
          recordingUrl: fetchedCall.recordingUrl || null,
          hasSummary: Boolean(fetchedCall.summary),
          summary: fetchedCall.summary || null,
          leadDetails: fetchedCall.lead,
          missingLeadFields: getMissingLeadFields(fetchedCall),
          endedReason: fetchedCall.endedReason || null,
          duration: fetchedCall.duration
        }
      });
    }

    return NextResponse.json({
      ok: true,
      environment
    });
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
    const recordingPollKey = getRecordingPollKey(call, alertStage);

    if (shouldPollForRecording(call, alertStage) && !wasRecentlySent(recordingPollKey)) {
      rememberAlert(recordingPollKey);
      queueRecordingPoll(call);
    }

    if (alertStage === "ignored") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (wasRecentlySent(dedupeKey)) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const result = await sendCallAlert(call, alertStage);

    if (!result.ok) {
      console.error("Telegram call alert failed", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    rememberAlert(dedupeKey);
    rememberRecordingAlertIfNeeded(call, alertStage);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Call alert webhook failed", error);
    return NextResponse.json({ error: "Call alert webhook failed." }, { status: 500 });
  }
}

async function sendCallAlert(call: NormalizedCall, alertStage: AlertStage) {
  const message = formatCallAlert(call, alertStage);
  const prefersAudio = call.recordingUrl && (alertStage === "recording" || alertStage === "completed");

  if (!prefersAudio) {
    return sendTelegramMessage(message);
  }

  const messageResult = await sendTelegramMessage(message);
  const audioResult = await sendTelegramAudio(call.recordingUrl, formatRecordingCaption(call));

  if (!audioResult.ok) {
    console.error("Telegram recording audio failed", audioResult.error);
  }

  if (messageResult.ok) {
    return messageResult;
  }

  return audioResult.ok ? audioResult : messageResult;
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
  const structuredData = getObject(analysis.structuredData) ?? {};
  const recording = getObject(artifact.recording) ?? getObject(call.recording) ?? getObject(message.recording) ?? {};
  const customerNumber =
    firstString(
      customer.number,
      customer.phoneNumber,
      call.customerNumber,
      message.customerNumber,
      payload.From,
      payload.Caller,
      payload.from
    ) || "Unknown";
  const businessNumber =
    firstString(phoneNumber.number, phoneNumber.twilioPhoneNumber, message.phoneNumber, payload.To, payload.Called, payload.to) ||
    site.phone;
  const structuredSources = getStructuredDataSources(analysis, artifact, call, message, payload);

  return {
    callId: firstString(call.id, message.callId, payload.CallSid, payload.callSid) || "Unknown",
    customerNumber,
    businessNumber,
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
      findRecordingUrl(payload) ||
      findRecordingUrl(message) ||
      findRecordingUrl(call) ||
      firstString(
        message.recordingUrl,
        message.stereoRecordingUrl,
        call.recordingUrl,
        artifact.recordingUrl,
        artifact.stereoRecordingUrl,
        recording.url,
        recording.recordingUrl,
        recording.stereoUrl,
        recording.stereoRecordingUrl,
        recording.monoUrl,
        recording.monoRecordingUrl,
        payload.RecordingUrl,
        payload.recordingUrl
      ) || "",
    outcome:
      firstString(
        analysis.successEvaluation,
        structuredData.call_outcome,
        structuredData.outcome,
        structuredData.result,
        structuredData.lead_status,
        message.outcome,
        call.outcome,
        payload.outcome
      ) || "",
    status:
      firstString(
        message.status,
        call.status,
        payload.CallStatus,
        payload.callStatus,
        payload.CallStatusCallbackEvent
      ) || eventType,
    summary:
      firstString(
        analysis.summary,
        structuredData.summary,
        structuredData.call_summary,
        structuredData.notes,
        message.summary,
        call.summary,
        payload.summary
      ) || "",
    timestamp: firstString(payload.timestamp, message.timestamp, call.createdAt, call.startedAt) || new Date().toISOString(),
    lead: buildLeadDetails(structuredSources, customerNumber)
  };
}

function formatCallAlert(call: NormalizedCall, alertStage: AlertStage) {
  const heading = getHeading(alertStage);
  const outcome = getOutcome(call, alertStage);
  const nextStep = getNextStep(call, alertStage, outcome);
  const visual = getAlertVisual(alertStage, outcome);
  const lines = [
    `${visual.icon} ${visual.title}`,
    visual.divider,
    `${visual.status} ${heading}`,
    `📌 Outcome: ${outcome}`,
    `➡️ Next step: ${nextStep}`,
    "",
    "📞 Call details",
    "━━━━━━━━━━━━━━",
    `👤 From: ${call.customerNumber}`,
    `🏢 To: ${call.businessNumber}`,
    `${visual.status} Status: ${getDisplayStatus(call, alertStage)}`,
    `🔁 Direction: ${call.direction}`,
    `🤖 Provider: ${call.provider}`,
    `🆔 Call ID: ${call.callId}`,
    `🕒 Time: ${formatTimestamp(call.timestamp)}`
  ];

  if (call.duration && call.duration !== "Not available yet") {
    lines.push(`⏱️ Duration: ${formatDuration(call.duration)}`);
  }

  if (call.endedReason) {
    lines.push(`🏁 Ended reason: ${call.endedReason}`);
  }

  if (alertStage === "completed" || alertStage === "missed" || alertStage === "recording") {
    lines.push("", ...formatLeadSnapshot(call));
    lines.push(
      "",
      "📝 Call summary",
      "━━━━━━━━━━━━━━",
      call.summary || "No Vapi summary was provided yet. Listen to the recording if available."
    );
  }

  if (call.recordingUrl) {
    lines.push("", "🎧 Recording", "━━━━━━━━━━━━━━", call.recordingUrl);
  }

  return lines.join("\n");
}

function formatRecordingCaption(call: NormalizedCall) {
  const issue = call.lead.issueSummary || call.lead.serviceNeeded;
  const lines = [
    "🎧 Grade A Plumbing recording",
    `👤 From: ${call.customerNumber}`,
    issue ? `🛠️ Issue: ${issue}` : "",
    call.lead.urgency ? `🚦 Urgency: ${call.lead.urgency}` : "",
    `🆔 Call ID: ${call.callId}`
  ];

  return lines.filter(Boolean).join("\n");
}

function formatLeadSnapshot(call: NormalizedCall) {
  const lead = call.lead;
  const issue = lead.issueSummary || lead.serviceNeeded;
  const rows = [
    ["👤 Customer", lead.customerName],
    ["📱 Phone", lead.phoneNumber || (call.customerNumber !== "Unknown" ? call.customerNumber : "")],
    ["📍 Address", lead.address],
    ["📌 Suburb/location", lead.suburbLocation],
    ["🛠️ Issue", issue],
    ["🚦 Urgency", lead.urgency],
    ["🕒 Preferred time", lead.preferredTime],
    ["📷 Photos/videos", lead.photosOrVideosAvailable],
    ["💳 Payment preference", lead.paymentPreference],
    ["📅 Appointment status", lead.appointmentStatus],
    ["✅ Next action", lead.nextAction]
  ];
  const capturedRows = rows.filter(([, value]) => value);
  const missingFields = getMissingLeadFields(call);

  return [
    "🧾 Lead snapshot",
    "━━━━━━━━━━━━━━",
    ...capturedRows.map(([label, value]) => `${label}: ${value}`),
    ...(missingFields.length ? [`⚠️ Missing: ${missingFields.join(", ")}`] : ["✅ Required details captured"])
  ];
}

function buildLeadDetails(sources: Record<string, unknown>[], customerNumber: string): LeadDetails {
  return {
    customerName: firstFieldString(sources, [
      "customer_name",
      "customerName",
      "customer.name",
      "customer.fullName",
      "name",
      "full_name",
      "fullName"
    ]),
    phoneNumber:
      firstFieldString(sources, [
        "phone_number",
        "phoneNumber",
        "phone",
        "mobile",
        "mobile_number",
        "mobileNumber",
        "best_phone_number",
        "bestPhoneNumber",
        "customer.phone",
        "customer.phoneNumber"
      ]) || (customerNumber !== "Unknown" ? customerNumber : ""),
    address: firstFieldString(sources, [
      "address",
      "property_address",
      "propertyAddress",
      "job_address",
      "jobAddress",
      "full_address",
      "fullAddress",
      "location.address"
    ]),
    suburbLocation: firstFieldString(sources, [
      "suburb",
      "location",
      "suburb_location",
      "suburbLocation",
      "job_suburb",
      "jobSuburb",
      "property_suburb",
      "propertySuburb",
      "location.suburb"
    ]),
    serviceNeeded: firstFieldString(sources, [
      "service_needed",
      "serviceNeeded",
      "service",
      "service_type",
      "serviceType",
      "job_type",
      "jobType"
    ]),
    issueSummary: firstFieldString(sources, [
      "issue_summary",
      "issueSummary",
      "issue",
      "plumbing_issue",
      "plumbingIssue",
      "problem",
      "description",
      "notes",
      "summary",
      "call_summary",
      "callSummary"
    ]),
    urgency: firstFieldString(sources, ["urgency", "priority", "timeframe", "same_day", "sameDay", "urgent"]),
    preferredTime: firstFieldString(sources, ["preferred_time", "preferredTime", "preferred_date", "preferredDate", "availability"]),
    photosOrVideosAvailable: firstFieldString(sources, [
      "photos_or_videos_available",
      "photosOrVideosAvailable",
      "photos_available",
      "photosAvailable",
      "videos_available",
      "videosAvailable"
    ]),
    paymentPreference: firstFieldString(sources, ["payment_preference", "paymentPreference", "payment", "payment_method", "paymentMethod"]),
    appointmentStatus: firstFieldString(sources, ["appointment_status", "appointmentStatus", "booking_status", "bookingStatus"]),
    nextAction: firstFieldString(sources, ["next_action", "nextAction", "action_required", "actionRequired"])
  };
}

function getMissingLeadFields(call: NormalizedCall) {
  const missingFields: string[] = [];

  if (!call.lead.customerName) {
    missingFields.push("name");
  }

  if (!call.lead.phoneNumber && call.customerNumber === "Unknown") {
    missingFields.push("phone");
  }

  if (!call.lead.issueSummary && !call.lead.serviceNeeded) {
    missingFields.push("issue");
  }

  if (!call.lead.address && !call.lead.suburbLocation) {
    missingFields.push("address/suburb");
  }

  if (!call.lead.urgency) {
    missingFields.push("urgency");
  }

  return missingFields;
}

function getAlertVisual(alertStage: AlertStage, outcome: string) {
  if (alertStage === "recording") {
    return {
      divider: "🟩🟩🟩🟩🟩🟩🟩🟩",
      icon: "🎧",
      status: "🟢",
      title: "Grade A Plumbing Call Complete"
    };
  }

  if (alertStage === "completed") {
    return {
      divider: "🟩🟩🟩🟩🟩🟩🟩🟩",
      icon: "✅",
      status: "🟢",
      title: "Grade A Plumbing Call Complete"
    };
  }

  if (alertStage === "missed") {
    return {
      divider: "🟥🟥🟥🟥🟥🟥🟥🟥",
      icon: "🚨",
      status: "🔴",
      title: "Grade A Plumbing Missed Call"
    };
  }

  if (outcome.toLowerCase().includes("needs review")) {
    return {
      divider: "🟨🟨🟨🟨🟨🟨🟨🟨",
      icon: "⚠️",
      status: "🟡",
      title: "Grade A Plumbing Call Alert"
    };
  }

  return {
    divider: "🟦🟦🟦🟦🟦🟦🟦🟦",
    icon: "📲",
    status: "🔵",
    title: "New Grade A Plumbing Call"
  };
}

function getHeading(alertStage: AlertStage) {
  if (alertStage === "recording") {
    return "Grade A Plumbing call completed - recording ready";
  }

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
  const hasRecording = Boolean(call.recordingUrl);

  if (
    type.includes("recording-ready") ||
    type.includes("recording.ready") ||
    type.includes("recording_ready") ||
    (type.includes("recording") && call.recordingUrl)
  ) {
    return call.recordingUrl ? "recording" : "ignored";
  }

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

  if (status === "ringing") {
    return "ignored";
  }

  if (type.includes("end-of-call") || type.includes("hang") || call.endedReason || call.summary || hasRecording) {
    if (["busy", "failed", "no-answer", "canceled", "cancelled"].includes(status)) {
      return "missed";
    }

    return hasRecording ? "completed" : "ignored";
  }

  if (["ended", "completed"].includes(status)) {
    return type.includes("status-update") || !hasRecording ? "ignored" : "completed";
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

function shouldPollForRecording(call: NormalizedCall, alertStage: AlertStage) {
  if (!call.callId || call.callId === "Unknown") {
    return false;
  }

  if (call.provider.toLowerCase() !== "vapi") {
    return false;
  }

  if (call.recordingUrl) {
    return false;
  }

  if (!getVapiPrivateKey()) {
    return false;
  }

  if (alertStage === "started") {
    return true;
  }

  return (
    alertStage === "ignored" &&
    (call.status.toLowerCase() === "ended" ||
      call.eventType.toLowerCase().includes("end-of-call") ||
      call.eventType.toLowerCase().includes("hang") ||
      Boolean(call.endedReason) ||
      Boolean(call.summary))
  );
}

function getDisplayStatus(call: NormalizedCall, alertStage: AlertStage) {
  if (alertStage === "recording") {
    return "recording ready";
  }

  if (alertStage === "completed") {
    return "ended";
  }

  if (alertStage === "missed") {
    return call.status;
  }

  return call.status === "in-progress" ? "in progress" : call.status;
}

function getOutcome(call: NormalizedCall, alertStage: AlertStage) {
  const status = call.status.toLowerCase();
  const endedReason = call.endedReason.toLowerCase();
  const outcome = call.outcome.toLowerCase();
  const summary = call.summary.toLowerCase();
  const durationSeconds = Number(call.duration);

  if (alertStage === "recording") {
    return getMissingLeadFields(call).length ? "Recording ready - review missing details" : "Lead details captured - review and follow up";
  }

  if (alertStage === "started") {
    return "Call connected - customer is speaking with the AI assistant";
  }

  if (alertStage === "missed") {
    return "Missed or failed call - follow up recommended";
  }

  if (["success", "successful", "qualified", "booked", "appointment booked", "lead captured"].some((term) => outcome.includes(term))) {
    return "Successful call - lead looks positive";
  }

  if (["not interested", "wrong number", "no answer", "failed", "spam", "do not contact"].some((term) => outcome.includes(term))) {
    return "Not successful - low value or no follow up needed";
  }

  if (["book", "appointment", "quote", "emergency", "urgent", "call back", "callback", "hot water", "blocked drain", "leak"].some((term) =>
    summary.includes(term)
  )) {
    return "Potential lead - review and follow up";
  }

  if (Number.isFinite(durationSeconds) && durationSeconds < 15) {
    return "Needs review - short call";
  }

  if (status === "ended" || endedReason) {
    return "Completed call - review summary";
  }

  return "Needs review";
}

function getNextStep(call: NormalizedCall, alertStage: AlertStage, outcome: string) {
  const normalizedOutcome = outcome.toLowerCase();

  if (alertStage === "recording") {
    return "Listen to the recording and review the call outcome";
  }

  if (alertStage === "started") {
    return "Wait for the completed call alert";
  }

  if (alertStage === "missed") {
    return "Call the customer back as soon as possible";
  }

  if (normalizedOutcome.includes("successful") || normalizedOutcome.includes("potential lead")) {
    return "Review the summary, then call or message the customer";
  }

  if (normalizedOutcome.includes("short call")) {
    return "Listen to the recording and decide whether to call back";
  }

  return call.recordingUrl ? "Review the recording if more context is needed" : "Review the call in Vapi";
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

function rememberRecordingAlertIfNeeded(call: NormalizedCall, alertStage: AlertStage) {
  if (alertStage === "completed" && call.recordingUrl) {
    rememberAlert(`${call.provider}:${call.callId || call.customerNumber}:recording`);
  }
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

function getStructuredDataSources(...values: Record<string, unknown>[]) {
  const sources: Record<string, unknown>[] = [];

  for (const value of values) {
    const structuredData = getObject(value.structuredData);
    const structuredOutputs = getObject(value.structuredOutputs);

    if (structuredData) {
      sources.push(structuredData);
    }

    if (structuredOutputs) {
      sources.push(...getStructuredOutputResults(structuredOutputs));
    }
  }

  return sources;
}

function getStructuredOutputResults(value: unknown, seen = new Set<unknown>()): Record<string, unknown>[] {
  if (!value || typeof value !== "object" || seen.has(value)) {
    return [];
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((item) => getStructuredOutputResults(item, seen));
  }

  const object = value as Record<string, unknown>;
  const result = getObject(object.result);
  const output = getObject(object.output);
  const directSources = [result, output].filter((source): source is Record<string, unknown> => Boolean(source));
  const nestedSources = Object.values(object).flatMap((nestedValue) => getStructuredOutputResults(nestedValue, seen));

  return [...directSources, ...nestedSources];
}

function firstFieldString(sources: Record<string, unknown>[], fieldNames: string[]) {
  for (const source of sources) {
    for (const fieldName of fieldNames) {
      const value = getFieldValue(source, fieldName);
      const text = stringifyFieldValue(value);

      if (text) {
        return text;
      }
    }
  }

  return "";
}

function getFieldValue(source: Record<string, unknown>, fieldName: string): unknown {
  if (fieldName in source) {
    return source[fieldName];
  }

  if (!fieldName.includes(".")) {
    return undefined;
  }

  return fieldName.split(".").reduce<unknown>((currentValue, key) => {
    const currentObject = getObject(currentValue);

    return currentObject ? currentObject[key] : undefined;
  }, source);
}

function stringifyFieldValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => stringifyFieldValue(item)).filter(Boolean).join(", ");
  }

  const object = getObject(value);

  if (!object) {
    return "";
  }

  return firstString(object.value, object.text, object.label, object.name);
}

function findRecordingUrl(value: unknown): string {
  const seen = new Set<unknown>();
  const candidates: string[] = [];

  collectRecordingUrls(value, "", candidates, seen);

  return candidates[0] ?? "";
}

function collectRecordingUrls(value: unknown, keyPath: string, candidates: string[], seen: Set<unknown>) {
  if (!value || candidates.length) {
    return;
  }

  if (typeof value === "string") {
    if (looksLikeRecordingUrl(value) && keyPath.toLowerCase().includes("record")) {
      candidates.push(value.trim());
    }

    return;
  }

  if (typeof value !== "object" || seen.has(value)) {
    return;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectRecordingUrls(item, `${keyPath}.${index}`, candidates, seen));
    return;
  }

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    collectRecordingUrls(nestedValue, keyPath ? `${keyPath}.${key}` : key, candidates, seen);
  }
}

function looksLikeRecordingUrl(value: string) {
  const text = value.trim();

  if (!/^https?:\/\//i.test(text)) {
    return false;
  }

  return /\.(wav|mp3|m4a|ogg|webm)(\?|$)/i.test(text) || /storage\.vapi\.ai/i.test(text);
}

function queueRecordingPoll(call: NormalizedCall) {
  after(async () => {
    try {
      const latestCall = await pollForRecording(call);

      if (!latestCall) {
        console.warn("Recording was not available before polling timed out", { callId: call.callId });
        return;
      }

      const dedupeKey = `${latestCall.provider}:${latestCall.callId || latestCall.customerNumber}:recording`;

      if (wasRecentlySent(dedupeKey)) {
        return;
      }

      const result = await sendCallAlert(latestCall, "recording");

      if (!result.ok) {
        console.error("Telegram recording follow-up failed", result.error);
        return;
      }

      rememberAlert(dedupeKey);
    } catch (error) {
      console.error("Recording follow-up polling failed", {
        callId: call.callId,
        error
      });
    }
  });
}

async function pollForRecording(baseCall: NormalizedCall) {
  for (let attempt = 0; attempt < recordingPollAttempts; attempt += 1) {
    if (attempt === 0 && getAlertStage(baseCall) === "started") {
      await sleep(recordingPollDelayMs);
    } else if (attempt > 0) {
      await sleep(recordingPollDelayMs);
    }

    const latestCallPayload = await fetchVapiCall(baseCall.callId);

    if (!latestCallPayload) {
      continue;
    }

    const latestCall = normalizeCallPayload(buildFetchedCallMessage(latestCallPayload), new Request(site.baseUrl));

    if (latestCall.recordingUrl) {
      return {
        ...latestCall,
        endedReason: latestCall.endedReason || baseCall.endedReason,
        outcome: latestCall.outcome || baseCall.outcome,
        summary: latestCall.summary || baseCall.summary,
        timestamp: latestCall.timestamp || baseCall.timestamp
      };
    }
  }

  return null;
}

async function fetchVapiCall(callId: string) {
  const privateKey = getVapiPrivateKey();

  if (!privateKey) {
    return null;
  }

  const response = await fetch(`${vapiApiBaseUrl}/call/${callId}`, {
    headers: {
      Authorization: `Bearer ${privateKey}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    console.error("Vapi call lookup failed", {
      callId,
      status: response.status,
      body: await response.text()
    });
    return null;
  }

  return (await response.json()) as CallPayload;
}

function getVapiPrivateKey() {
  return process.env.VAPI_PRIVATE_KEY ?? process.env.VAPI_API_KEY ?? "";
}

function getRecordingPollKey(call: NormalizedCall, alertStage: AlertStage) {
  const trigger = alertStage === "started" ? "started" : "final";

  return `${call.provider}:${call.callId || call.customerNumber}:recording-poll:${trigger}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildFetchedCallMessage(payload: CallPayload) {
  const payloadObject = getObject(payload) ?? {};
  const nestedCall = getObject(payloadObject.call);
  const nestedMessage = getObject(payloadObject.message);

  if (nestedMessage) {
    return {
      ...payloadObject,
      message: {
        type: "recording-ready",
        ...nestedMessage
      }
    };
  }

  if (nestedCall) {
    return {
      message: {
        type: "recording-ready",
        ...payloadObject
      }
    };
  }

  return {
    message: {
      type: "recording-ready",
      call: payloadObject
    }
  };
}
