import {
  buildCallActionKeyboard,
  getCallActionStoreKey,
  parseCallActionStatus,
  type CallActionStatus
} from "@/lib/call-actions";
import { getStoredJson, setStoredJson } from "@/lib/call-alert-store";
import type { TelegramInlineKeyboardMarkup } from "@/lib/telegram";

export type FillableCallField = "address_suburb" | "issue" | "name" | "phone" | "urgency";

export type PendingCallFill = {
  actionKey: string;
  chatId: string;
  field: FillableCallField;
  messageThreadId?: number;
  promptMessageId?: number;
  userId: string;
};

const pendingKind = "fill-details";
const pendingTtlMs = 2 * 60 * 60 * 1000;
const manualDetailsStart = "TEAM FILLED DETAILS";
const manualDetailsEnd = "END TEAM FILLED DETAILS";
const alertDivider = "====================================";

const fillableFieldConfig: Record<FillableCallField, { label: string; missingMatchers: RegExp[]; placeholder: string }> = {
  address_suburb: {
    label: "Address / suburb",
    missingMatchers: [/address\s*\/\s*suburb/i],
    placeholder: "e.g. 12 Smith St, Richmond"
  },
  issue: {
    label: "Plumbing issue",
    missingMatchers: [/plumbing issue/i, /^issue$/i],
    placeholder: "e.g. blocked kitchen sink"
  },
  name: {
    label: "Name",
    missingMatchers: [/^name$/i, /customer name/i],
    placeholder: "e.g. Sarah"
  },
  phone: {
    label: "Best contact",
    missingMatchers: [/^phone$/i, /best contact/i, /contact number/i],
    placeholder: "e.g. 0412 345 678"
  },
  urgency: {
    label: "Urgency",
    missingMatchers: [/urgency/i],
    placeholder: "e.g. today, urgent, this week"
  }
};

export function getMissingFillableFields(text: string) {
  const lines = text.split(/\r?\n/);
  const missingSectionLines: string[] = [];
  let inMissingSection = false;

  for (const line of lines) {
    if (line.toUpperCase().includes("STILL NEEDED")) {
      inMissingSection = true;
      continue;
    }

    if (inMissingSection && line.trim() === "") {
      break;
    }

    if (inMissingSection) {
      missingSectionLines.push(line);
    }
  }

  return (Object.keys(fillableFieldConfig) as FillableCallField[]).filter((field) => {
    const config = fillableFieldConfig[field];

    return missingSectionLines.some((line) => config.missingMatchers.some((matcher) => matcher.test(cleanLine(line))));
  });
}

export function buildMissingDetailsKeyboard(actionKey: string, missingFields: FillableCallField[]): TelegramInlineKeyboardMarkup {
  const fillRows = missingFields.map((field) => [
    {
      callback_data: `gapfill:${field}:${actionKey}`,
      text: `Fill ${fillableFieldConfig[field].label}`
    }
  ]);

  return {
    inline_keyboard: [
      ...fillRows,
      ...buildCallActionKeyboard(actionKey).inline_keyboard
    ]
  };
}

export function parseFillDetailsActionData(value: string | undefined) {
  const parts = (value ?? "").split(":");

  if (parts.length !== 3 || parts[0] !== "gapfill") {
    return null;
  }

  const field = parseFillableCallField(parts[1]);
  const actionKey = parts[2]?.trim();

  if (!field || !actionKey) {
    return null;
  }

  return {
    actionKey,
    field
  };
}

export function getFillableFieldLabel(field: FillableCallField) {
  return fillableFieldConfig[field].label;
}

export function getFillableFieldPlaceholder(field: FillableCallField) {
  return fillableFieldConfig[field].placeholder;
}

export async function rememberPendingCallFill(fill: PendingCallFill) {
  await setStoredJson(pendingKind, getPendingFillKey(fill.chatId, fill.userId), fill, pendingTtlMs);
}

export async function getPendingCallFill(chatId: string, userId: string) {
  const fill = await getStoredJson<PendingCallFill>(pendingKind, getPendingFillKey(chatId, userId), pendingTtlMs);

  return isPendingCallFill(fill) ? fill : null;
}

export async function clearPendingCallFill(chatId: string, userId: string) {
  await setStoredJson(pendingKind, getPendingFillKey(chatId, userId), null, 1);
}

export function applyFilledCallDetail(text: string, field: FillableCallField, value: string) {
  const parts = splitActionBlock(text);
  const baseWithDetail = upsertManualDetails(removeMissingFieldLine(parts.base, field), field, value);

  return [baseWithDetail, parts.actionBlock].filter(Boolean).join("\n\n");
}

export function getActionStatusFromText(text: string): CallActionStatus | undefined {
  const outcomeLine = text.split(/\r?\n/).find((line) => line.toUpperCase().includes("OUTCOME:"));

  if (!outcomeLine) {
    return undefined;
  }

  const normalizedLine = cleanLine(outcomeLine).toLowerCase();

  for (const status of ["booked", "call_back", "no_answer", "texted_customer", "quote_needed", "quote_sent", "waiting_photos", "later_not_urgent", "needs_parts", "reschedule", "urgent_job", "not_interested", "wrong_number", "spam", "out_of_area", "duplicate", "auto_closed"]) {
    const parsedStatus = parseCallActionStatus(status);

    if (parsedStatus && normalizedLine.includes(status.replace(/_/g, " "))) {
      return parsedStatus;
    }
  }

  return undefined;
}

export function getFillActionStoreKey(actionKey: string) {
  return getCallActionStoreKey(actionKey);
}

function parseFillableCallField(value: string | undefined): FillableCallField | null {
  return value && value in fillableFieldConfig ? (value as FillableCallField) : null;
}

function getPendingFillKey(chatId: string, userId: string) {
  return `${chatId}:${userId}`;
}

function isPendingCallFill(value: unknown): value is PendingCallFill {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const fill = value as PendingCallFill;

  return (
    typeof fill.actionKey === "string" &&
    typeof fill.chatId === "string" &&
    typeof fill.userId === "string" &&
    Boolean(parseFillableCallField(fill.field))
  );
}

function splitActionBlock(text: string) {
  const markers = ["\n\nðŸ“Œ CALL ACTION", "\n\nCALL ACTION"];
  const markerIndex = markers
    .map((marker) => text.indexOf(marker))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (typeof markerIndex !== "number") {
    return {
      actionBlock: "",
      base: text.trimEnd()
    };
  }

  return {
    actionBlock: text.slice(markerIndex).trim(),
    base: text.slice(0, markerIndex).trimEnd()
  };
}

function upsertManualDetails(text: string, field: FillableCallField, value: string) {
  const details = getManualDetails(text);
  details.set(fillableFieldConfig[field].label, value.trim());

  return [removeManualDetailsBlock(text), formatManualDetails(details)].filter(Boolean).join("\n\n");
}

function getManualDetails(text: string) {
  const details = new Map<string, string>();
  const startIndex = text.indexOf(manualDetailsStart);
  const endIndex = text.indexOf(manualDetailsEnd);

  if (startIndex < 0 || endIndex < startIndex) {
    return details;
  }

  for (const line of text.slice(startIndex, endIndex).split(/\r?\n/)) {
    const [label, ...rest] = line.split(":");

    if (rest.length && label.trim() && !label.includes(manualDetailsStart)) {
      details.set(label.trim(), rest.join(":").trim());
    }
  }

  return details;
}

function removeManualDetailsBlock(text: string) {
  const startIndex = text.indexOf(manualDetailsStart);
  const endIndex = text.indexOf(manualDetailsEnd);

  if (startIndex < 0 || endIndex < startIndex) {
    return text.trimEnd();
  }

  return `${text.slice(0, startIndex).trimEnd()}\n${text.slice(endIndex + manualDetailsEnd.length).trimStart()}`.trim();
}

function formatManualDetails(details: Map<string, string>) {
  return [
    manualDetailsStart,
    alertDivider,
    ...Array.from(details.entries()).map(([label, value]) => `${label}: ${value}`),
    alertDivider,
    manualDetailsEnd
  ].join("\n");
}

function removeMissingFieldLine(text: string, field: FillableCallField) {
  const lines = text.split(/\r?\n/);
  const filteredLines = lines.filter((line) => {
    const cleanedLine = cleanLine(line);

    return !fillableFieldConfig[field].missingMatchers.some((matcher) => matcher.test(cleanedLine));
  });

  return removeEmptyStillNeededSection(filteredLines).join("\n").trimEnd();
}

function removeEmptyStillNeededSection(lines: string[]) {
  const stillNeededIndex = lines.findIndex((line) => line.toUpperCase().includes("STILL NEEDED"));

  if (stillNeededIndex < 0) {
    return lines;
  }

  const nextBlankIndex = lines.findIndex((line, index) => index > stillNeededIndex && line.trim() === "");
  const endIndex = nextBlankIndex >= 0 ? nextBlankIndex : lines.length;
  const hasRemainingMissingLines = lines
    .slice(stillNeededIndex + 1, endIndex)
    .some((line) =>
      Object.values(fillableFieldConfig).some((config) =>
        config.missingMatchers.some((matcher) => matcher.test(cleanLine(line)))
      )
    );

  if (hasRemainingMissingLines) {
    return lines;
  }

  return [
    ...lines.slice(0, stillNeededIndex),
    "DETAILS COMPLETED BY TEAM",
    ...lines.slice(endIndex)
  ];
}

function cleanLine(line: string) {
  return line
    .replace(/[^\p{L}\p{N}/: ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
