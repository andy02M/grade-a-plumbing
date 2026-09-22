import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AutomationError } from "./automation-types";

const SESSION_COOKIE = "gmb_workspace_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export type WorkspaceSession = { workspaceId: string; email: string; expiresAt: number };

export function appUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return new URL(value).origin;
}

function signingKey() {
  const key = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new AutomationError("Account sign-in is not configured.", 503);
  return key;
}

export function signCookie(value: object, purpose: string) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = crypto.createHmac("sha256", signingKey()).update(`${purpose}:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function readSignedCookie<T>(value: string | undefined, purpose: string): T | null {
  if (!value || value.length > 8192) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = crypto.createHmac("sha256", signingKey()).update(`${purpose}:${payload}`).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T; }
  catch { return null; }
}

export async function optionalWorkspace(): Promise<WorkspaceSession | null> {
  const cookieStore = await cookies();
  const session = readSignedCookie<WorkspaceSession>(cookieStore.get(SESSION_COOKIE)?.value, "workspace-session");
  if (!session || !/^[a-zA-Z0-9_-]{1,100}$/.test(session.workspaceId) || typeof session.email !== "string" || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return null;
  return session;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== appUrl() || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new AutomationError("Please perform this action from your dashboard.", 403);
  }
}

export async function requireWorkspace(request?: Request): Promise<WorkspaceSession> {
  const session = await optionalWorkspace();
  if (!session) throw new AutomationError("Sign in to access your workspace.", 401);
  if (request && !["GET", "HEAD"].includes(request.method.toUpperCase())) assertSameOrigin(request);
  return session;
}

export async function setWorkspaceSession(workspaceId: string, email: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signCookie({ workspaceId, email, expiresAt: Date.now() + SESSION_SECONDS * 1000 }, "workspace-session"), {
    httpOnly: true, secure: appUrl().startsWith("https://"), sameSite: "lax", path: "/", maxAge: SESSION_SECONDS
  });
}

export async function clearWorkspaceSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("gmb_oauth_state");
}

export function jsonError(error: unknown) {
  const status = error instanceof AutomationError ? error.status : 500;
  const message = error instanceof AutomationError ? error.message : "The operation could not be completed. Please try again.";
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
