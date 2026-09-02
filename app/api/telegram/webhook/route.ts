import { NextResponse } from "next/server";
import { handleTelegramCallbackUpdate, type TelegramCallbackUpdate } from "@/app/api/telegram/call-actions/route";
import {
  buildCallActionKeyboard,
  getCallActionStoreKey,
  getCallActionTopicId,
  getNewCallsTopicId,
  parseCallActionStatus
} from "@/lib/call-actions";
import { recordCallActionForDashboard } from "@/lib/call-action-dashboard";
import { rememberCallActionItem } from "@/lib/call-action-items";
import { getCallMessageRecord, rememberCallMessage } from "@/lib/call-alert-store";
import {
  applyFilledCallDetail,
  buildBookedDetailsKeyboard,
  clearPendingCallFill,
  formatCompletedBookedText,
  getActionStatusFromText,
  getFillableFieldLabel,
  getMissingFillableFields,
  getPendingCallFill
} from "@/lib/call-fill-details";
import { site } from "@/lib/site";
import {
  deleteTelegramMessages,
  editTelegramMessage,
  sendTelegramMessage,
  sendTelegramMessageToChat,
  type TelegramDelivery
} from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const testCallRecordWindowMs = 14 * 24 * 60 * 60 * 1000;

type TelegramUpdate = TelegramCallbackUpdate & {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

type TelegramMessage = {
  chat?: {
    id?: number | string;
    title?: string;
    username?: string;
    first_name?: string;
  };
  from?: {
    id?: number;
  };
  message_id?: number;
  message_thread_id?: number;
  text?: string;
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Grade A Plumbing Telegram webhook",
    configured: {
      hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasAllowedChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
      hasWebhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      hasDeployHook: Boolean(process.env.VERCEL_DEPLOY_HOOK_URL)
    }
  });
}

export async function POST(request: Request) {
  const authError = validateTelegramSecret(request);

  if (authError) {
    return authError;
  }

  const update = (await request.json()) as TelegramUpdate;

  if (update.callback_query) {
    return handleTelegramCallbackUpdate(update);
  }

  const message = update.message ?? update.edited_message;
  const chatId = message?.chat?.id;
  const text = message?.text?.trim() ?? "";

  if (!chatId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const fillResult = await handlePendingFillReply(String(chatId), message, text);

  if (fillResult.handled) {
    return NextResponse.json({ ok: fillResult.ok });
  }

  const result = await handleCommand(String(chatId), text);

  if (result) {
    await sendTelegramMessageToChat(chatId, result);
  }

  return NextResponse.json({ ok: true });
}

async function handlePendingFillReply(chatId: string, message: TelegramMessage | undefined, text: string) {
  const userId = message?.from?.id ? String(message.from.id) : "";

  if (!userId || !text || text.startsWith("/")) {
    return {
      handled: false,
      ok: true
    };
  }

  const pendingFill = await getPendingCallFill(chatId, userId);

  if (!pendingFill) {
    return {
      handled: false,
      ok: true
    };
  }

  const storeKey = getCallActionStoreKey(pendingFill.actionKey);
  const record = await getCallMessageRecord(storeKey, testCallRecordWindowMs);
  const replyWasInSourceChat = chatId === pendingFill.chatId;
  const staffReplyDelivery =
    replyWasInSourceChat && typeof message?.message_id === "number"
      ? [{ chatId, messageId: message.message_id }]
      : [];

  await clearPendingCallFill(chatId, userId);

  if (staffReplyDelivery.length) {
    const deleteResult = await deleteTelegramMessages(staffReplyDelivery);

    if (!deleteResult.ok) {
      console.error("Telegram staff fill reply delete failed", deleteResult.error);
    }
  }

  if (!record?.deliveries.length) {
    await sendTelegramMessage(
      "I could not find the booked alert to update. Please use the call buttons again.",
      [replyWasInSourceChat ? userId : chatId],
      replyWasInSourceChat ? {} : { messageThreadId: pendingFill.messageThreadId ?? message?.message_thread_id }
    );

    return {
      handled: true,
      ok: false
    };
  }

  const filledText = applyFilledCallDetail(record.text ?? "Grade A Plumbing call alert", pendingFill.field, text);
  const status = parseCallActionStatus(record.status) ?? getActionStatusFromText(filledText) ?? "booked";
  const missingFields = status === "booked" ? getMissingFillableFields(filledText) : [];
  const updatedText = status === "booked" && missingFields.length === 0 ? formatCompletedBookedText(filledText) : filledText;
  const replyMarkup =
    status === "booked" ? buildBookedDetailsKeyboard(pendingFill.actionKey, updatedText) : buildCallActionKeyboard(pendingFill.actionKey);
  const shouldFinalizeBookedFromNewCalls =
    status === "booked" && missingFields.length === 0 && pendingFill.messageThreadId === getNewCallsTopicId();
  const bookedTopicId = getCallActionTopicId("booked");
  const moveResult =
    shouldFinalizeBookedFromNewCalls && typeof bookedTopicId === "number"
      ? await moveCompletedBookingToBookedTopic(pendingFill.chatId, bookedTopicId, updatedText, pendingFill.actionKey, record.deliveries)
      : { deliveries: record.deliveries, moved: false };
  const editResult = moveResult.moved
    ? { ok: true as const }
    : await editTelegramMessage(updatedText, record.deliveries, {
        replyMarkup
      });
  const relatedCallMessageKeys = record.callMessageKeys ?? [];

  await Promise.all([
    rememberCallMessage(storeKey, moveResult.deliveries, testCallRecordWindowMs, updatedText, {
      callMessageKeys: relatedCallMessageKeys,
      status
    }),
    moveResult.moved || status !== "booked" || pendingFill.messageThreadId !== getNewCallsTopicId()
      ? rememberCallActionItem({
          actionKey: pendingFill.actionKey,
          callMessageKeys: relatedCallMessageKeys,
          chatId: pendingFill.chatId,
          deliveries: moveResult.deliveries,
          status,
          text: updatedText
        })
      : Promise.resolve(),
    ...relatedCallMessageKeys.map((key) =>
      rememberCallMessage(key, moveResult.deliveries, testCallRecordWindowMs, updatedText, {
        callMessageKeys: relatedCallMessageKeys,
        status
      })
    ),
    moveResult.moved
      ? recordCallActionForDashboard({
          action: "booked",
          chatId: pendingFill.chatId,
          previousAction: parseCallActionStatus(record.status) ?? undefined
        })
      : Promise.resolve()
  ]);

  await sendTelegramMessage(
    moveResult.moved
      ? "Booking details complete. The call has been moved to 02 Booked."
      : `${getFillableFieldLabel(pendingFill.field)} updated.${missingFields.length ? ` ${missingFields.length} still required.` : ""}`,
    [replyWasInSourceChat ? userId : chatId]
  );

  if (!editResult.ok) {
    console.error("Telegram filled detail edit failed", editResult.error);
  }

  return {
    handled: true,
    ok: editResult.ok
  };
}

async function moveCompletedBookingToBookedTopic(
  chatId: string,
  bookedTopicId: number,
  text: string,
  actionKey: string,
  oldDeliveries: TelegramDelivery[]
) {
  const sendResult = await sendTelegramMessage(text, [chatId], {
    messageThreadId: bookedTopicId,
    replyMarkup: buildBookedDetailsKeyboard(actionKey, text)
  });

  if (!sendResult.ok) {
    console.error("Telegram completed booking repost failed", sendResult.error);
    return {
      deliveries: oldDeliveries,
      moved: false
    };
  }

  const deleteResult = await deleteTelegramMessages(oldDeliveries);

  if (!deleteResult.ok) {
    console.error("Telegram completed booking original delete failed", deleteResult.error);
  }

  return {
    deliveries: sendResult.deliveries?.length ? sendResult.deliveries : oldDeliveries,
    moved: Boolean(sendResult.deliveries?.length)
  };
}

function validateTelegramSecret(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "Telegram webhook secret is not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const providedSecret =
    request.headers.get("x-telegram-bot-api-secret-token") ?? url.searchParams.get("secret");

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

async function handleCommand(chatId: string, text: string) {
  const command = text.split(/\s+/)[0]?.toLowerCase() || "";

  if (!command.startsWith("/")) {
    return null;
  }

  if (command === "/start") {
    return [
      `Connected to ${site.name}.`,
      "",
      `Your Telegram chat ID is: ${chatId}`,
      "",
      isAllowedChat(chatId)
        ? "This chat is authorized for commands."
        : "Add this ID to TELEGRAM_CHAT_ID in Vercel to authorize commands.",
      "",
      "Send /help to see available commands."
    ].join("\n");
  }

  if (command === "/help") {
    return [
      "Grade A Plumbing commands:",
      "/start - show this chat ID",
      "/status - check the website bot connection",
      "/testcall - post a fresh test call alert with action buttons",
      "/deploy - trigger a Vercel deploy hook when configured"
    ].join("\n");
  }

  if (!isAllowedChat(chatId)) {
    return [
      "This chat is not authorized for site commands.",
      `Chat ID: ${chatId}`,
      "Add it to TELEGRAM_CHAT_ID in Vercel first."
    ].join("\n");
  }

  if (command === "/status") {
    return [
      `${site.name} is connected to Telegram.`,
      `Website: ${site.baseUrl}`,
      `Phone: ${site.phone}`,
      `Email: ${site.email}`,
      `Deploy hook: ${process.env.VERCEL_DEPLOY_HOOK_URL ? "configured" : "not configured"}`
    ].join("\n");
  }

  if (command === "/testcall") {
    return sendTestCallAlert(chatId);
  }

  if (command === "/deploy") {
    return triggerDeploy();
  }

  return null;
}

async function sendTestCallAlert(chatId: string) {
  const actionKey = `test-${Date.now().toString(36)}`;
  const callMessageKey = `TelegramTest:${actionKey}`;
  const text = [
    "🟦🟪🟩🟦🟪🟩🟦🟪🟩",
    "====================================",
    "🎮 GRADE A PLUMBING ALERTS",
    "📲 TEST CUSTOMER CALL RECEIVED",
    "====================================",
    "",
    "🟢 CALL STATUS: TEST",
    "🤖 ASSISTANT: MAX",
    "🔧 SERVICE TYPE: PLUMBING ENQUIRY",
    "",
    "====================================",
    "📞 CALLER ID: +61400000000",
    "📱 BEST CONTACT: Test customer",
    `🕒 STARTED: ${formatMelbourneTimestamp(new Date().toISOString())}`,
    "====================================",
    "",
    "🎯 TEST DETAILS",
    "Use the buttons below to test Follow Up, Closed, dashboard counts, and status moving.",
    "",
    "====================================",
    "🟦🟩🟦 TEST CALL ACTIVE 🟦🟩🟦",
    "===================================="
  ].join("\n");

  const result = await sendTelegramMessage(text, [chatId], {
    messageThreadId: getNewCallsTopicId(),
    replyMarkup: buildCallActionKeyboard(actionKey)
  });

  if (!result.ok) {
    console.error("Telegram test call alert failed", result.error);
    return "Could not create the test call alert. Check Vercel logs.";
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

  return null;
}

function isAllowedChat(chatId: string) {
  return (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((allowedChatId) => allowedChatId.trim())
    .filter(Boolean)
    .includes(chatId);
}

async function triggerDeploy() {
  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

  if (!deployHookUrl) {
    return "Deploy hook is not configured yet. Add VERCEL_DEPLOY_HOOK_URL in Vercel to enable /deploy.";
  }

  const response = await fetch(deployHookUrl, {
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) {
    return `Deploy trigger failed: ${response.status} ${await response.text()}`;
  }

  return "Deploy triggered. Vercel should start building the latest GitHub version now.";
}

function formatMelbourneTimestamp(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Melbourne"
  }).format(date);
}
