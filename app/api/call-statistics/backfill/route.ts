import { NextResponse } from "next/server";
import {
  recordCallStatisticsBatch,
  refreshCallStatisticsMessage,
  type CallStatisticInput
} from "@/lib/call-statistics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type VapiCall = Record<string, unknown>;

const vapiApiBaseUrl = process.env.VAPI_API_BASE_URL ?? "https://api.vapi.ai";
const defaultFromDate = "2026-07-07";
const defaultToDate = "2026-07-20";
const melbourneTimeZone = "Australia/Melbourne";

export async function GET(request: Request) {
  const authError = validateBackfillSecret(request);

  if (authError) {
    return authError;
  }

  const privateKey = getVapiPrivateKey();

  if (!privateKey) {
    return NextResponse.json(
      {
        error: "Missing VAPI_PRIVATE_KEY or VAPI_API_KEY in the live deployment."
      },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const refreshOnly = url.searchParams.get("refresh") === "1";

  if (refreshOnly) {
    const result = await refreshCallStatisticsMessage();

    return NextResponse.json({
      ok: true,
      refreshed: true,
      ...result
    });
  }

  const from = url.searchParams.get("from")?.trim() || defaultFromDate;
  const to = url.searchParams.get("to")?.trim() || defaultToDate;
  const dryRun = url.searchParams.get("dryRun") === "1";
  const range = {
    createdAtGe: normalizeRangeDate(from, "start"),
    createdAtLt: normalizeRangeDate(to, "end")
  };
  const fetchedCalls = await fetchVapiCalls(privateKey, range);
  const callInputs = fetchedCalls.map(normalizeCallStatisticInput).filter(isCallStatisticInput);
  const duplicateSummary = summarizeDuplicateCallInputs(callInputs);
  const uniqueCallInputs = dedupeCallInputs(callInputs);

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      range,
      fetchedCalls: fetchedCalls.length,
      importableCallRows: callInputs.length,
      uniqueImportableCalls: uniqueCallInputs.length,
      duplicateCallRowsIgnored: duplicateSummary.duplicateRows,
      duplicateCallKeys: duplicateSummary.duplicates.slice(0, 20),
      preview: uniqueCallInputs.slice(0, 10)
    });
  }

  const result = await recordCallStatisticsBatch(uniqueCallInputs);

  return NextResponse.json({
    ok: true,
    range,
    fetchedCalls: fetchedCalls.length,
    importableCallRows: callInputs.length,
    uniqueImportableCalls: uniqueCallInputs.length,
    duplicateCallRowsIgnored: duplicateSummary.duplicateRows,
    ...result
  });
}

function validateBackfillSecret(request: Request) {
  const expectedSecret = process.env.CALL_STATISTICS_BACKFILL_SECRET || process.env.CALL_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      {
        error: "CALL_STATISTICS_BACKFILL_SECRET or CALL_WEBHOOK_SECRET must be configured."
      },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const providedSecret =
    url.searchParams.get("secret") ??
    request.headers.get("x-call-statistics-backfill-secret") ??
    request.headers.get("x-call-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

async function fetchVapiCalls(privateKey: string, range: { createdAtGe: string; createdAtLt: string }) {
  const calls: VapiCall[] = [];
  const pageSize = 1000;
  let cursor = "";

  for (let page = 0; page < 10; page += 1) {
    const url = new URL(`${vapiApiBaseUrl}/call`);

    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("createdAtGe", range.createdAtGe);
    url.searchParams.set("createdAtLt", range.createdAtLt);

    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`Vapi call list failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as unknown;
    const pageCalls = extractCalls(data);

    calls.push(...pageCalls);

    cursor = extractNextCursor(data);

    if (!cursor || pageCalls.length < pageSize) {
      break;
    }
  }

  return calls;
}

function extractCalls(value: unknown): VapiCall[] {
  if (Array.isArray(value)) {
    return value.filter(isObject);
  }

  const object = isObject(value) ? value : {};

  for (const key of ["data", "items", "results", "calls"]) {
    const nestedValue = object[key];

    if (Array.isArray(nestedValue)) {
      return nestedValue.filter(isObject);
    }
  }

  return [];
}

function extractNextCursor(value: unknown) {
  const object = isObject(value) ? value : {};
  const metadata = isObject(object.metadata) ? object.metadata : {};
  const pagination = isObject(object.pagination) ? object.pagination : {};

  return firstString(
    object.nextCursor,
    object.cursor,
    metadata.nextCursor,
    metadata.cursor,
    pagination.nextCursor,
    pagination.cursor
  );
}

function normalizeCallStatisticInput(call: VapiCall): CallStatisticInput | null {
  const customer = isObject(call.customer) ? call.customer : {};
  const phoneNumber = isObject(call.phoneNumber) ? call.phoneNumber : {};
  const callId = firstString(call.id, call.callId);
  const customerNumber = firstString(
    customer.number,
    customer.phoneNumber,
    customerNumberFromMessages(call.messages),
    call.customerNumber,
    call.from
  );
  const businessNumber = firstString(phoneNumber.number, phoneNumber.twilioPhoneNumber, call.to);
  const timestamp = firstString(call.createdAt, call.startedAt, call.updatedAt);

  if (!callId && !customerNumber) {
    return null;
  }

  if (!timestamp) {
    return null;
  }

  return {
    callId: callId || "Unknown",
    customerNumber: customerNumber || businessNumber || "Unknown",
    provider: "Vapi",
    timestamp
  };
}

function isCallStatisticInput(value: CallStatisticInput | null): value is CallStatisticInput {
  return Boolean(value);
}

function dedupeCallInputs(inputs: CallStatisticInput[]) {
  const seen = new Set<string>();

  return inputs.filter((input) => {
    const key = getImportCallKey(input);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

function summarizeDuplicateCallInputs(inputs: CallStatisticInput[]) {
  const counts = new Map<string, number>();

  for (const input of inputs) {
    const key = getImportCallKey(input);

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const duplicates = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({
      count,
      key
    }));

  return {
    duplicateRows: duplicates.reduce((total, duplicate) => total + duplicate.count - 1, 0),
    duplicates
  };
}

function getImportCallKey(input: CallStatisticInput) {
  if (input.callId && input.callId !== "Unknown") {
    return `call:${input.callId}`;
  }

  const phoneKey = input.customerNumber.replace(/\D/g, "") || "unknown";
  const timestamp = new Date(input.timestamp);
  const minuteBucket = Number.isNaN(timestamp.getTime()) ? input.timestamp : Math.floor(timestamp.getTime() / (60 * 1000));

  return `fallback:${input.provider}:${phoneKey}:${minuteBucket}`;
}

function customerNumberFromMessages(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  for (const item of value) {
    const message = isObject(item) ? item : {};
    const customer = isObject(message.customer) ? message.customer : {};
    const number = firstString(customer.number, customer.phoneNumber, message.customerNumber);

    if (number) {
      return number;
    }
  }

  return "";
}

function normalizeRangeDate(value: string, boundary: "start" | "end") {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return zonedDateStartToUtcIso(value);
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toISOString();
  }

  return zonedDateStartToUtcIso(boundary === "start" ? defaultFromDate : defaultToDate);
}

function zonedDateStartToUtcIso(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, melbourneTimeZone);

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60 * 1000).toISOString();
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const timeZoneName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset"
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = timeZoneName?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);

  return sign * (hours * 60 + minutes);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function getVapiPrivateKey() {
  return process.env.VAPI_PRIVATE_KEY ?? process.env.VAPI_API_KEY ?? "";
}
