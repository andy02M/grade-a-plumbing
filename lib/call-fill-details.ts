import {
  buildCallActionKeyboard,
  getCallActionStoreKey,
  parseCallActionStatus,
  type CallActionStatus
} from "@/lib/call-actions";
import { getStoredJson, setStoredJson } from "@/lib/call-alert-store";
import type { TelegramInlineKeyboardMarkup } from "@/lib/telegram";

export type FillableCallField =
  | "address_suburb"
  | "attending_plumber"
  | "booked_time"
  | "call_out_fee"
  | "issue"
  | "name";

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
const pendingBookedMarker = "BOOKING DETAILS REQUIRED";
const requiredBookedFields: FillableCallField[] = [
  "name",
  "issue",
  "address_suburb",
  "booked_time",
  "attending_plumber",
  "call_out_fee"
];

const fillableFieldConfig: Record<FillableCallField, { label: string; missingMatchers: RegExp[]; placeholder: string }> = {
  address_suburb: {
    label: "Address / suburb",
    missingMatchers: [/address\s*\/\s*suburb/i],
    placeholder: "e.g. 12 Smith St, Richmond"
  },
  attending_plumber: {
    label: "Attending Plumber",
    missingMatchers: [/attending plumber/i],
    placeholder: "e.g. Andy"
  },
  booked_time: {
    label: "Booked Time",
    missingMatchers: [/booked time/i, /appointment time/i],
    placeholder: "e.g. Tomorrow 9am"
  },
  call_out_fee: {
    label: "Call-out fee",
    missingMatchers: [/call-?out fee/i],
    placeholder: "e.g. $0, $99, quoted"
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
  }
};

export function getMissingFillableFields(text: string) {
  const manualDetails = getManualDetails(text);

  return requiredBookedFields.filter((field) => {
    const config = fillableFieldConfig[field];

    return !manualDetails.has(config.label);
  });
}

export function buildBookedDetailsKeyboard(actionKey: string, text: string): TelegramInlineKeyboardMarkup {
  const missingFields = new Set(getMissingFillableFields(text));
  const fillRows = requiredBookedFields.map((field) => [
    {
      callback_data: `gapfill:${field}:${actionKey}`,
      text: `${missingFields.has(field) ? "Fill" : "Edit"} ${fillableFieldConfig[field].label}`
    }
  ]);

  return {
    inline_keyboard: [
      ...fillRows,
      ...buildCallActionKeyboard(actionKey).inline_keyboard
    ]
  };
}

export function applyAutofilledBookedDetails(text: string) {
  const existingManualDetails = getManualDetails(text);
  const extractedDetails = extractDetailsFromAlert(text);
  const detailsToAdd = new Map<string, string>();

  for (const field of requiredBookedFields) {
    const label = fillableFieldConfig[field].label;
    const value = extractedDetails.get(field);

    if (value && !existingManualDetails.has(label)) {
      detailsToAdd.set(label, value);
    }
  }

  if (!detailsToAdd.size) {
    return text;
  }

  return [removeManualDetailsBlock(text), formatManualDetails(new Map([...existingManualDetails, ...detailsToAdd]))]
    .filter(Boolean)
    .join("\n\n");
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

export function formatCompletedBookedText(text: string) {
  return [
    removePendingBookedBlock(text),
    "",
    "CALL ACTION",
    alertDivider,
    "OUTCOME: BOOKED",
    "MOVED TO: 02 Booked",
    "UPDATED BY: Booking details completed",
    `UPDATED: ${formatTimestamp(new Date().toISOString())}`,
    alertDivider
  ]
    .filter(Boolean)
    .join("\n");
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
  return userId || chatId;
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

function removePendingBookedBlock(text: string) {
  const markerIndex = text.indexOf(pendingBookedMarker);

  if (markerIndex < 0) {
    return text.trimEnd();
  }

  const blockStart = text.lastIndexOf("\n\n", markerIndex);
  const startIndex = blockStart >= 0 ? blockStart : markerIndex;

  return text.slice(0, startIndex).trimEnd();
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

function extractDetailsFromAlert(text: string) {
  const details = new Map<FillableCallField, string>();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const labelAndValue = parseLabelAndValue(line);

    if (!labelAndValue) {
      continue;
    }

    const [label, value] = labelAndValue;

    if (!value || /^not provided$/i.test(value)) {
      continue;
    }

    if (/\bcustomer\b|\bname\b/i.test(label)) {
      details.set("name", value);
    } else if (/\bissue\b|\bservice\b/i.test(label)) {
      details.set("issue", value);
    } else if (/\blocation\b|\baddress\b|\bsuburb\b/i.test(label)) {
      details.set("address_suburb", value);
    } else if (/\bpreferred\b|\bbooked time\b|\bappointment time\b/i.test(label)) {
      details.set("booked_time", value);
    } else if (/\bplumber\b|\btechnician\b/i.test(label)) {
      details.set("attending_plumber", value);
    } else if (/\bcall-?out fee\b|\bfee\b/i.test(label)) {
      details.set("call_out_fee", value);
    }
  }

  return details;
}

function parseLabelAndValue(line: string): [string, string] | null {
  const cleanedLine = cleanLine(line);
  const separatorIndex = cleanedLine.indexOf(":");

  if (separatorIndex < 0) {
    return null;
  }

  const label = cleanedLine.slice(0, separatorIndex).trim();
  const value = cleanedLine.slice(separatorIndex + 1).trim();

  return label && value ? [label, value] : null;
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

function formatTimestamp(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Melbourne"
  }).format(date);
}
