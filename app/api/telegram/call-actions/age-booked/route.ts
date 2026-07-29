import { NextResponse } from "next/server";
import {
  buildCallActionKeyboard,
  getCallActionDestinationLabel,
  getCallActionLabel,
  getCallActionStoreKey,
  getCallActionTopicId
} from "@/lib/call-actions";
import { recordCallActionForDashboard } from "@/lib/call-action-dashboard";
import { getBookedCallActionItemsOlderThan, rememberCallActionItem, type CallActionItem } from "@/lib/call-action-items";
import { getCallMessageRecordsByStatus, rememberCallMessage } from "@/lib/call-alert-store";
import { deleteTelegramMessages, sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bookedAgeLimitMs = 3 * 24 * 60 * 60 * 1000;
const callActionRecordWindowMs = 14 * 24 * 60 * 60 * 1000;
const alertDivider = "====================================";

export async function GET(request: Request) {
  const authError = validateCronSecret(request);

  if (authError) {
    return authError;
  }

  const cutoffMs = Date.now() - bookedAgeLimitMs;
  const staleBookedItems = await getStaleBookedItems(cutoffMs);
  const results = [];

  for (const item of staleBookedItems) {
    results.push(await closeBookedItem(item));
  }

  return NextResponse.json({
    ok: true,
    checked: staleBookedItems.length,
    moved: results.filter((result) => result.ok).length,
    results
  });
}

export async function POST(request: Request) {
  return GET(request);
}

async function getStaleBookedItems(cutoffMs: number) {
  const itemsByActionKey = new Map<string, CallActionItem>();

  for (const item of await getBookedCallActionItemsOlderThan(cutoffMs)) {
    itemsByActionKey.set(item.actionKey, item);
  }

  const storedBookedRecords = await getCallMessageRecordsByStatus({
    keyPrefix: "action:",
    status: "booked",
    ttlMs: callActionRecordWindowMs
  });

  for (const { key, record } of storedBookedRecords) {
    const updatedAt = record.storedAt;

    if (updatedAt > cutoffMs) {
      continue;
    }

    const actionKey = key.replace(/^action:/, "");

    if (!actionKey || itemsByActionKey.has(actionKey)) {
      continue;
    }

    itemsByActionKey.set(actionKey, {
      actionKey,
      callMessageKeys: record.callMessageKeys,
      chatId: record.deliveries[0]?.chatId,
      deliveries: record.deliveries,
      status: "booked",
      text: record.text ?? "Grade A Plumbing call alert",
      updatedAt: new Date(record.storedAt).toISOString()
    });
  }

  return [...itemsByActionKey.values()];
}

async function closeBookedItem(item: CallActionItem) {
  const chatId = item.chatId || item.deliveries[0]?.chatId || getPrimaryTelegramChatId();
  const topicId = getCallActionTopicId("auto_closed");

  if (!chatId || typeof topicId !== "number") {
    return {
      actionKey: item.actionKey,
      error: "Closed topic or Telegram chat is not configured.",
      ok: false
    };
  }

  const updatedText = formatAutoClosedAlertText(item.text);
  const sendResult = await sendTelegramMessage(formatTopicAlertText(updatedText), [chatId], {
    messageThreadId: topicId,
    replyMarkup: buildCallActionKeyboard(item.actionKey)
  });

  if (!sendResult.ok) {
    console.error("Telegram booked auto-close repost failed", sendResult.error);

    return {
      actionKey: item.actionKey,
      error: sendResult.error,
      ok: false
    };
  }

  const deliveries = sendResult.deliveries ?? [];

  await Promise.all([
    rememberCallActionItem({
      actionKey: item.actionKey,
      callMessageKeys: item.callMessageKeys,
      chatId,
      deliveries,
      status: "auto_closed",
      text: updatedText
    }),
    rememberCallMessage(getCallActionStoreKey(item.actionKey), deliveries, callActionRecordWindowMs, updatedText, {
      callMessageKeys: item.callMessageKeys,
      status: "auto_closed"
    }),
    ...(item.callMessageKeys ?? []).map((key) =>
      rememberCallMessage(key, deliveries, callActionRecordWindowMs, updatedText, {
        callMessageKeys: item.callMessageKeys,
        status: "auto_closed"
      })
    ),
    recordCallActionForDashboard({
      action: "auto_closed",
      chatId,
      previousAction: "booked"
    })
  ]);

  const deleteResult = item.deliveries.length ? await deleteTelegramMessages(item.deliveries) : { ok: true as const };

  if (!deleteResult.ok) {
    console.error("Telegram booked auto-close delete failed", deleteResult.error);
  }

  return {
    actionKey: item.actionKey,
    deletedOriginal: deleteResult.ok,
    ok: true,
    repostDeliveries: deliveries
  };
}

function validateCronSecret(request: Request) {
  const expectedSecret = process.env.CRON_SECRET || process.env.TELEGRAM_ACTION_SECRET || process.env.CALL_WEBHOOK_SECRET || "";

  if (!expectedSecret) {
    return null;
  }

  const url = new URL(request.url);
  const providedSecret =
    url.searchParams.get("secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function getPrimaryTelegramChatId() {
  return (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((chatId) => chatId.trim())
    .find(Boolean);
}

function formatAutoClosedAlertText(text: string) {
  const actionLabel = getCallActionLabel("auto_closed");

  return [
    removeExistingActionBlock(text),
    "",
    "CALL ACTION",
    alertDivider,
    `OUTCOME: ${actionLabel.toUpperCase()}`,
    `MOVED TO: ${getCallActionDestinationLabel("auto_closed")}`,
    "UPDATED BY: Automatic 3-day booked cleanup",
    `UPDATED: ${formatTimestamp(new Date().toISOString())}`,
    alertDivider
  ]
    .filter(Boolean)
    .join("\n");
}

function formatTopicAlertText(text: string) {
  const actionLabel = getCallActionLabel("auto_closed");

  return [
    actionLabel.toUpperCase(),
    getCallActionDestinationLabel("auto_closed"),
    alertDivider,
    "",
    text
  ].join("\n");
}

function removeExistingActionBlock(text: string) {
  const legacyMarker = "\n\nðŸ“Œ CALL OUTCOME";
  const marker = "\n\nðŸ“Œ CALL ACTION";
  const plainMarker = "\n\nCALL ACTION";
  const indexes = [text.indexOf(marker), text.indexOf(legacyMarker), text.indexOf(plainMarker)].filter((index) => index >= 0);
  const markerIndex = indexes.length ? Math.min(...indexes) : -1;

  return markerIndex >= 0 ? text.slice(0, markerIndex).trimEnd() : text.trimEnd();
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Melbourne"
  }).format(date);
}
