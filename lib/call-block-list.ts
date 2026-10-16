import { getDurableStoredJson, setDurableStoredJson } from "@/lib/call-alert-store";

type BlockedCallerList = {
  numbers: string[];
  updatedAt: number;
};

const blockedCallerKind = "blocked-callers";
const blockedCallerKey = "numbers";
const blockedCallerTtlMs = 10 * 365 * 24 * 60 * 60 * 1000;

export function normalizeCallerNumber(value: string | undefined) {
  if (!value || !/^\+?[\d\s().-]+$/.test(value.trim())) return "";
  const digits = value.replace(/\D/g, "").replace(/^00/, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("04") && digits.length === 10) {
    return `61${digits.slice(1)}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `61${digits.slice(1)}`;
  }

  if (digits.startsWith("61") && digits.length === 11) {
    return digits;
  }

  return /^[1-9]\d{7,14}$/.test(digits) ? digits : "";
}

export async function blockCallerNumber(value: string | undefined) {
  const normalizedNumber = normalizeCallerNumber(value);

  if (!normalizedNumber) {
    return {
      blocked: false,
      normalizedNumber: ""
    };
  }

  await setDurableStoredJson(
    blockedCallerKind,
    `number:${normalizedNumber}`,
    {
      number: normalizedNumber,
      updatedAt: Date.now()
    },
    blockedCallerTtlMs
  );

  return {
    blocked: true,
    normalizedNumber
  };
}

export async function isCallerNumberBlocked(value: string | undefined) {
  const normalizedNumber = normalizeCallerNumber(value);

  if (!normalizedNumber) {
    return false;
  }

  const entry = await getDurableStoredJson<{ number: string }>(blockedCallerKind, `number:${normalizedNumber}`);
  if (entry?.number === normalizedNumber) return true;
  const list = await getBlockedCallerList();

  return list.numbers.includes(normalizedNumber);
}

export function extractCallerNumberFromAlertText(text: string) {
  const callerLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^(?:caller|caller id)\s*:/i.test(line.replace(/^[^\p{L}\p{N}]+/u, "")));

  if (callerLine) {
    const separatorIndex = callerLine.indexOf(":");
    const value = separatorIndex >= 0 ? callerLine.slice(separatorIndex + 1) : "";
    const normalizedNumber = normalizeCallerNumber(value);

    if (normalizedNumber) {
      return normalizedNumber;
    }
  }

  return "";
}

export function formatBlockedCallerNumber(value: string) {
  const normalizedNumber = normalizeCallerNumber(value);

  if (normalizedNumber.startsWith("61") && normalizedNumber.length === 11) {
    return `+${normalizedNumber}`;
  }

  return normalizedNumber || value;
}

async function getBlockedCallerList() {
  const list = await getDurableStoredJson<BlockedCallerList>(blockedCallerKind, blockedCallerKey);

  if (!list || !Array.isArray(list.numbers)) {
    return {
      numbers: [],
      updatedAt: 0
    };
  }

  return {
    numbers: [...new Set(list.numbers.map(normalizeCallerNumber).filter(Boolean))],
    updatedAt: typeof list.updatedAt === "number" ? list.updatedAt : 0
  };
}
