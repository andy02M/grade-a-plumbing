import { parseCallActionStatus, type CallActionStatus } from "@/lib/call-actions";
import { getStoredJson, setStoredJson } from "@/lib/call-alert-store";
import type { TelegramDelivery } from "@/lib/telegram";

export type CallActionItem = {
  actionKey: string;
  callMessageKeys?: string[];
  chatId?: string;
  deliveries: TelegramDelivery[];
  status: CallActionStatus;
  text: string;
  updatedAt: string;
};

type CallActionItemState = {
  items: Record<string, CallActionItem>;
  updatedAt: string;
};

const itemKind = "action-items";
const itemKey = "index";
const itemStoreTtlMs = 366 * 24 * 60 * 60 * 1000;

export async function rememberCallActionItem(item: {
  actionKey: string;
  callMessageKeys?: string[];
  chatId?: string;
  deliveries: TelegramDelivery[];
  status: CallActionStatus;
  text: string;
}) {
  const now = new Date().toISOString();
  const state = await getCallActionItemState();
  const existingItem = state.items[item.actionKey];
  const statusChanged = existingItem?.status !== item.status;

  state.items[item.actionKey] = {
    actionKey: item.actionKey,
    callMessageKeys: normalizeStringList(item.callMessageKeys),
    chatId: item.chatId || existingItem?.chatId,
    deliveries: item.deliveries,
    status: item.status,
    text: item.text,
    updatedAt: statusChanged ? now : existingItem?.updatedAt ?? now
  };
  state.updatedAt = now;

  await setStoredJson(itemKind, itemKey, state, itemStoreTtlMs);
}

export async function getBookedCallActionItemsOlderThan(cutoffMs: number) {
  const state = await getCallActionItemState();

  return Object.values(state.items).filter((item) => {
    if (item.status !== "booked") {
      return false;
    }

    const updatedAt = Date.parse(item.updatedAt);

    return Number.isFinite(updatedAt) && updatedAt <= cutoffMs;
  });
}

async function getCallActionItemState() {
  return normalizeCallActionItemState(await getStoredJson<Partial<CallActionItemState>>(itemKind, itemKey, itemStoreTtlMs));
}

function normalizeCallActionItemState(value: Partial<CallActionItemState> | null): CallActionItemState {
  const items: Record<string, CallActionItem> = {};

  if (value?.items && typeof value.items === "object" && !Array.isArray(value.items)) {
    for (const [key, item] of Object.entries(value.items)) {
      const normalizedItem = normalizeCallActionItem(key, item);

      if (normalizedItem) {
        items[key] = normalizedItem;
      }
    }
  }

  return {
    items,
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
  };
}

function normalizeCallActionItem(key: string, value: unknown): CallActionItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const item = value as Partial<CallActionItem>;

  const status = parseCallActionStatus(item.status);

  if (
    typeof item.actionKey !== "string" ||
    !status ||
    typeof item.text !== "string" ||
    typeof item.updatedAt !== "string" ||
    !Array.isArray(item.deliveries)
  ) {
    return null;
  }

  return {
    actionKey: item.actionKey || key,
    callMessageKeys: normalizeStringList(item.callMessageKeys),
    chatId: typeof item.chatId === "string" ? item.chatId : undefined,
    deliveries: item.deliveries.filter(isTelegramDelivery),
    status,
    text: item.text,
    updatedAt: item.updatedAt
  };
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);

  return items.length ? [...new Set(items)] : undefined;
}

function isTelegramDelivery(value: unknown): value is TelegramDelivery {
  if (!value || typeof value !== "object") {
    return false;
  }

  const delivery = value as Partial<TelegramDelivery>;

  return typeof delivery.chatId === "string" && typeof delivery.messageId === "number";
}
