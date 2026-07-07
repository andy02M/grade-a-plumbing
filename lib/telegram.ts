type TelegramResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
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
      error: failedResults.map((result) => `${result.chatId}: ${result.error}`).join("\n")
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
      error: failedResults.map((result) => `${result.chatId}: ${result.error}`).join("\n")
    };
  }

  return { ok: true };
}

function getTelegramChatIds() {
  return (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);
}
