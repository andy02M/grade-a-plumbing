import type { TelegramInlineKeyboardMarkup } from "@/lib/telegram";

export const callActionStatuses = {
  booked: {
    callbackLabel: "Booked",
    emoji: "✅",
    label: "Booked",
    topicEnvNames: ["TELEGRAM_TOPIC_BOOKED", "TELEGRAM_BOOKED_THREAD_ID"]
  },
  call_back: {
    callbackLabel: "Call Back",
    emoji: "📞",
    label: "Call Back",
    topicEnvNames: ["TELEGRAM_TOPIC_FOLLOW_UP", "TELEGRAM_FOLLOW_UP_THREAD_ID", "TELEGRAM_TOPIC_CALL_BACK", "TELEGRAM_CALL_BACK_THREAD_ID"]
  },
  no_answer: {
    callbackLabel: "No Answer",
    emoji: "📵",
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
  quote_sent: {
    callbackLabel: "Quote Sent",
    emoji: "💰",
    label: "Quote Sent",
    topicEnvNames: ["TELEGRAM_TOPIC_FOLLOW_UP", "TELEGRAM_FOLLOW_UP_THREAD_ID", "TELEGRAM_TOPIC_QUOTE_SENT", "TELEGRAM_QUOTE_SENT_THREAD_ID"]
  },
  waiting_photos: {
    callbackLabel: "Waiting Photos",
    emoji: "📸",
    label: "Waiting Photos",
    topicEnvNames: ["TELEGRAM_TOPIC_FOLLOW_UP", "TELEGRAM_FOLLOW_UP_THREAD_ID", "TELEGRAM_TOPIC_WAITING_PHOTOS", "TELEGRAM_WAITING_PHOTOS_THREAD_ID"]
  },
  later_not_urgent: {
    callbackLabel: "Later / Not Urgent",
    emoji: "⏰",
    label: "Later / Not Urgent",
    topicEnvNames: ["TELEGRAM_TOPIC_FOLLOW_UP", "TELEGRAM_FOLLOW_UP_THREAD_ID", "TELEGRAM_TOPIC_LATER", "TELEGRAM_LATER_THREAD_ID"]
  },
  needs_parts: {
    callbackLabel: "Needs Parts",
    emoji: "🛠",
    label: "Needs Parts",
    topicEnvNames: ["TELEGRAM_TOPIC_FOLLOW_UP", "TELEGRAM_FOLLOW_UP_THREAD_ID", "TELEGRAM_TOPIC_NEEDS_PARTS", "TELEGRAM_NEEDS_PARTS_THREAD_ID"]
  },
  reschedule: {
    callbackLabel: "Reschedule",
    emoji: "📅",
    label: "Reschedule",
    topicEnvNames: ["TELEGRAM_TOPIC_FOLLOW_UP", "TELEGRAM_FOLLOW_UP_THREAD_ID", "TELEGRAM_TOPIC_RESCHEDULE", "TELEGRAM_RESCHEDULE_THREAD_ID"]
  },
  urgent_job: {
    callbackLabel: "Urgent Job",
    emoji: "🚨",
    label: "Urgent Job",
    topicEnvNames: ["TELEGRAM_TOPIC_FOLLOW_UP", "TELEGRAM_FOLLOW_UP_THREAD_ID", "TELEGRAM_TOPIC_URGENT_JOB", "TELEGRAM_URGENT_JOB_THREAD_ID"]
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
  },
  spam: {
    callbackLabel: "Spam",
    emoji: "🗑",
    label: "Spam",
    topicEnvNames: ["TELEGRAM_TOPIC_CLOSED", "TELEGRAM_CLOSED_THREAD_ID", "TELEGRAM_TOPIC_SPAM", "TELEGRAM_SPAM_THREAD_ID"]
  },
  out_of_area: {
    callbackLabel: "Out of Area",
    emoji: "📍",
    label: "Out of Area",
    topicEnvNames: ["TELEGRAM_TOPIC_CLOSED", "TELEGRAM_CLOSED_THREAD_ID", "TELEGRAM_TOPIC_OUT_OF_AREA", "TELEGRAM_OUT_OF_AREA_THREAD_ID"]
  },
  duplicate: {
    callbackLabel: "Duplicate",
    emoji: "🔁",
    label: "Duplicate",
    topicEnvNames: ["TELEGRAM_TOPIC_CLOSED", "TELEGRAM_CLOSED_THREAD_ID", "TELEGRAM_TOPIC_DUPLICATE", "TELEGRAM_DUPLICATE_THREAD_ID"]
  },
  auto_closed: {
    callbackLabel: "Auto Closed",
    emoji: "AUTO",
    label: "Auto Closed",
    topicEnvNames: ["TELEGRAM_TOPIC_CLOSED", "TELEGRAM_CLOSED_THREAD_ID", "TELEGRAM_TOPIC_AUTO_CLOSED", "TELEGRAM_AUTO_CLOSED_THREAD_ID"]
  }
} as const;

export type CallActionStatus = keyof typeof callActionStatuses;
export type CallActionMenu = "main" | "follow_up" | "closed";
export type CallActionDestination = "booked" | "follow_up" | "closed";

const defaultTopicIds = {
  booked: 4,
  call_back: 6,
  closed: 8,
  duplicate: 8,
  follow_up: 6,
  later_not_urgent: 6,
  needs_parts: 6,
  new_calls: 2,
  no_answer: 6,
  not_interested: 8,
  out_of_area: 8,
  quote_needed: 6,
  quote_sent: 6,
  reschedule: 6,
  spam: 8,
  statistics: 16,
  texted_customer: 6,
  urgent_job: 6,
  waiting_photos: 6,
  wrong_number: 8,
  auto_closed: 8
} as const;

export function buildCallActionKeyboard(actionKey: string): TelegramInlineKeyboardMarkup {
  return buildCallActionMainKeyboard(actionKey);
}

export function buildCallActionMainKeyboard(actionKey: string): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [buildActionButton("booked", actionKey)],
      [
        buildMenuButton("follow_up", actionKey),
        buildMenuButton("closed", actionKey)
      ]
    ]
  };
}

export function buildCallActionSubmenuKeyboard(menu: Exclude<CallActionMenu, "main">, actionKey: string): TelegramInlineKeyboardMarkup {
  if (menu === "closed") {
    return {
      inline_keyboard: [
        [
          buildActionButton("not_interested", actionKey),
          buildActionButton("wrong_number", actionKey)
        ],
        [
          buildActionButton("spam", actionKey),
          buildActionButton("out_of_area", actionKey)
        ],
        [
          buildActionButton("duplicate", actionKey),
          buildMenuButton("main", actionKey)
        ]
      ]
    };
  }

  return {
    inline_keyboard: [
      [
        buildActionButton("call_back", actionKey),
        buildActionButton("no_answer", actionKey)
      ],
      [
        buildActionButton("texted_customer", actionKey),
        buildActionButton("quote_needed", actionKey)
      ],
      [
        buildActionButton("quote_sent", actionKey),
        buildActionButton("waiting_photos", actionKey)
      ],
      [
        buildActionButton("later_not_urgent", actionKey),
        buildActionButton("needs_parts", actionKey)
      ],
      [
        buildActionButton("reschedule", actionKey),
        buildActionButton("urgent_job", actionKey)
      ],
      [buildMenuButton("main", actionKey)]
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

export function parseCallActionMenuData(value: string | undefined) {
  const parts = (value ?? "").split(":");

  if (parts.length !== 3 || parts[0] !== "gapmenu") {
    return null;
  }

  const menu = parseCallActionMenu(parts[1]);
  const actionKey = parts[2]?.trim();

  if (!menu || !actionKey) {
    return null;
  }

  return {
    actionKey,
    menu
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
  const destination = getCallActionDestination(action);

  if (destination === "booked") {
    return "02 Booked";
  }

  if (destination === "closed") {
    return "04 Closed / Not Suitable";
  }

  return "03 Follow Up Required";
}

export function getCallActionDestination(action: CallActionStatus): CallActionDestination {
  if (action === "booked") {
    return "booked";
  }

  if (["auto_closed", "duplicate", "not_interested", "out_of_area", "spam", "wrong_number"].includes(action)) {
    return "closed";
  }

  return "follow_up";
}

export function getCallActionDashboardActions(destination: CallActionDestination) {
  const actions: Record<CallActionDestination, CallActionStatus[]> = {
    booked: ["booked"],
    closed: ["not_interested", "wrong_number", "spam", "out_of_area", "duplicate", "auto_closed"],
    follow_up: [
      "call_back",
      "no_answer",
      "texted_customer",
      "quote_needed",
      "quote_sent",
      "waiting_photos",
      "later_not_urgent",
      "needs_parts",
      "reschedule",
      "urgent_job"
    ]
  };

  return actions[destination];
}

export function getCallActionDestinationTopicId(destination: CallActionDestination) {
  const representativeActions: Record<CallActionDestination, CallActionStatus> = {
    booked: "booked",
    closed: "not_interested",
    follow_up: "call_back"
  };

  return getCallActionTopicId(representativeActions[destination]);
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
    call_back: getCallActionTopicId("call_back"),
    closed: defaultTopicIds.closed,
    duplicate: getCallActionTopicId("duplicate"),
    follow_up: defaultTopicIds.follow_up,
    later_not_urgent: getCallActionTopicId("later_not_urgent"),
    needs_parts: getCallActionTopicId("needs_parts"),
    new_calls: getNewCallsTopicId(),
    no_answer: getCallActionTopicId("no_answer"),
    not_interested: getCallActionTopicId("not_interested"),
    out_of_area: getCallActionTopicId("out_of_area"),
    quote_needed: getCallActionTopicId("quote_needed"),
    quote_sent: getCallActionTopicId("quote_sent"),
    reschedule: getCallActionTopicId("reschedule"),
    spam: getCallActionTopicId("spam"),
    statistics: getStatisticsTopicId(),
    texted_customer: getCallActionTopicId("texted_customer"),
    urgent_job: getCallActionTopicId("urgent_job"),
    waiting_photos: getCallActionTopicId("waiting_photos"),
    wrong_number: getCallActionTopicId("wrong_number"),
    auto_closed: getCallActionTopicId("auto_closed")
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

function buildMenuButton(menu: CallActionMenu, actionKey: string) {
  const labels: Record<CallActionMenu, string> = {
    closed: "❌ Closed",
    follow_up: "📌 Follow Up",
    main: "⬅️ Back"
  };

  return {
    callback_data: `gapmenu:${menu}:${actionKey}`,
    text: labels[menu]
  };
}

function parseCallActionMenu(value: string | undefined): CallActionMenu | null {
  if (value === "main" || value === "follow_up" || value === "closed") {
    return value;
  }

  return null;
}

function parseTopicId(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const topicId = Number(value);

  return Number.isInteger(topicId) ? topicId : undefined;
}
