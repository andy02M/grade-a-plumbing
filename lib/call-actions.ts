import type { TelegramInlineKeyboardMarkup } from "@/lib/telegram";

export const callActionStatuses = {
  booked: {
    callbackLabel: "Booked",
    emoji: "✅",
    label: "Booked",
    topicEnvNames: ["TELEGRAM_TOPIC_BOOKED", "TELEGRAM_BOOKED_THREAD_ID"]
  },
  no_answer: {
    callbackLabel: "No Answer",
    emoji: "📞",
    label: "No Answer",
    topicEnvNames: ["TELEGRAM_TOPIC_FOLLOW_UP", "TELEGRAM_FOLLOW_UP_THREAD_ID", "TELEGRAM_TOPIC_NO_ANSWER", "TELEGRAM_NO_ANSWER_THREAD_ID"]
  },
  texted_customer: {
    callbackLabel: "Texted",
    emoji: "💬",
    label: "Texted Customer",
    topicEnvNames: [
      "TELEGRAM_TOPIC_FOLLOW_UP",
      "TELEGRAM_FOLLOW_UP_THREAD_ID",
      "TELEGRAM_TOPIC_TEXTED_CUSTOMER",
      "TELEGRAM_TEXTED_CUSTOMER_THREAD_ID"
    ]
  },
  quote_needed: {
    callbackLabel: "Quote Needed",
    emoji: "🧾",
    label: "Quote Needed",
    topicEnvNames: ["TELEGRAM_TOPIC_FOLLOW_UP", "TELEGRAM_FOLLOW_UP_THREAD_ID", "TELEGRAM_TOPIC_QUOTE_NEEDED", "TELEGRAM_QUOTE_NEEDED_THREAD_ID"]
  },
  not_interested: {
    callbackLabel: "Not Interested",
    emoji: "❌",
    label: "Not Interested",
    topicEnvNames: [
      "TELEGRAM_TOPIC_CLOSED",
      "TELEGRAM_CLOSED_THREAD_ID",
      "TELEGRAM_TOPIC_NOT_INTERESTED",
      "TELEGRAM_NOT_INTERESTED_THREAD_ID"
    ]
  },
  wrong_number: {
    callbackLabel: "Wrong Number",
    emoji: "🚫",
    label: "Wrong Number",
    topicEnvNames: ["TELEGRAM_TOPIC_CLOSED", "TELEGRAM_CLOSED_THREAD_ID", "TELEGRAM_TOPIC_WRONG_NUMBER", "TELEGRAM_WRONG_NUMBER_THREAD_ID"]
  }
} as const;

export type CallActionStatus = keyof typeof callActionStatuses;

const defaultTopicIds = {
  booked: 4,
  closed: 8,
  follow_up: 6,
  new_calls: 2,
  no_answer: 6,
  not_interested: 8,
  quote_needed: 6,
  statistics: 16,
  texted_customer: 6,
  wrong_number: 8
} as const;

export function buildCallActionKeyboard(actionKey: string): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        buildActionButton("booked", actionKey),
        buildActionButton("no_answer", actionKey)
      ],
      [
        buildActionButton("texted_customer", actionKey),
        buildActionButton("quote_needed", actionKey)
      ],
      [
        buildActionButton("not_interested", actionKey),
        buildActionButton("wrong_number", actionKey)
      ]
    ]
  };
}

export function parseCallActionData(value: string | undefined) {
  const parts = (value ?? "").split(":");

  if (parts.length !== 3 || parts[0] !== "gap") {
    return null;
  }

  const action = parseCallActionStatus(parts[1]);
  const actionKey = parts[2]?.trim();

  if (!action || !actionKey) {
    return null;
  }

  return {
    action,
    actionKey
  };
}

export function parseCallActionStatus(value: string | undefined): CallActionStatus | null {
  if (!value) {
    return null;
  }

  return value in callActionStatuses ? (value as CallActionStatus) : null;
}

export function getCallActionLabel(action: CallActionStatus) {
  const status = callActionStatuses[action];

  return `${status.emoji} ${status.label}`;
}

export function getCallActionDestinationLabel(action: CallActionStatus) {
  if (action === "booked") {
    return "02 Booked";
  }

  if (action === "not_interested" || action === "wrong_number") {
    return "04 Closed / Not Suitable";
  }

  return "03 Follow Up Required";
}

export function getCallActionTopicId(action: CallActionStatus) {
  const status = callActionStatuses[action];

  for (const envName of status.topicEnvNames) {
    const topicId = parseTopicId(process.env[envName]);

    if (typeof topicId === "number") {
      return topicId;
    }
  }

  return defaultTopicIds[action];
}

export function getNewCallsTopicId() {
  return parseTopicId(process.env.TELEGRAM_TOPIC_NEW_CALLS ?? process.env.TELEGRAM_NEW_CALLS_THREAD_ID) ?? defaultTopicIds.new_calls;
}

export function getStatisticsTopicId() {
  return parseTopicId(process.env.TELEGRAM_TOPIC_STATISTICS ?? process.env.TELEGRAM_STATISTICS_THREAD_ID) ?? defaultTopicIds.statistics;
}

export function getConfiguredCallActionTopics() {
  return Object.fromEntries(
    Object.entries(callActionStatuses).map(([action, status]) => [
      action,
      Boolean(getCallActionTopicId(action as CallActionStatus)) ||
        status.topicEnvNames.some((envName) => Boolean(process.env[envName]))
    ])
  );
}

export function getCallTopicDiagnostics() {
  return {
    booked: getCallActionTopicId("booked"),
    closed: defaultTopicIds.closed,
    follow_up: defaultTopicIds.follow_up,
    new_calls: getNewCallsTopicId(),
    no_answer: getCallActionTopicId("no_answer"),
    not_interested: getCallActionTopicId("not_interested"),
    quote_needed: getCallActionTopicId("quote_needed"),
    statistics: getStatisticsTopicId(),
    texted_customer: getCallActionTopicId("texted_customer"),
    wrong_number: getCallActionTopicId("wrong_number")
  };
}

export function shouldDeleteHandledCallAlert() {
  return process.env.TELEGRAM_DELETE_HANDLED_CALL_ALERTS?.toLowerCase() !== "false";
}

export function getCallActionStoreKey(actionKey: string) {
  return `action:${actionKey}`;
}

function buildActionButton(action: CallActionStatus, actionKey: string) {
  const status = callActionStatuses[action];

  return {
    callback_data: `gap:${action}:${actionKey}`,
    text: `${status.emoji} ${status.callbackLabel}`
  };
}

function parseTopicId(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const topicId = Number(value);

  return Number.isInteger(topicId) ? topicId : undefined;
}
