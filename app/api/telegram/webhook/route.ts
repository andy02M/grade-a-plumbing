import { NextResponse } from "next/server";
import { handleTelegramCallbackUpdate, type TelegramCallbackUpdate } from "@/app/api/telegram/call-actions/route";
import { site } from "@/lib/site";
import { sendTelegramMessageToChat } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const reply = await handleCommand(String(chatId), text);
  await sendTelegramMessageToChat(chatId, reply);

  return NextResponse.json({ ok: true });
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

  if (command === "/deploy") {
    return triggerDeploy();
  }

  return "Unknown command. Send /help for available commands.";
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
