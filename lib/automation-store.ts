import crypto from "node:crypto";
import { AutomationError, type AutomationEvent } from "./automation-types";

export function hasAutomationStore() {
  return Boolean((process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) && (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN));
}

// A failed durable write must never be replaced by process-local memory.
export async function redisCommand<T>(command: Array<string | number>): Promise<T> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new AutomationError("Persistent storage is not configured. Nothing has been saved.", 503);
  const response = await fetch(url.replace(/\/+$/, ""), {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command), cache: "no-store", signal: AbortSignal.timeout(15000)
  });
  const data = await response.json() as { result: T; error?: string };
  if (!response.ok || data.error) throw new AutomationError("Persistent storage is temporarily unavailable. Please retry.", 503);
  return data.result;
}

function key(workspaceId: string, collection: string) {
  return `gmb-autopilot:v2:${encodeURIComponent(workspaceId)}:${encodeURIComponent(collection)}`;
}

export async function listRecords<T>(workspaceId: string, collection: string): Promise<T[]> {
  const values = await redisCommand<string[]>(["HVALS", key(workspaceId, collection)]);
  return values.map(value => JSON.parse(value) as T);
}

export async function getRecord<T>(workspaceId: string, collection: string, id: string): Promise<T | null> {
  const value = await redisCommand<string | null>(["HGET", key(workspaceId, collection), id]);
  return value ? JSON.parse(value) as T : null;
}

export async function putRecord<T>(workspaceId: string, collection: string, id: string, value: T) {
  await redisCommand(["HSET", key(workspaceId, collection), id, JSON.stringify(value)]);
}

export async function putRecords<T extends {id: string}>(workspaceId: string, collection: string, values: T[]) {
  if (!values.length) return;
  await redisCommand(["HSET", key(workspaceId, collection), ...values.flatMap(value => [value.id, JSON.stringify(value)])]);
}

export async function removeRecord(workspaceId: string, collection: string, id: string) {
  await redisCommand(["HDEL", key(workspaceId, collection), id]);
}

export async function withWorkspaceLock<T>(workspaceId: string, name: string, fn: () => Promise<T>): Promise<T> {
  const lockKey = key(workspaceId, `lock:${name}`);
  const token = crypto.randomUUID();
  const acquired = await redisCommand<string | null>(["SET", lockKey, token, "NX", "EX", 180]);
  if (acquired !== "OK") throw new AutomationError("This operation is already running. Please wait a moment.", 409);
  try { return await fn(); }
  finally {
    await redisCommand(["EVAL", "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end", 1, lockKey, token]).catch(() => undefined);
  }
}

export async function recordEvent(workspaceId: string, message: string, level: AutomationEvent["level"] = "info", postId?: string) {
  const event: AutomationEvent = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), level, message, ...(postId ? { postId } : {}) };
  await putRecord(workspaceId, "events", event.id, event);
}

export async function registerWorkspace(workspaceId: string) {
  await redisCommand(["SADD", "gmb-autopilot:v2:workspaces", workspaceId]);
}

export async function listWorkspaceIds() {
  return redisCommand<string[]>(["SMEMBERS", "gmb-autopilot:v2:workspaces"]);
}
