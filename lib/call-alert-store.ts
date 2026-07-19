import type { TelegramDelivery } from "@/lib/telegram";

export type StoredCallMessage = {
  deliveries: TelegramDelivery[];
  status?: string;
  text?: string;
  storedAt: number;
};

type RedisResponse<T> =
  | {
      result: T;
    }
  | {
      error: string;
    };

const memoryRecentAlerts = new Map<string, number>();
const memoryCallMessages = new Map<string, StoredCallMessage>();
const memoryJsonValues = new Map<string, { storedAt: number; value: unknown }>();

export function hasDurableCallAlertStore() {
  return Boolean(getRedisConfig());
}

export async function claimRecentAlert(key: string, ttlMs: number) {
  const redisKey = buildKey("recent", key);
  const ttlSeconds = msToSeconds(ttlMs);
  const redisResult = await redisCommand<string | null>(["SET", redisKey, "1", "NX", "EX", ttlSeconds]);

  if (redisResult.ok) {
    return redisResult.value === "OK";
  }

  pruneMemoryRecentAlerts(ttlMs);

  if (memoryRecentAlerts.has(key)) {
    return false;
  }

  memoryRecentAlerts.set(key, Date.now());

  return true;
}

export async function rememberRecentAlert(key: string, ttlMs: number) {
  const redisKey = buildKey("recent", key);
  const redisResult = await redisCommand<string>(["SET", redisKey, "1", "EX", msToSeconds(ttlMs)]);

  if (redisResult.ok) {
    return;
  }

  pruneMemoryRecentAlerts(ttlMs);
  memoryRecentAlerts.set(key, Date.now());
}

export async function rememberCallMessage(key: string, deliveries: TelegramDelivery[], ttlMs: number, text?: string) {
  const existingRecord = text === undefined ? await getCallMessageRecord(key, ttlMs) : null;
  const payload: StoredCallMessage = {
    deliveries,
    status: existingRecord?.status,
    text: text ?? existingRecord?.text,
    storedAt: Date.now()
  };
  const redisKey = buildKey("message", key);
  const redisResult = await redisCommand<string>(["SET", redisKey, JSON.stringify(payload), "EX", msToSeconds(ttlMs)]);

  if (redisResult.ok) {
    return;
  }

  pruneMemoryCallMessages(ttlMs);
  memoryCallMessages.set(key, payload);
}

export async function getCallMessages(key: string, ttlMs: number) {
  return (await getCallMessageRecord(key, ttlMs))?.deliveries ?? [];
}

export async function getCallMessageRecord(key: string, ttlMs: number) {
  const redisKey = buildKey("message", key);
  const redisResult = await redisCommand<string | null>(["GET", redisKey]);

  if (redisResult.ok) {
    return parseStoredCallMessage(redisResult.value);
  }

  pruneMemoryCallMessages(ttlMs);

  return memoryCallMessages.get(key) ?? null;
}

export async function rememberCallMessageStatus(key: string, ttlMs: number, status: string, text: string) {
  const existingRecord = await getCallMessageRecord(key, ttlMs);

  if (!existingRecord) {
    return;
  }

  const redisKey = buildKey("message", key);
  const payload: StoredCallMessage = {
    ...existingRecord,
    status,
    text,
    storedAt: Date.now()
  };
  const redisResult = await redisCommand<string>(["SET", redisKey, JSON.stringify(payload), "EX", msToSeconds(ttlMs)]);

  if (redisResult.ok) {
    return;
  }

  memoryCallMessages.set(key, payload);
}

export async function getStoredJson<T>(kind: string, key: string, ttlMs: number) {
  const redisKey = buildKey(kind, key);
  const redisResult = await redisCommand<string | null>(["GET", redisKey]);

  if (redisResult.ok) {
    return parseStoredJson<T>(redisResult.value);
  }

  pruneMemoryJsonValues(ttlMs);

  return (memoryJsonValues.get(`${kind}:${key}`)?.value as T | undefined) ?? null;
}

export async function setStoredJson<T>(kind: string, key: string, value: T, ttlMs: number) {
  const redisKey = buildKey(kind, key);
  const redisResult = await redisCommand<string>(["SET", redisKey, JSON.stringify(value), "EX", msToSeconds(ttlMs)]);

  if (redisResult.ok) {
    return;
  }

  pruneMemoryJsonValues(ttlMs);
  memoryJsonValues.set(`${kind}:${key}`, {
    storedAt: Date.now(),
    value
  });
}

function parseStoredCallMessage(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(value) as Partial<StoredCallMessage>;

    if (!Array.isArray(parsedValue.deliveries)) {
      return null;
    }

    return {
      deliveries: parsedValue.deliveries.filter(isTelegramDelivery),
      status: typeof parsedValue.status === "string" ? parsedValue.status : undefined,
      text: typeof parsedValue.text === "string" ? parsedValue.text : undefined,
      storedAt: typeof parsedValue.storedAt === "number" ? parsedValue.storedAt : Date.now()
    };
  } catch {
    return null;
  }
}

function parseStoredJson<T>(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isTelegramDelivery(value: unknown): value is TelegramDelivery {
  if (!value || typeof value !== "object") {
    return false;
  }

  const delivery = value as Partial<TelegramDelivery>;

  return typeof delivery.chatId === "string" && typeof delivery.messageId === "number";
}

async function redisCommand<T>(command: Array<string | number>) {
  const config = getRedisConfig();

  if (!config) {
    return {
      ok: false as const,
      error: "Redis environment variables are not configured."
    };
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(command),
      cache: "no-store"
    });
    const data = (await response.json()) as RedisResponse<T>;

    if (!response.ok || "error" in data) {
      console.error("Call alert store command failed", {
        command: command[0],
        error: "error" in data ? data.error : response.statusText,
        status: response.status
      });

      return {
        ok: false as const,
        error: "error" in data ? data.error : response.statusText
      };
    }

    return {
      ok: true as const,
      value: data.result
    };
  } catch (error) {
    console.error("Call alert store request failed", {
      command: command[0],
      error
    });

    return {
      ok: false as const,
      error: "Call alert store request failed."
    };
  }
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

  if (!url || !token) {
    return null;
  }

  return {
    token,
    url: url.replace(/\/+$/, "")
  };
}

function buildKey(kind: string, key: string) {
  return `grade-a-plumbing:call-alert:${kind}:${key}`;
}

function msToSeconds(value: number) {
  return Math.max(1, Math.ceil(value / 1000));
}

function pruneMemoryRecentAlerts(ttlMs: number) {
  const now = Date.now();

  for (const [key, timestamp] of memoryRecentAlerts.entries()) {
    if (now - timestamp > ttlMs) {
      memoryRecentAlerts.delete(key);
    }
  }
}

function pruneMemoryCallMessages(ttlMs: number) {
  const now = Date.now();

  for (const [key, value] of memoryCallMessages.entries()) {
    if (now - value.storedAt > ttlMs) {
      memoryCallMessages.delete(key);
    }
  }
}

function pruneMemoryJsonValues(ttlMs: number) {
  const now = Date.now();

  for (const [key, value] of memoryJsonValues.entries()) {
    if (now - value.storedAt > ttlMs) {
      memoryJsonValues.delete(key);
    }
  }
}
