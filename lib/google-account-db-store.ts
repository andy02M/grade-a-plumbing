import crypto from "node:crypto";
import { redisCommand, registerWorkspace } from "./automation-store";

export type ConnectedGoogleAccountInput = { id: string; email: string; name?: string; picture?: string; refreshToken: string };
export type ConnectedGoogleAccount = {
  id: string;
  googleSub: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  status: "CONNECTED" | "NEEDS_REAUTH" | "REVOKED";
  connectedAt: string;
  lastSyncedAt?: string | null;
  encryptedRefreshToken: string;
  businessProfiles: Array<{ id: string; title: string; status: string; selected: boolean }>;
};
export type SafeConnectedGoogleAccount = Omit<ConnectedGoogleAccount, "encryptedRefreshToken">;

const LEGACY_KEY = "gmb-autopilot:google-accounts";

function encryptionKey() {
  const secret = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("Account encryption is not configured.");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Stored account credentials need to be reconnected.");
  const [iv, tag, encrypted] = parts.map((part) => Buffer.from(part, "base64"));
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Stored account credentials need to be reconnected.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function accountKey(workspaceId: string) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(workspaceId)) throw new Error("Invalid workspace.");
  return `gmb-autopilot:workspace:${workspaceId}:google-accounts`;
}

function normalizeAccount(account: ConnectedGoogleAccount): ConnectedGoogleAccount {
  return { ...account, googleSub: account.googleSub || account.id, status: account.status || "CONNECTED", businessProfiles: account.businessProfiles || [] };
}

function safeAccount(account: ConnectedGoogleAccount): SafeConnectedGoogleAccount {
  const { encryptedRefreshToken: _credential, ...safe } = account;
  return safe;
}

async function listRedisAccounts(workspaceId: string): Promise<ConnectedGoogleAccount[]> {
  const [current, legacy] = await Promise.all([
    redisCommand<string[]>(["HVALS", accountKey(workspaceId)]),
    workspaceId === "default" ? redisCommand<string[]>(["LRANGE", LEGACY_KEY, 0, -1]) : Promise.resolve([])
  ]);
  // Legacy accounts belong only to the original owner's workspace. Keep its
  // list intact and overlay atomic per-account records on reads.
  const accounts = new Map<string, ConnectedGoogleAccount>();
  for (const item of [...legacy, ...current]) {
    const account = normalizeAccount(JSON.parse(item) as ConnectedGoogleAccount);
    accounts.set(account.googleSub, account);
  }
  return Array.from(accounts.values()).sort((a, b) => b.connectedAt.localeCompare(a.connectedAt));
}

async function getPostgresWorkspace(workspaceId: string) {
  accountKey(workspaceId);
  const { db } = await import("./db");
  return db.workspace.upsert({
    where: { slug: workspaceId }, update: {},
    create: { name: process.env.DEFAULT_WORKSPACE_NAME || "GMB AutoPilot", slug: workspaceId }
  });
}

async function listPostgresAccounts(workspaceId: string): Promise<ConnectedGoogleAccount[]> {
  const { db } = await import("./db");
  const workspace = await getPostgresWorkspace(workspaceId);
  const records = await db.googleAccount.findMany({
    where: { workspaceId: workspace.id }, orderBy: { connectedAt: "desc" },
    include: { businessProfiles: { select: { id: true, title: true, status: true, selected: true } } }
  });
  return records.map((account) => ({
    id: account.id, googleSub: account.googleSub, email: account.email, name: account.name, picture: account.picture,
    encryptedRefreshToken: account.encryptedRefreshToken, status: account.status,
    connectedAt: account.connectedAt.toISOString(), lastSyncedAt: account.lastSyncedAt?.toISOString() || null,
    businessProfiles: account.businessProfiles
  }));
}

async function listSecretAccounts(workspaceId: string) {
  return process.env.DATABASE_URL ? listPostgresAccounts(workspaceId) : listRedisAccounts(workspaceId);
}

export async function listConnectedGoogleAccounts(workspaceId = "default") {
  return (await listSecretAccounts(workspaceId)).map(safeAccount);
}

/** Server-side credentials only; never serialize this record into an API response. */
export async function getConnectedGoogleAccount(accountId: string, workspaceId = "default") {
  return (await listSecretAccounts(workspaceId)).find((account) => account.id === accountId || account.googleSub === accountId) || null;
}

export async function saveConnectedGoogleAccount(input: ConnectedGoogleAccountInput, workspaceId = "default") {
  if (!input.refreshToken) throw new Error("Reconnect this account to grant offline access.");
  await registerWorkspace(workspaceId);
  if (process.env.DATABASE_URL) {
    const { db } = await import("./db");
    const workspace = await getPostgresWorkspace(workspaceId);
    const record = await db.googleAccount.upsert({
      where: { workspaceId_googleSub: { workspaceId: workspace.id, googleSub: input.id } },
      update: { email: input.email, name: input.name, picture: input.picture, encryptedRefreshToken: encryptToken(input.refreshToken), status: "CONNECTED" },
      create: { workspaceId: workspace.id, googleSub: input.id, email: input.email, name: input.name, picture: input.picture, encryptedRefreshToken: encryptToken(input.refreshToken), status: "CONNECTED" }
    });
    return safeAccount((await getConnectedGoogleAccount(record.id, workspaceId))!);
  }
  const existing = await getConnectedGoogleAccount(input.id, workspaceId);
  const account: ConnectedGoogleAccount = {
    ...existing, id: existing?.id || input.id, googleSub: input.id,
    email: input.email, name: input.name, picture: input.picture, status: "CONNECTED",
    connectedAt: existing?.connectedAt || new Date().toISOString(), lastSyncedAt: existing?.lastSyncedAt || null,
    encryptedRefreshToken: encryptToken(input.refreshToken), businessProfiles: existing?.businessProfiles || []
  };
  await redisCommand(["HSET", accountKey(workspaceId), account.googleSub, JSON.stringify(account)]);
  return safeAccount(account);
}

export async function markAccountNeedsReauth(accountId: string, workspaceId: string) {
  const account = await getConnectedGoogleAccount(accountId, workspaceId);
  if (!account) return;
  if (process.env.DATABASE_URL) {
    const { db } = await import("./db");
    const workspace = await getPostgresWorkspace(workspaceId);
    await db.googleAccount.updateMany({ where: { id: account.id, workspaceId: workspace.id }, data: { status: "NEEDS_REAUTH" } });
    return;
  }
  await redisCommand(["HSET", accountKey(workspaceId), account.googleSub, JSON.stringify({ ...account, status: "NEEDS_REAUTH" })]);
}
