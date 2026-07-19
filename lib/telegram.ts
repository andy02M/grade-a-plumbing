export type TelegramDelivery = {
  chatId: string;
  messageId: number;
};

export type TelegramInlineKeyboardMarkup = {
  inline_keyboard: Array<
    Array<{
      callback_data: string;
      text: string;
    }>
  >;
};

type TelegramMessageOptions = {
  disableWebPagePreview?: boolean;
  messageThreadId?: number;
  replyMarkup?: TelegramInlineKeyboardMarkup | null;
};

type TelegramResult =
  | {
      ok: true;
      deliveries?: TelegramDelivery[];
    }
  | {
      ok: false;
      error: string;
      failedChatIds?: string[];
    };

export async function sendTelegramMessage(
  text: string,
  chatIds = getTelegramChatIds(),
  options: TelegramMessageOptions = {}
): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || !chatIds.length) {
    return {
      ok: false,
      error: "Telegram environment variables are not configured."
    };
  }

  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      return sendTelegramTextToChat(botToken, chatId, text, options);
    })
  );

  const failedResults = results.filter((result) => !result.ok);

  if (failedResults.length) {
    return {
      ok: false,
      error: failedResults.map((result) => `${result.chatId}: ${result.error}`).join("\n"),
      failedChatIds: failedResults.map((result) => result.chatId)
    };
  }

  return {
    ok: true,
    deliveries: results
      .filter((result): result is typeof result & { messageId: number } => typeof result.messageId === "number")
      .map((result) => ({
        chatId: result.chatId,
        messageId: result.messageId
      }))
  };
}

async function sendTelegramTextToChat(
  botToken: string,
  chatId: string,
  text: string,
  options: TelegramMessageOptions,
  attemptedMigration = false
) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: options.disableWebPagePreview ?? true,
      ...(typeof options.messageThreadId === "number" ? { message_thread_id: options.messageThreadId } : {}),
      ...(options.replyMarkup !== undefined ? { reply_markup: options.replyMarkup } : {}),
      text: text.slice(0, 3900)
    })
  });
  const data = (await parseTelegramResponse(response)) as TelegramSendMessageResponse;
  const migratedChatId = getMigratedChatId(data);

  if (!response.ok && migratedChatId && !attemptedMigration) {
    return sendTelegramTextToChat(botToken, migratedChatId, text, options, true);
  }

  return {
    chatId,
    messageId: data.result?.message_id,
    ok: response.ok,
    error: response.ok ? "" : JSON.stringify(data)
  };
}

export async function editTelegramMessage(
  text: string,
  deliveries: TelegramDelivery[],
  options: TelegramMessageOptions = {}
): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || !deliveries.length) {
    return {
      ok: false,
      error: "Telegram message IDs are not available to edit."
    };
  }

  const results = await Promise.all(
    deliveries.map(async (delivery) => {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: delivery.chatId,
          disable_web_page_preview: options.disableWebPagePreview ?? true,
          message_id: delivery.messageId,
          ...(options.replyMarkup !== undefined ? { reply_markup: options.replyMarkup } : {}),
          text: text.slice(0, 3900)
        })
      });
      const error = response.ok ? "" : await response.text();
      const ok = response.ok || error.toLowerCase().includes("message is not modified");

      return {
        chatId: delivery.chatId,
        ok,
        error: ok ? "" : error
      };
    })
  );

  const failedResults = results.filter((result) => !result.ok);

  if (failedResults.length) {
    return {
      ok: false,
      error: failedResults.map((result) => `${result.chatId}: ${result.error}`).join("\n"),
      failedChatIds: failedResults.map((result) => result.chatId)
    };
  }

  return { ok: true };
}

export async function answerTelegramCallbackQuery(callbackQueryId: string, text?: string): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return {
      ok: false,
      error: "Telegram bot token is not configured."
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      ...(text ? { text: text.slice(0, 200) } : {})
    })
  });

  if (!response.ok) {
    return {
      ok: false,
      error: await response.text()
    };
  }

  return { ok: true };
}

export async function deleteTelegramMessages(deliveries: TelegramDelivery[]): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || !deliveries.length) {
    return {
      ok: false,
      error: "Telegram message IDs are not available to delete."
    };
  }

  const results = await Promise.all(
    deliveries.map(async (delivery) => {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: delivery.chatId,
          message_id: delivery.messageId
        })
      });

      return {
        chatId: delivery.chatId,
        ok: response.ok,
        error: response.ok ? "" : await response.text()
      };
    })
  );

  const failedResults = results.filter((result) => !result.ok);

  if (failedResults.length) {
    return {
      ok: false,
      error: failedResults.map((result) => `${result.chatId}: ${result.error}`).join("\n"),
      failedChatIds: failedResults.map((result) => result.chatId)
    };
  }

  return { ok: true };
}

export async function sendTelegramAudio(audioUrl: string, caption: string): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getTelegramChatIds();

  if (!botToken || !chatIds.length) {
    return {
      ok: false,
      error: "Telegram environment variables are not configured."
    };
  }

  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          audio: audioUrl,
          caption: caption.slice(0, 1000),
          chat_id: chatId
        })
      });

      return {
        chatId,
        ok: response.ok,
        error: response.ok ? "" : await response.text()
      };
    })
  );

  const failedResults = results.filter((result) => !result.ok);

  if (failedResults.length) {
    return {
      ok: false,
      error: failedResults.map((result) => `${result.chatId}: ${result.error}`).join("\n"),
      failedChatIds: failedResults.map((result) => result.chatId)
    };
  }

  return { ok: true };
}

type TelegramSendMessageResponse = {
  ok: boolean;
  description?: string;
  error_code?: number;
  parameters?: {
    migrate_to_chat_id?: number;
  };
  result?: {
    message_id?: number;
  };
};

async function parseTelegramResponse(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {
      description: await response.text(),
      ok: response.ok
    };
  }
}

function getMigratedChatId(data: TelegramSendMessageResponse) {
  const migratedChatId = data.parameters?.migrate_to_chat_id;

  return typeof migratedChatId === "number" ? String(migratedChatId) : "";
}

function getTelegramChatIds() {
  return (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);
}
