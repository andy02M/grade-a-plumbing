import { NextResponse } from "next/server";
import { buildCallActionKeyboard, getCallActionStoreKey, getNewCallsTopicId } from "@/lib/call-actions";
import { rememberCallMessage } from "@/lib/call-alert-store";
import { getPlumberEtaLines } from "@/lib/plumber-eta";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const testCallRecordWindowMs = 14 * 24 * 60 * 60 * 1000;
const testDivider = "====================================";

export async function GET(request: Request) {
  const authError = validateTestSecret(request);

  if (authError) {
    return authError;
  }

  const url = new URL(request.url);
  const address = url.searchParams.get("address")?.trim() || "1 Collins Street, Melbourne VIC 3000";
  const actionKey = `maps-test-${Date.now().toString(36)}`;
  const callMessageKey = `TelegramMapsTest:${actionKey}`;
  const eta = await getPlumberEtaLines(address);
  const text = [
    ...formatTestHeader("🟩🟦🟩🟩🟦🟩🟩🟦🟩", "🚰 GRADE A PLUMBING", "✅ GOOGLE MAPS ETA TEST"),
    ...formatTestSection("👤 CUSTOMER", [
      "Name: Test Customer",
      "Caller: +61400000000",
      "Best contact: +61400000000",
      `Location: ${address}`
    ]),
    ...formatTestSection("🔧 JOB DETAILS", [
      "Issue: Leaking tap under kitchen sink",
      "Urgency: Today",
      "Preferred: Today after 2pm",
      `Tested: ${formatMelbourneTimestamp(new Date().toISOString())}`
    ]),
    ...eta.lines,
    ...formatTestSection("🎯 NEXT ACTION", ["Tap Booked to test the required booking-detail flow."])
  ].filter((line, index, array) => line !== "" || (Boolean(array[index - 1]) && array[index - 1] !== "")).join("\n");

  const result = await sendTelegramMessage(text, undefined, {
    messageThreadId: getNewCallsTopicId(),
    replyMarkup: buildCallActionKeyboard(actionKey)
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (result.deliveries?.length) {
    await Promise.all([
      rememberCallMessage(callMessageKey, result.deliveries, testCallRecordWindowMs, text, {
        callMessageKeys: [callMessageKey]
      }),
      rememberCallMessage(getCallActionStoreKey(actionKey), result.deliveries, testCallRecordWindowMs, text, {
        callMessageKeys: [callMessageKey]
      })
    ]);
  }

  return NextResponse.json({
    ok: true,
    address,
    mapsEnabled: eta.mapsEnabled,
    deliveries: result.deliveries ?? [],
    etaLines: eta.lines
  });
}

function validateTestSecret(request: Request) {
  const expectedSecret = process.env.TELEGRAM_TEST_CALL_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "TELEGRAM_TEST_CALL_SECRET is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const providedSecret =
    url.searchParams.get("secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function formatMelbourneTimestamp(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Melbourne"
  }).format(date);
}

function formatTestHeader(symbols: string, title: string, status: string) {
  return [symbols, title, status, symbols];
}

function formatTestSection(title: string, rows: string[]) {
  const filteredRows = rows.filter(Boolean);

  if (!filteredRows.length) {
    return [];
  }

  return ["", title, testDivider, ...filteredRows];
}
