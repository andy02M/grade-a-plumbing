import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ToolArguments = Record<string, unknown>;

type ToolCall = {
  id: string;
  name: string;
  arguments: ToolArguments;
};

type CalendlyAvailableTime = {
  scheduling_url?: string;
  start_time?: string;
  status?: string;
};

const calendlyApiBase = "https://api.calendly.com";
const defaultTimezone = "Australia/Melbourne";

export async function POST(request: Request) {
  const authError = validateToolSecret(request);

  if (authError) {
    return authError;
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const toolCalls = extractToolCalls(payload);

    if (!toolCalls.length) {
      return NextResponse.json({ error: "No Vapi tool calls were found." }, { status: 400 });
    }

    const results = await Promise.all(
      toolCalls.map(async (toolCall) => ({
        toolCallId: toolCall.id,
        result: await runTool(toolCall)
      }))
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Calendly Vapi tool error", error);

    return NextResponse.json(
      {
        error: "Calendly tool failed.",
        fallback_message:
          "I could not access the booking calendar right now. Use the manual follow-up process."
      },
      { status: 500 }
    );
  }
}

async function runTool(toolCall: ToolCall) {
  if (toolCall.name === "check_calendly_availability") {
    return checkCalendlyAvailability(toolCall.arguments);
  }

  if (toolCall.name === "book_calendly_appointment") {
    return bookCalendlyAppointment(toolCall.arguments);
  }

  return {
    ok: false,
    error: `Unknown tool: ${toolCall.name}`,
    fallback_message: "Use the manual follow-up process."
  };
}

async function checkCalendlyAvailability(args: ToolArguments) {
  const { accessToken, eventTypeUri } = getCalendlyConfig();
  const timezone = firstString(args.timezone) || process.env.CALENDLY_TIMEZONE || defaultTimezone;
  const days = clampNumber(args.days, 1, 7, 3);
  const limit = clampNumber(args.limit, 1, 10, 4);
  const start = getSearchStart(args.start_date);
  const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  const url = new URL(`${calendlyApiBase}/event_type_available_times`);

  url.searchParams.set("event_type", eventTypeUri);
  url.searchParams.set("start_time", start.toISOString());
  url.searchParams.set("end_time", end.toISOString());

  const data = await calendlyFetch<{ collection?: CalendlyAvailableTime[] }>(url, accessToken);
  const slots = (data.collection ?? [])
    .filter((slot) => slot.start_time)
    .slice(0, limit)
    .map((slot, index) => ({
      slot_id: `slot_${index + 1}`,
      start_time: slot.start_time,
      display_time: formatSlotTime(slot.start_time!, timezone),
      scheduling_url: slot.scheduling_url ?? "",
      status: slot.status ?? "available"
    }));

  return {
    ok: true,
    available: slots.length > 0,
    timezone,
    slots,
    instruction:
      slots.length > 0
        ? "Offer the customer two suitable times from the slots list, then call book_calendly_appointment with the selected start_time."
        : "No times were returned. Use the manual follow-up process."
  };
}

async function bookCalendlyAppointment(args: ToolArguments) {
  const { accessToken, eventTypeUri } = getCalendlyConfig();
  const timezone = firstString(args.timezone) || process.env.CALENDLY_TIMEZONE || defaultTimezone;
  const startTime = firstString(args.start_time);
  const name = firstString(args.customer_name, args.name);
  const email = firstString(args.email, args.customer_email);
  const phone = firstString(args.phone, args.mobile, args.phone_number);
  const address = firstString(args.property_address, args.address);
  const suburb = firstString(args.suburb);
  const serviceNeeded = firstString(args.service_needed, args.service);
  const issueSummary = firstString(args.issue_summary, args.message);
  const urgency = firstString(args.urgency);
  const accessNotes = firstString(args.access_notes);

  if (!startTime || !name || !email) {
    return {
      ok: false,
      error: "Booking requires start_time, customer_name, and email.",
      fallback_message:
        "I need a name, email, and appointment time to create the booking. If the customer cannot provide these, use manual follow-up."
    };
  }

  const response = await calendlyFetch<{
    resource?: {
      uri?: string;
      event?: string;
      cancel_url?: string;
      reschedule_url?: string;
    };
  }>(`${calendlyApiBase}/invitees`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      event_type: eventTypeUri,
      start_time: new Date(startTime).toISOString(),
      invitee: {
        name,
        email,
        timezone
      },
      location: buildCalendlyLocation(address, phone),
      questions_and_answers: [
        answer("Mobile number", phone),
        answer("Property address", address),
        answer("Suburb", suburb),
        answer("Service needed", serviceNeeded),
        answer("Issue summary", issueSummary),
        answer("Urgency", urgency),
        answer("Access notes", accessNotes)
      ].filter(Boolean),
      tracking: {
        utm_source: "vapi",
        utm_medium: "phone_assistant",
        utm_campaign: "grade_a_plumbing_booking"
      }
    })
  });

  return {
    ok: true,
    appointment_status: "Booked in Calendly",
    calendly_invitee_uri: response.resource?.uri ?? "",
    calendly_event_uri: response.resource?.event ?? "",
    cancel_url: response.resource?.cancel_url ?? "",
    reschedule_url: response.resource?.reschedule_url ?? "",
    confirmation_message: `The Calendly booking is confirmed for ${formatSlotTime(startTime, timezone)}.`
  };
}

function validateToolSecret(request: Request) {
  const expectedSecret = process.env.VAPI_TOOL_SECRET;

  if (!expectedSecret) {
    return null;
  }

  const url = new URL(request.url);
  const providedSecret =
    url.searchParams.get("secret") ??
    request.headers.get("x-vapi-tool-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function getCalendlyConfig() {
  const accessToken = process.env.CALENDLY_ACCESS_TOKEN;
  const eventTypeUri = process.env.CALENDLY_EVENT_TYPE_URI;

  if (!accessToken || !eventTypeUri) {
    throw new Error("Missing CALENDLY_ACCESS_TOKEN or CALENDLY_EVENT_TYPE_URI.");
  }

  return { accessToken, eventTypeUri };
}

async function calendlyFetch<T>(url: string | URL, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Calendly API error ${response.status}: ${errorText}`);
  }

  return (await response.json()) as T;
}

function extractToolCalls(payload: Record<string, unknown>): ToolCall[] {
  const message = getObject(payload.message);
  const toolCallList = getArray(message?.toolCallList);
  const toolWithToolCallList = getArray(message?.toolWithToolCallList);

  if (toolCallList.length) {
    return toolCallList.map(normalizeToolCall).filter((toolCall): toolCall is ToolCall => Boolean(toolCall));
  }

  if (toolWithToolCallList.length) {
    return toolWithToolCallList
      .map((item) => {
        const wrapper = getObject(item);
        const toolCall = getObject(wrapper?.toolCall) ?? wrapper;
        return normalizeToolCall(toolCall);
      })
      .filter((toolCall): toolCall is ToolCall => Boolean(toolCall));
  }

  const directName = firstString(payload.name, payload.tool_name, payload.functionName);

  if (directName) {
    return [
      {
        id: firstString(payload.id, payload.toolCallId) || "direct_tool_call",
        name: directName,
        arguments: getArguments(payload.arguments) ?? getArguments(payload.parameters) ?? payload
      }
    ];
  }

  return [];
}

function normalizeToolCall(value: unknown): ToolCall | null {
  const toolCall = getObject(value);
  const functionCall = getObject(toolCall?.function);
  const id = firstString(toolCall?.id, toolCall?.toolCallId);
  const name = firstString(toolCall?.name, functionCall?.name);
  const args = getArguments(toolCall?.arguments) ?? getArguments(functionCall?.arguments) ?? getArguments(functionCall?.parameters) ?? {};

  if (!name) {
    return null;
  }

  return {
    id: id || crypto.randomUUID(),
    name,
    arguments: args
  };
}

function getArguments(value: unknown): ToolArguments | null {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return getObject(parsed);
    } catch {
      return null;
    }
  }

  return getObject(value);
}

function buildCalendlyLocation(address: string, phone: string) {
  const kind = process.env.CALENDLY_LOCATION_KIND;

  if (!kind) {
    return undefined;
  }

  return {
    kind,
    location:
      process.env.CALENDLY_LOCATION_VALUE ||
      (kind === "outbound_call" ? phone : "") ||
      address ||
      "Customer property"
  };
}

function answer(question: string, answerText: string) {
  return answerText ? { question, answer: answerText } : null;
}

function getSearchStart(startDate: unknown) {
  const requestedDate = firstString(startDate);
  const parsedDate = requestedDate ? new Date(`${requestedDate}T00:00:00+10:00`) : null;
  const now = new Date(Date.now() + 15 * 60 * 1000);

  if (parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate > now) {
    return parsedDate;
  }

  return now;
}

function formatSlotTime(value: string, timezone: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone
  }).format(date);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

function getObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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
