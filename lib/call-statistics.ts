import { getStatisticsTopicId } from "@/lib/call-actions";
import { claimRecentAlert, getStoredJson, setStoredJson } from "@/lib/call-alert-store";
import {
  editTelegramMessage,
  sendTelegramMessage,
  type TelegramDelivery,
  type TelegramInlineKeyboardMarkup
} from "@/lib/telegram";

export type CallStatisticInput = {
  callId: string;
  customerNumber: string;
  provider: string;
  timestamp: string;
};

type RecentCall = {
  callerId: string;
  callId: string;
  identity: string;
  provider: string;
  startedAt: string;
};

type CallStats = {
  byDate: Record<string, number>;
  byDateHour: Record<string, number>;
  byHour: Record<string, number>;
  byWeekday: Record<string, number>;
  firstRecordedAt: string;
  recentCalls: RecentCall[];
  totalCalls: number;
  updatedAt: string;
};

type StatisticsMessageRecord = {
  deliveries: TelegramDelivery[];
  storedAt: number;
  text: string;
  view?: CallStatisticsView;
};

export type CallStatisticsView = "today" | "7d" | "30d" | "all";

type CallStatisticsAction =
  | {
      type: "refresh";
      view: CallStatisticsView;
    }
  | {
      type: "view";
      view: CallStatisticsView;
    };

const melbourneTimeZone = "Australia/Melbourne";
const statisticsStoreTtlMs = 366 * 24 * 60 * 60 * 1000;
const statisticsKind = "stats";
const statisticsKey = "call-volume";
const statisticsMessageKey = "telegram-message";
const defaultStatisticsView: CallStatisticsView = "7d";

export async function recordCallStatistic(input: CallStatisticInput) {
  const result = await recordCallStatisticsBatch([input]);

  return result.recorded;
}

export async function recordCallStatisticsBatch(inputs: CallStatisticInput[]) {
  const stats = normalizeStats(await getStoredJson<Partial<CallStats>>(statisticsKind, statisticsKey, statisticsStoreTtlMs));
  let recorded = 0;
  let recentCallsUpdated = false;

  for (const input of inputs) {
    const eventTime = parseCallDate(input.timestamp);
    const identity = getCallIdentity(input, eventTime);
    const isNewCall = await claimRecentAlert(`statistics:${identity}`, statisticsStoreTtlMs);

    if (!isNewCall) {
      mergeRecentCall(stats, input, eventTime, identity);
      recentCallsUpdated = true;
      continue;
    }

    applyCallStatistic(stats, input, eventTime, identity);
    recorded += 1;
  }

  if (recorded > 0 || recentCallsUpdated) {
    await setStoredJson(statisticsKind, statisticsKey, stats, statisticsStoreTtlMs);
  }

  const telegram = await updateStatisticsMessage(stats);

  return {
    recorded,
    skipped: inputs.length - recorded,
    telegram,
    totalCalls: stats.totalCalls
  };
}

export async function refreshCallStatisticsMessage(view?: CallStatisticsView, fallbackDeliveries: TelegramDelivery[] = []) {
  const stats = normalizeStats(await getStoredJson<Partial<CallStats>>(statisticsKind, statisticsKey, statisticsStoreTtlMs));
  const telegram = await updateStatisticsMessage(stats, view, fallbackDeliveries);

  return {
    telegram,
    totalCalls: stats.totalCalls
  };
}

export function parseCallStatisticsActionData(value: string | undefined): CallStatisticsAction | null {
  const parts = (value ?? "").split(":");

  if (parts[0] !== "gapstats") {
    return null;
  }

  if (parts[1] === "refresh") {
    return {
      type: "refresh",
      view: normalizeCallStatisticsView(parts[2])
    };
  }

  if (parts[1] === "view") {
    const view = parseCallStatisticsView(parts[2]);

    return view
      ? {
          type: "view",
          view
        }
      : null;
  }

  return null;
}

function applyCallStatistic(stats: CallStats, input: CallStatisticInput, eventTime: Date, identity: string) {
  const parts = getMelbourneDateParts(eventTime);

  stats.totalCalls += 1;
  stats.firstRecordedAt ||= new Date().toISOString();
  stats.updatedAt = new Date().toISOString();
  increment(stats.byDate, parts.dateKey);
  increment(stats.byHour, parts.hour);
  increment(stats.byWeekday, parts.weekday);
  increment(stats.byDateHour, `${parts.dateKey}:${parts.hour}`);

  mergeRecentCall(stats, input, eventTime, identity);

  return stats;
}

function mergeRecentCall(stats: CallStats, input: CallStatisticInput, eventTime: Date, identity: string) {
  stats.recentCalls = [
    {
      callerId: input.customerNumber || "Unknown / private",
      callId: input.callId || "Unknown",
      identity,
      provider: input.provider || "Unknown",
      startedAt: eventTime.toISOString()
    },
    ...stats.recentCalls.filter((call) => call.identity !== identity)
  ]
    .sort(compareRecentCallsDescending)
    .slice(0, 12);

  return stats;
}

async function updateStatisticsMessage(stats: CallStats, view?: CallStatisticsView, fallbackDeliveries: TelegramDelivery[] = []) {
  const topicId = getStatisticsTopicId();
  const chatIds = getStatisticsChatIds();

  if (typeof topicId !== "number" || !chatIds.length) {
    return {
      attempted: false,
      error: "Statistics topic ID or statistics chat ID is not configured.",
      ok: false
    };
  }

  const existingMessage = await getStoredJson<StatisticsMessageRecord>(
    statisticsKind,
    statisticsMessageKey,
    statisticsStoreTtlMs
  );
  const selectedView = normalizeCallStatisticsView(view ?? existingMessage?.view);
  const text = formatStatisticsMessage(stats, selectedView);
  const replyMarkup = buildStatisticsKeyboard(selectedView);
  const existingDeliveries = fallbackDeliveries.length ? fallbackDeliveries : getStoredDeliveries(existingMessage);

  if (existingDeliveries.length) {
    const editResult = await editTelegramMessage(text, existingDeliveries, {
      replyMarkup
    });

    if (editResult.ok) {
      await rememberStatisticsMessage(existingDeliveries, text, selectedView);
      return {
        attempted: true,
        mode: "edit",
        ok: true
      };
    }

    console.error("Telegram statistics message edit failed", editResult.error);
  }

  const sendResult = await sendTelegramMessage(text, chatIds, {
    messageThreadId: topicId,
    replyMarkup
  });

  if (!sendResult.ok) {
    console.error("Telegram statistics message failed", sendResult.error);
    return {
      attempted: true,
      error: sendResult.error,
      mode: "send",
      ok: false
    };
  }

  if (sendResult.deliveries?.length) {
    await rememberStatisticsMessage(sendResult.deliveries, text, selectedView);
  }

  return {
    attempted: true,
    mode: "send",
    ok: true
  };
}

async function rememberStatisticsMessage(deliveries: TelegramDelivery[], text: string, view: CallStatisticsView) {
  await setStoredJson<StatisticsMessageRecord>(
    statisticsKind,
    statisticsMessageKey,
    {
      deliveries,
      storedAt: Date.now(),
      text,
      view
    },
    statisticsStoreTtlMs
  );
}

function formatStatisticsMessage(stats: CallStats, view: CallStatisticsView) {
  const now = new Date();
  const todayKey = getMelbourneDateParts(now).dateKey;
  const lastSevenDays = getLastDateKeys(now, 7);
  const lastThirtyDays = getLastDateKeys(now, 30);
  const viewHourCounts = getHourCountsForView(stats, view, now);
  const viewTotalCalls = getTotalForView(stats, view, now);
  const todayCalls = stats.byDate[todayKey] ?? 0;
  const sevenDayCalls = lastSevenDays.reduce((total, dateKey) => total + (stats.byDate[dateKey] ?? 0), 0);
  const thirtyDayCalls = lastThirtyDays.reduce((total, dateKey) => total + (stats.byDate[dateKey] ?? 0), 0);
  const busiestHour = getTopEntry(viewHourCounts);
  const busiestWeekday = getTopEntry(stats.byWeekday);
  const barChartLines = getHourBarChartLines(viewHourCounts);
  const recentCallLines = getRecentCallLines(stats.recentCalls);

  return [
    "🟦🟪🟩🟦🟪🟩🟦🟪🟩",
    "====================================",
    "📊 GRADE A PLUMBING CALL STATS",
    "📞 CALL VOLUME DASHBOARD",
    "====================================",
    "",
    `📌 TOTAL CALLS TRACKED: ${stats.totalCalls}`,
    `📅 TODAY: ${todayCalls}`,
    `🗓️ LAST 7 DAYS: ${sevenDayCalls}`,
    `📆 LAST 30 DAYS: ${thirtyDayCalls}`,
    `🔎 CURRENT VIEW: ${getStatisticsViewLabel(view)}`,
    `📞 CALLS IN VIEW: ${viewTotalCalls}`,
    `🔥 BUSIEST HOUR: ${busiestHour ? `${formatHourLabel(busiestHour.key)} - ${busiestHour.value} call${plural(busiestHour.value)}` : "Not enough data yet"}`,
    `🏆 BUSIEST DAY: ${busiestWeekday ? `${busiestWeekday.key} - ${busiestWeekday.value} call${plural(busiestWeekday.value)}` : "Not enough data yet"}`,
    "",
    "====================================",
    `📊 CALLS BY HOUR - ${getStatisticsViewLabel(view).toUpperCase()}`,
    ...barChartLines,
    "",
    "====================================",
    "🧾 RECENT CALLS - NEWEST FIRST",
    ...recentCallLines,
    "",
    "====================================",
    `🔄 UPDATED: ${formatMelbourneUpdateTimestamp(now.toISOString())}`,
    "===================================="
  ].join("\n");
}

function buildStatisticsKeyboard(activeView: CallStatisticsView): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          callback_data: `gapstats:refresh:${activeView}`,
          text: "🔄 Refresh"
        }
      ],
      [
        buildStatisticsViewButton("today", activeView),
        buildStatisticsViewButton("7d", activeView)
      ],
      [
        buildStatisticsViewButton("30d", activeView),
        buildStatisticsViewButton("all", activeView)
      ]
    ]
  };
}

function buildStatisticsViewButton(view: CallStatisticsView, activeView: CallStatisticsView) {
  return {
    callback_data: `gapstats:view:${view}`,
    text: `${view === activeView ? "✅ " : ""}${getStatisticsViewLabel(view)}`
  };
}

function getHourCountsForView(stats: CallStats, view: CallStatisticsView, now: Date) {
  const counts = createEmptyHourCounts();

  if (view === "all") {
    for (const [hour, value] of Object.entries(stats.byHour)) {
      counts[hour] = value;
    }

    return counts;
  }

  const dateKeys = new Set(getDateKeysForView(view, now));

  for (const [key, value] of Object.entries(stats.byDateHour)) {
    const [dateKey, hour] = key.split(":");

    if (dateKeys.has(dateKey)) {
      counts[hour] = (counts[hour] ?? 0) + value;
    }
  }

  return counts;
}

function getTotalForView(stats: CallStats, view: CallStatisticsView, now: Date) {
  if (view === "all") {
    return stats.totalCalls;
  }

  return getDateKeysForView(view, now).reduce((total, dateKey) => total + (stats.byDate[dateKey] ?? 0), 0);
}

function getDateKeysForView(view: CallStatisticsView, now: Date) {
  if (view === "today") {
    return getLastDateKeys(now, 1);
  }

  if (view === "30d") {
    return getLastDateKeys(now, 30);
  }

  return getLastDateKeys(now, 7);
}

function getHourBarChartLines(hourCounts: Record<string, number>) {
  const entries = Object.entries(hourCounts).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxValue = Math.max(...entries.map(([, value]) => value), 0);

  if (!maxValue) {
    return ["No calls recorded in this period yet."];
  }

  return entries.map(([hour, value]) => `${formatHourLabel(hour).padStart(5, " ")} | ${buildBar(value, maxValue)} ${value}`);
}

function buildBar(value: number, maxValue: number) {
  if (!value) {
    return "·";
  }

  const maxBlocks = 12;
  const blocks = Math.max(1, Math.round((value / maxValue) * maxBlocks));

  return "█".repeat(blocks);
}

function createEmptyHourCounts() {
  return Object.fromEntries(Array.from({ length: 24 }, (_, hour) => [String(hour).padStart(2, "0"), 0]));
}

function getRecentCallLines(calls: RecentCall[]) {
  if (!calls.length) {
    return ["No calls recorded yet."];
  }

  return [...calls]
    .sort(compareRecentCallsDescending)
    .slice(0, 6)
    .map((call) => `• ${formatMelbourneTimestamp(call.startedAt)} - ${formatPhoneNumber(call.callerId)}`);
}

function normalizeStats(value: Partial<CallStats> | null): CallStats {
  return {
    byDate: normalizeRecord(value?.byDate),
    byDateHour: normalizeRecord(value?.byDateHour),
    byHour: normalizeRecord(value?.byHour),
    byWeekday: normalizeRecord(value?.byWeekday),
    firstRecordedAt: typeof value?.firstRecordedAt === "string" ? value.firstRecordedAt : new Date().toISOString(),
    recentCalls: Array.isArray(value?.recentCalls) ? value.recentCalls.filter(isRecentCall).sort(compareRecentCallsDescending) : [],
    totalCalls: typeof value?.totalCalls === "number" ? value.totalCalls : 0,
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
  };
}

function normalizeRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]))
      .map(([key, count]) => [key, count])
  );
}

function isRecentCall(value: unknown): value is RecentCall {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const call = value as Partial<RecentCall>;

  return (
    typeof call.callerId === "string" &&
    typeof call.callId === "string" &&
    typeof call.identity === "string" &&
    typeof call.provider === "string" &&
    typeof call.startedAt === "string"
  );
}

function compareRecentCallsDescending(a: RecentCall, b: RecentCall) {
  return parseCallDate(b.startedAt).getTime() - parseCallDate(a.startedAt).getTime();
}

function getStoredDeliveries(value: StatisticsMessageRecord | null) {
  if (!value || !Array.isArray(value.deliveries)) {
    return [];
  }

  return value.deliveries.filter(
    (delivery): delivery is TelegramDelivery => typeof delivery?.chatId === "string" && typeof delivery.messageId === "number"
  );
}

function getCallIdentity(input: CallStatisticInput, eventTime: Date) {
  if (input.callId && input.callId !== "Unknown") {
    return `${input.provider || "Provider"}:${input.callId}`;
  }

  const callerId = input.customerNumber.replace(/\D/g, "") || "unknown";
  const thirtyMinuteBucket = Math.floor(eventTime.getTime() / (30 * 60 * 1000));

  return `${input.provider || "Provider"}:${callerId}:${thirtyMinuteBucket}`;
}

function increment(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1;
}

function getTopEntry(record: Record<string, number>) {
  let winner: { key: string; value: number } | null = null;

  for (const [key, value] of Object.entries(record)) {
    if (!winner || value > winner.value) {
      winner = { key, value };
    }
  }

  return winner;
}

function getLastDateKeys(now: Date, days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);

    return getMelbourneDateParts(date).dateKey;
  });
}

function normalizeCallStatisticsView(value: string | undefined): CallStatisticsView {
  return parseCallStatisticsView(value) ?? defaultStatisticsView;
}

function parseCallStatisticsView(value: string | undefined): CallStatisticsView | null {
  if (value === "today" || value === "7d" || value === "30d" || value === "all") {
    return value;
  }

  return null;
}

function getStatisticsViewLabel(view: CallStatisticsView) {
  const labels: Record<CallStatisticsView, string> = {
    "30d": "30 Days",
    "7d": "7 Days",
    all: "All Time",
    today: "Today"
  };

  return labels[view];
}

function getMelbourneDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: melbourneTimeZone,
    weekday: "long",
    year: "numeric"
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const year = parts.year ?? "0000";
  const month = parts.month ?? "00";
  const day = parts.day ?? "00";
  const hour = parts.hour ?? "00";

  return {
    dateKey: `${year}-${month}-${day}`,
    hour,
    weekday: parts.weekday ?? "Unknown"
  };
}

function parseCallDate(value: string) {
  const numericValue = Number(value);
  const date = Number.isFinite(numericValue)
    ? new Date(numericValue < 10000000000 ? numericValue * 1000 : numericValue)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatMelbourneTimestamp(value: string) {
  const date = parseCallDate(value);

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: melbourneTimeZone
  }).format(date);
}

function formatMelbourneUpdateTimestamp(value: string) {
  const date = parseCallDate(value);

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    timeZone: melbourneTimeZone,
    year: "numeric"
  }).format(date);
}

function formatHourLabel(value: string) {
  const hour = Number(value);

  if (!Number.isFinite(hour)) {
    return value;
  }

  if (hour === 0) {
    return "12 AM";
  }

  if (hour < 12) {
    return `${hour} AM`;
  }

  if (hour === 12) {
    return "12 PM";
  }

  return `${hour - 12} PM`;
}

function formatPhoneNumber(value: string) {
  const text = value.trim();
  const digits = text.replace(/\D/g, "");

  if (!digits || text === "Unknown / private") {
    return text || "Unknown / private";
  }

  if (digits.startsWith("04") && digits.length === 10) {
    return `+61${digits.slice(1)}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `+61${digits.slice(1)}`;
  }

  if (digits.startsWith("61") && digits.length === 11) {
    return `+${digits}`;
  }

  if (text.startsWith("+")) {
    return `+${digits}`;
  }

  return text;
}

function plural(value: number) {
  return value === 1 ? "" : "s";
}

function getStatisticsChatIds() {
  const configuredChatIds = process.env.TELEGRAM_STATISTICS_CHAT_ID ?? process.env.TELEGRAM_GROUP_ID ?? "";
  const fallbackChatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);

  if (configuredChatIds) {
    return configuredChatIds
      .split(",")
      .map((chatId) => chatId.trim())
      .filter(Boolean);
  }

  return fallbackChatIds.filter((chatId) => chatId.startsWith("-"));
}
