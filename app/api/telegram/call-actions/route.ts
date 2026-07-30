import { NextResponse } from "next/server";
import {
  buildCallActionKeyboard,
  buildCallActionMainKeyboard,
  buildCallActionSubmenuKeyboard,
  getCallActionDestinationLabel,
  getCallActionLabel,
  getCallActionStoreKey,
  getCallActionTopicId,
  getCallTopicDiagnostics,
  getConfiguredCallActionTopics,
  parseCallActionData,
  parseCallActionMenuData,
  parseCallActionStatus,
  shouldDeleteHandledCallAlert,
  type CallActionStatus
} from "@/lib/call-actions";
import { recordCallActionForDashboard } from "@/lib/call-action-dashboard";
import { rememberCallActionItem } from "@/lib/call-action-items";
import { getCallMessageRecord, hasDurableCallAlertStore, rememberCallMessage } from "@/lib/call-alert-store";
import {
  applyAutofilledBookedDetails,
  buildBookedDetailsKeyboard,
  getFillableFieldLabel,
  getFillableFieldPlaceholder,
  getMissingFillableFields,
  parseFillDetailsActionData,
  rememberPendingCallFill
} from "@/lib/call-fill-details";
import { parseCallStatisticsActionData, refreshCallStatisticsMessage } from "@/lib/call-statistics";
import {
  answerTelegramCallbackQuery,
  deleteTelegramMessages,
  editTelegramMessage,
  sendTelegramMessage,
  type TelegramDelivery
} from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const alertDivider = "====================================";
const callActionRecordWindowMs = 14 * 24 * 60 * 60 * 1000;

export type TelegramCallbackUpdate = {
  callback_query?: TelegramCallbackQuery;
};

type TelegramCallbackQuery = {
  data?: string;
  from?: {
    first_name?: string;
    id?: number;
    last_name?: string;
    username?: string;
  };
  id: string;
  message?: {
    chat?: {
      id?: number | string;
    };
    message_id?: number;
    message_thread_id?: number;
    text?: string;
  };
};

export async function GET(request: Request) {
  const authError = validateActionSecret(request);

  if (authError) {
    return authError;
  }

  return NextResponse.json({
    ok: true,
    environment: {
      configuredCallActionTopics: getConfiguredCallActionTopics(),
      callTopicIds: getCallTopicDiagnostics(),
      hasDurableCallAlertStore: hasDurableCallAlertStore(),
      hasTelegramActionSecret: Boolean(getExpectedActionSecret()),
      hasTelegramBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      deleteHandledCallAlerts: shouldDeleteHandledCallAlert()
    }
  });
}

export async function POST(request: Request) {
  const authError = validateActionSecret(request);

  if (authError) {
    return authError;
  }

  const update = (await request.json()) as TelegramCallbackUpdate;

  return handleTelegramCallbackUpdate(update);
}

export async function handleTelegramCallbackUpdate(update: TelegramCallbackUpdate) {
  const callbackQuery = update.callback_query;

  if (!callbackQuery) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const parsedStatisticsAction = parseCallStatisticsActionData(callbackQuery.data);

  if (parsedStatisticsAction) {
    const fallbackDelivery = getFallbackDelivery(callbackQuery);
    const result = await refreshCallStatisticsMessage(
      parsedStatisticsAction.view,
      fallbackDelivery ? [fallbackDelivery] : []
    );
    const actionLabel = parsedStatisticsAction.type === "refresh" ? "Statistics refreshed." : "Statistics view updated.";

    await answerTelegramCallbackQuery(
      callbackQuery.id,
      result.telegram.ok ? actionLabel : "Could not update statistics. Check Vercel logs."
    );

    if (!result.telegram.ok) {
      console.error("Telegram statistics callback failed", result.telegram);
      return NextResponse.json({ error: result.telegram.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      statisticsAction: parsedStatisticsAction.type,
      view: parsedStatisticsAction.view
    });
  }

  const parsedMenuAction = parseCallActionMenuData(callbackQuery.data);

  if (parsedMenuAction) {
    const storeKey = getCallActionStoreKey(parsedMenuAction.actionKey);
    const record = await getCallMessageRecord(storeKey, callActionRecordWindowMs);
    const fallbackDelivery = getFallbackDelivery(callbackQuery);
    const deliveries = fallbackDelivery ? [fallbackDelivery] : record?.deliveries.length ? record.deliveries : [];
    const baseText = callbackQuery.message?.text || record?.text || "Grade A Plumbing call alert";
    const replyMarkup =
      parsedMenuAction.menu === "main"
        ? buildCallActionMainKeyboard(parsedMenuAction.actionKey)
        : buildCallActionSubmenuKeyboard(parsedMenuAction.menu, parsedMenuAction.actionKey);
    const editResult = deliveries.length
      ? await editTelegramMessage(baseText, deliveries, {
          replyMarkup
        })
      : { ok: false as const, error: "Original Telegram message was not available." };

    await answerTelegramCallbackQuery(
      callbackQuery.id,
      parsedMenuAction.menu === "main" ? "Back to main actions." : "Choose the final outcome."
    );

    if (!editResult.ok) {
      console.error("Telegram call menu edit failed", editResult.error);
      return NextResponse.json({ error: editResult.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      actionMenu: parsedMenuAction.menu
    });
  }

  const parsedFillAction = parseFillDetailsActionData(callbackQuery.data);

  if (parsedFillAction) {
    const sourceChatId = getSourceChatId(callbackQuery);
    const userId = callbackQuery.from?.id ? String(callbackQuery.from.id) : "";
    const fieldLabel = getFillableFieldLabel(parsedFillAction.field);

    if (!sourceChatId || !userId) {
      await answerTelegramCallbackQuery(callbackQuery.id, "Could not start fill-in. Try again.");
      return NextResponse.json({ ok: true, ignored: true });
    }

    const promptResult = await sendTelegramMessage(
      `Reply with the ${fieldLabel} for this booked call.`,
      [sourceChatId],
      {
        messageThreadId: callbackQuery.message?.message_thread_id,
        replyMarkup: {
          force_reply: true,
          input_field_placeholder: getFillableFieldPlaceholder(parsedFillAction.field),
          selective: true
        }
      }
    );
    const promptDelivery = promptResult.ok ? promptResult.deliveries?.[0] : undefined;

    await rememberPendingCallFill({
      actionKey: parsedFillAction.actionKey,
      chatId: sourceChatId,
      field: parsedFillAction.field,
      messageThreadId: callbackQuery.message?.message_thread_id,
      promptMessageId: promptDelivery?.messageId,
      userId
    });

    await answerTelegramCallbackQuery(
      callbackQuery.id,
      promptResult.ok ? `Reply with ${fieldLabel}.` : "Could not send fill-in prompt."
    );

    if (!promptResult.ok) {
      console.error("Telegram fill-in prompt failed", promptResult.error);
      return NextResponse.json({ error: promptResult.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      fillField: parsedFillAction.field
    });
  }

  const parsedAction = parseCallActionData(callbackQuery.data);

  if (!parsedAction) {
    await answerTelegramCallbackQuery(callbackQuery.id, "Unknown call action.");
    return NextResponse.json({ ok: true, ignored: true });
  }

  const storeKey = getCallActionStoreKey(parsedAction.actionKey);
  const record = await getCallMessageRecord(storeKey, callActionRecordWindowMs);
  const fallbackDelivery = getFallbackDelivery(callbackQuery);
  const deliveries = fallbackDelivery ? [fallbackDelivery] : record?.deliveries.length ? record.deliveries : [];
  const baseText = callbackQuery.message?.text || record?.text || "Grade A Plumbing call alert";
  const relatedCallMessageKeys = record?.callMessageKeys ?? [];
  const previousAction = parseCallActionStatus(record?.status);
  const handlerName = formatTelegramUser(callbackQuery.from);
  const actionLabel = getCallActionLabel(parsedAction.action);
  const destinationLabel = getCallActionDestinationLabel(parsedAction.action);
  const bookedBaseText = parsedAction.action === "booked" ? applyAutofilledBookedDetails(baseText) : baseText;
  const updatedText = formatHandledAlertText(bookedBaseText, actionLabel, destinationLabel, handlerName);
  const missingFillableFields = parsedAction.action === "booked" ? getMissingFillableFields(updatedText) : [];
  const actionKeyboard = parsedAction.action === "booked"
    ? buildBookedDetailsKeyboard(parsedAction.actionKey, updatedText)
    : buildCallActionKeyboard(parsedAction.actionKey);
  const shouldDeleteWithoutRepost = shouldDeleteCallActionWithoutRepost(parsedAction.action);
  const editResult = deliveries.length
    ? await editTelegramMessage(updatedText, deliveries, {
        replyMarkup: {
          inline_keyboard: []
        }
      })
    : { ok: false as const, error: "Original Telegram message was not available." };

  const sourceChatId = getSourceChatId(callbackQuery);
  const topicId = getCallActionTopicId(parsedAction.action);
  const repostText = formatTopicAlertText(updatedText, actionLabel, destinationLabel);
  const repostResult =
    !shouldDeleteWithoutRepost && sourceChatId && typeof topicId === "number"
      ? await sendTelegramMessage(repostText, [sourceChatId], {
          messageThreadId: topicId,
          replyMarkup: actionKeyboard
        })
      : { ok: true as const };
  const repostDeliveries = repostResult.ok && "deliveries" in repostResult ? repostResult.deliveries ?? [] : [];
  const currentDeliveries = shouldDeleteWithoutRepost ? [] : repostDeliveries.length ? repostDeliveries : deliveries;

  await Promise.all([
    rememberCallMessage(storeKey, currentDeliveries, callActionRecordWindowMs, updatedText, {
      callMessageKeys: relatedCallMessageKeys,
      status: parsedAction.action
    }),
    rememberCallActionItem({
      actionKey: parsedAction.actionKey,
      callMessageKeys: relatedCallMessageKeys,
      chatId: sourceChatId || undefined,
      deliveries: currentDeliveries,
      status: parsedAction.action,
      text: updatedText
    }),
    ...relatedCallMessageKeys.map((key) =>
      rememberCallMessage(key, currentDeliveries, callActionRecordWindowMs, updatedText, {
        callMessageKeys: relatedCallMessageKeys,
        status: parsedAction.action
      })
    )
  ]);

  if (sourceChatId) {
    await recordCallActionForDashboard({
      action: parsedAction.action,
      chatId: sourceChatId,
      previousAction: previousAction ?? undefined
    });
  }

  let deletedOriginal = true;
  let deleteError = "";

  if (shouldDeleteWithoutRepost && deliveries.length) {
    const deleteResult = await deleteTelegramMessages(deliveries);
    deletedOriginal = deleteResult.ok;
    deleteError = deleteResult.ok ? "" : deleteResult.error;

    if (!deleteResult.ok) {
      console.error("Telegram unwanted call delete failed", deleteResult.error);
    }
  } else if (repostResult.ok && shouldDeleteHandledCallAlert() && deliveries.length) {
    const deleteResult = await deleteTelegramMessages(deliveries);
    deletedOriginal = deleteResult.ok;
    deleteError = deleteResult.ok ? "" : deleteResult.error;

    if (!deleteResult.ok) {
      console.error("Telegram handled call delete failed", deleteResult.error);
    }
  }

  await answerTelegramCallbackQuery(
    callbackQuery.id,
    shouldDeleteWithoutRepost
      ? deletedOriginal
        ? `Deleted as ${actionLabel.replace(/^[^\w]+/, "")}.`
        : `Marked as ${actionLabel.replace(/^[^\w]+/, "")}; could not delete alert.`
      : missingFillableFields.length
      ? `Booked. ${missingFillableFields.length} detail${missingFillableFields.length === 1 ? "" : "s"} can be filled in.`
      : topicId
      ? `Marked as ${actionLabel.replace(/^[^\w]+/, "")}. Moved to ${destinationLabel}.`
      : `Marked as ${actionLabel}. Topic not configured.`
  );

  if (!editResult.ok) {
    console.error("Telegram handled call edit failed", editResult.error);
  }

  if (!repostResult.ok) {
    console.error("Telegram handled call repost failed", repostResult.error);
    return NextResponse.json({ error: repostResult.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    action: parsedAction.action,
    deletedOriginal,
    destination: destinationLabel,
    destinationTopicId: topicId ?? null,
    editedOriginal: editResult.ok,
    deleteError,
    repostDeliveries,
    repostedToTopic: !shouldDeleteWithoutRepost && Boolean(topicId)
  });
}

function validateActionSecret(request: Request) {
  const expectedSecret = getExpectedActionSecret();

  if (!expectedSecret) {
    return null;
  }

  const url = new URL(request.url);
  const providedSecret =
    url.searchParams.get("secret") ??
    request.headers.get("x-telegram-bot-api-secret-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function getExpectedActionSecret() {
  return process.env.TELEGRAM_ACTION_SECRET || process.env.CALL_WEBHOOK_SECRET || "";
}

function getFallbackDelivery(callbackQuery: TelegramCallbackQuery): TelegramDelivery | null {
  const chatId = getSourceChatId(callbackQuery);
  const messageId = callbackQuery.message?.message_id;

  if (!chatId || typeof messageId !== "number") {
    return null;
  }

  return {
    chatId,
    messageId
  };
}

function getSourceChatId(callbackQuery: TelegramCallbackQuery) {
  const chatId = callbackQuery.message?.chat?.id;

  return chatId === undefined ? "" : String(chatId);
}

function shouldDeleteCallActionWithoutRepost(action: CallActionStatus) {
  return action === "not_interested" || action === "spam";
}

function formatHandledAlertText(text: string, actionLabel: string, destinationLabel: string, handlerName: string) {
  return [
    removeExistingOutcomeBlock(text),
    "",
    "📌 CALL ACTION",
    alertDivider,
    `✅ OUTCOME: ${actionLabel.toUpperCase()}`,
    `📂 MOVED TO: ${destinationLabel}`,
    handlerName ? `👤 UPDATED BY: ${handlerName}` : "",
    `🕒 UPDATED: ${formatTimestamp(new Date().toISOString())}`,
    alertDivider
  ]
    .filter(Boolean)
    .join("\n");
}

function formatTopicAlertText(text: string, actionLabel: string, destinationLabel: string) {
  return [
    actionLabel.toUpperCase(),
    `📂 ${destinationLabel}`,
    alertDivider,
    "",
    text
  ].join("\n");
}

function removeExistingOutcomeBlock(text: string) {
  const legacyMarker = "\n\n📌 CALL OUTCOME";
  const marker = "\n\n📌 CALL ACTION";
  const markerIndex = text.indexOf(marker);
  const legacyMarkerIndex = text.indexOf(legacyMarker);

  if (markerIndex >= 0) {
    return text.slice(0, markerIndex).trimEnd();
  }

  return legacyMarkerIndex >= 0 ? text.slice(0, legacyMarkerIndex).trimEnd() : text.trimEnd();
}

function formatTelegramUser(user: TelegramCallbackQuery["from"]) {
  if (!user) {
    return "";
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

  return user.username ? `${name || user.username} (@${user.username})` : name;
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Melbourne"
  }).format(date);
}
