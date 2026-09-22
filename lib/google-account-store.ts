import crypto from "node:crypto";

export type ConnectedGoogleAccount = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  connectedAt: string;
  encryptedRefreshToken: string;
};

const STORE_KEY = "gmb-autopilot:google-accounts";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function encryptionKey() {
  return crypto.createHash("sha256").update(requiredEnv("OAUTH_TOKEN_ENCRYPTION_KEY")).digest();
}

export function encryptToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

async function upstashFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = requiredEnv("UPSTASH_REDIS_REST_URL").replace(/\/$/, "");
  const token = requiredEnv("UPSTASH_REDIS_REST_TOKEN");
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function listConnectedGoogleAccounts() {
  const data = await upstashFetch<{ result: string[] }>(`/lrange/${encodeURIComponent(STORE_KEY)}/0/-1`);
  return data.result.map((item) => JSON.parse(item) as ConnectedGoogleAccount);
}

export async function saveConnectedGoogleAccount(account: ConnectedGoogleAccount) {
  const existing = await listConnectedGoogleAccounts().catch(() => []);
  const deduped = existing.filter((item) => item.email !== account.email);
  deduped.unshift(account);

  await upstashFetch(`/del/${encodeURIComponent(STORE_KEY)}`, { method: "POST" });

  for (const item of deduped) {
    await upstashFetch(`/rpush/${encodeURIComponent(STORE_KEY)}/${encodeURIComponent(JSON.stringify(item))}`, {
      method: "POST"
    });
  }
}
