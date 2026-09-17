import { getStoredJson, setStoredJson } from "@/lib/call-alert-store";

type BlockedCallerList = {
  numbers: string[];
  updatedAt: number;
};

const blockedCallerKind = "blocked-callers";
const blockedCallerKey = "numbers";
const blockedCallerTtlMs = 10 * 365 * 24 * 60 * 60 * 1000;

export function normalizeCallerNumber(value: string | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");

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

  return digits.length >= 8 ? digits : "";
}

export async function blockCallerNumber(value: string | undefined) {
  const normalizedNumber = normalizeCallerNumber(value);

  if (!normalizedNumber) {
    return {
      blocked: false,
      normalizedNumber: ""
    };
  }

  const list = await getBlockedCallerList();
  const numbers = new Set(list.numbers);
  numbers.add(normalizedNumber);

  await setStoredJson<BlockedCallerList>(
    blockedCallerKind,
    blockedCallerKey,
    {
      numbers: [...numbers].sort(),
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

  const list = await getBlockedCallerList();

  return list.numbers.includes(normalizedNumber);
}

export function extractCallerNumberFromAlertText(text: string) {
  const callerLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^(?:📞\s*)?(?:caller|caller id)\s*:/i.test(line));

  if (callerLine) {
    const separatorIndex = callerLine.indexOf(":");
    const value = separatorIndex >= 0 ? callerLine.slice(separatorIndex + 1) : "";
    const normalizedNumber = normalizeCallerNumber(value);

    if (normalizedNumber) {
      return normalizedNumber;
    }
  }

  const phoneMatch = text.match(/\+?\d[\d\s().-]{7,}\d/);

  return normalizeCallerNumber(phoneMatch?.[0]);
}

export function formatBlockedCallerNumber(value: string) {
  const normalizedNumber = normalizeCallerNumber(value);

  if (normalizedNumber.startsWith("61") && normalizedNumber.length === 11) {
    return `+${normalizedNumber}`;
  }

  return normalizedNumber || value;
}

async function getBlockedCallerList() {
  const list = await getStoredJson<BlockedCallerList>(blockedCallerKind, blockedCallerKey, blockedCallerTtlMs);

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
