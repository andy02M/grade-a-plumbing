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
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return {
      ok: false,
      error: "Telegram environment variables are not configured."
    };
  }

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

  if (!response.ok) {
    return {
      ok: false,
      error: await response.text()
    };
  }

  return { ok: true };
}

export async function sendTelegramAudio(audioUrl: string, caption: string): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return {
      ok: false,
      error: "Telegram environment variables are not configured."
    };
  }

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

  if (!response.ok) {
    return {
      ok: false,
      error: await response.text()
    };
  }

  return { ok: true };
}
