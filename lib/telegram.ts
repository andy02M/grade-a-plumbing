export type TelegramDelivery = {
  chatId: string;
  messageId: number;
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

export async function sendTelegramMessage(text: string, chatIds = getTelegramChatIds()): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || !chatIds.length) {
    return {
      ok: false,
      error: "Telegram environment variables are not configured."
    };
  }

  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          disable_web_page_preview: true,
          text: text.slice(0, 3900)
        })
      });
      const data = response.ok ? ((await response.json()) as TelegramSendMessageResponse) : null;

      return {
        chatId,
        messageId: data?.result?.message_id,
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

export async function editTelegramMessage(text: string, deliveries: TelegramDelivery[]): Promise<TelegramResult> {
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
          disable_web_page_preview: true,
          message_id: delivery.messageId,
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
  result?: {
    message_id?: number;
  };
};

function getTelegramChatIds() {
  return (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);
}
