import {
  callActionStatuses,
  getCallActionDashboardActions,
  getCallActionDestination,
  getCallActionDestinationLabel,
  getCallActionDestinationTopicId,
  parseCallActionStatus,
  type CallActionDestination,
  type CallActionStatus
} from "@/lib/call-actions";
import { getStoredJson, setStoredJson } from "@/lib/call-alert-store";
import { editTelegramMessage, sendTelegramMessage, type TelegramDelivery } from "@/lib/telegram";

type CallActionDashboardState = {
  counts: Partial<Record<CallActionStatus, number>>;
  messages: Partial<Record<CallActionDestination, DashboardMessageRecord>>;
  updatedAt: string;
};

type DashboardMessageRecord = {
  chatId: string;
  deliveries: TelegramDelivery[];
  text: string;
  topicId: number;
  updatedAt: string;
};

const dashboardKind = "action-dashboard";
const dashboardKey = "summary";
const dashboardStoreTtlMs = 366 * 24 * 60 * 60 * 1000;
const melbourneTimeZone = "Australia/Melbourne";

export async function recordCallActionForDashboard(options: {
  action: CallActionStatus;
  chatId: string;
  previousAction?: string;
}) {
  const previousAction = parseCallActionStatus(options.previousAction);
  const state = normalizeDashboardState(
    await getStoredJson<Partial<CallActionDashboardState>>(dashboardKind, dashboardKey, dashboardStoreTtlMs)
  );
  const changedDestinations = new Set<CallActionDestination>([getCallActionDestination(options.action)]);

  if (previousAction && previousAction !== options.action) {
    state.counts[previousAction] = Math.max(0, (state.counts[previousAction] ?? 0) - 1);
    changedDestinations.add(getCallActionDestination(previousAction));
  }

  if (previousAction !== options.action) {
    state.counts[options.action] = (state.counts[options.action] ?? 0) + 1;
  }

  state.updatedAt = new Date().toISOString();

  for (const destination of changedDestinations) {
    await refreshDashboardMessage(state, destination, options.chatId);
  }

  await setStoredJson(dashboardKind, dashboardKey, state, dashboardStoreTtlMs);
}

async function refreshDashboardMessage(
  state: CallActionDashboardState,
  destination: CallActionDestination,
  chatId: string
) {
  const topicId = getCallActionDestinationTopicId(destination);

  if (typeof topicId !== "number") {
    return;
  }

  const text = formatDashboardMessage(state, destination);
  const existingMessage = state.messages[destination];
  const existingDeliveries =
    existingMessage?.chatId === chatId && existingMessage.topicId === topicId ? existingMessage.deliveries : [];

  if (existingDeliveries.length) {
    const editResult = await editTelegramMessage(text, existingDeliveries);

    if (editResult.ok) {
      state.messages[destination] = {
        chatId,
        deliveries: existingDeliveries,
        text,
        topicId,
        updatedAt: state.updatedAt
      };
      return;
    }

    console.error("Telegram call action dashboard edit failed", editResult.error);
  }

  const sendResult = await sendTelegramMessage(text, [chatId], {
    messageThreadId: topicId
  });

  if (!sendResult.ok) {
    console.error("Telegram call action dashboard send failed", sendResult.error);
    return;
  }

  if (sendResult.deliveries?.length) {
    state.messages[destination] = {
      chatId,
      deliveries: sendResult.deliveries,
      text,
      topicId,
      updatedAt: state.updatedAt
    };
  }
}

function formatDashboardMessage(state: CallActionDashboardState, destination: CallActionDestination) {
  const actions = getCallActionDashboardActions(destination);
  const total = actions.reduce((sum, action) => sum + (state.counts[action] ?? 0), 0);

  return [
    formatDashboardTitle(destination),
    "",
    `Folder: ${getCallActionDestinationLabel(actions[0])}`,
    `Items: ${total}`,
    "",
    ...actions.map((action) => {
      const status = callActionStatuses[action];
      return `${status.emoji} ${status.label}: ${state.counts[action] ?? 0}`;
    }),
    "",
    `Last updated: ${formatMelbourneTimestamp(state.updatedAt)}`
  ].join("\n");
}

function formatDashboardTitle(destination: CallActionDestination) {
  const labels: Record<CallActionDestination, string> = {
    booked: "BOOKED DASHBOARD",
    closed: "CLOSED DASHBOARD",
    follow_up: "FOLLOW UP DASHBOARD"
  };

  return labels[destination];
}

function normalizeDashboardState(value: Partial<CallActionDashboardState> | null): CallActionDashboardState {
  return {
    counts: normalizeCounts(value?.counts),
    messages: normalizeMessages(value?.messages),
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
  };
}

function normalizeCounts(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, count]) => {
      const action = parseCallActionStatus(key);

      if (!action || typeof count !== "number" || !Number.isFinite(count)) {
        return [];
      }

      return [[action, Math.max(0, Math.floor(count))]];
    })
  ) as Partial<Record<CallActionStatus, number>>;
}

function normalizeMessages(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const messages: Partial<Record<CallActionDestination, DashboardMessageRecord>> = {};

  for (const destination of ["booked", "follow_up", "closed"] as const) {
    const record = (value as Record<string, unknown>)[destination];

    if (isDashboardMessageRecord(record)) {
      messages[destination] = record;
    }
  }

  return messages;
}

function isDashboardMessageRecord(value: unknown): value is DashboardMessageRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Partial<DashboardMessageRecord>;

  return (
    typeof record.chatId === "string" &&
    typeof record.topicId === "number" &&
    typeof record.text === "string" &&
    typeof record.updatedAt === "string" &&
    Array.isArray(record.deliveries) &&
    record.deliveries.every(
      (delivery) =>
        delivery &&
        typeof delivery === "object" &&
        typeof (delivery as TelegramDelivery).chatId === "string" &&
        typeof (delivery as TelegramDelivery).messageId === "number"
    )
  );
}

function formatMelbourneTimestamp(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: melbourneTimeZone
  }).format(Number.isNaN(date.getTime()) ? new Date() : date);
}
