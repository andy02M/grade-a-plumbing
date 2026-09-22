import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { saveConnectedGoogleAccount, getConnectedGoogleAccount, decryptToken } from "@/lib/google-account-db-store";
import { appUrl, optionalWorkspace, readSignedCookie, setWorkspaceSession } from "@/lib/automation-auth";
import { AutomationError } from "@/lib/automation-types";
import { registerWorkspace } from "@/lib/automation-store";
import type { OAuthTransaction } from "../start/route";

export const runtime = "nodejs";

async function exchangeCode(code: string, verifier: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_GBP_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_GBP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new AutomationError("Google sign-in is not configured.", 503);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, code_verifier: verifier, client_id: clientId, client_secret: clientSecret,
      redirect_uri: `${appUrl()}/api/google/oauth/callback`, grant_type: "authorization_code" }),
    cache: "no-store", signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new AutomationError("Google could not complete this sign-in. Please start again from the dashboard.", 502);
  const token = await response.json() as { access_token?: string; refresh_token?: string; scope?: string };
  if (!token.access_token) throw new AutomationError("Google did not return sign-in credentials. Please try again.", 502);
  return token as { access_token: string; refresh_token?: string; scope?: string };
}

async function getGoogleProfile(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new AutomationError("Google could not verify your account. Please try signing in again.", 502);
  const profile = await response.json() as { id?: string; email?: string; verified_email?: boolean; name?: string; picture?: string };
  if (!profile.id || !/^[0-9]{1,40}$/.test(profile.id) || !profile.email || profile.verified_email !== true) {
    throw new AutomationError("Sign in with a Google account that has a verified email address.", 403);
  }
  return { ...profile, id: profile.id, email: profile.email.toLowerCase() };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const cookieStore = await cookies();
    const transaction = readSignedCookie<OAuthTransaction>(cookieStore.get("gmb_oauth_state")?.value, "oauth-state");
    const state = url.searchParams.get("state");
    if (!transaction || !state || transaction.state !== state || transaction.expiresAt <= Date.now()) {
      throw new AutomationError("This Google sign-in expired. Start again from the dashboard.", 400);
    }
    cookieStore.delete("gmb_oauth_state");
    if (url.searchParams.get("error")) throw new AutomationError("Google access was not granted. You can try connecting the account again.", 400);
    const code = url.searchParams.get("code");
    if (!code) throw new AutomationError("Google did not return a sign-in code. Please try again.", 400);
    const session = await optionalWorkspace();
    if (transaction.mode === "connect" && (!session || session.workspaceId !== transaction.workspaceId || session.email !== transaction.ownerEmail)) {
      throw new AutomationError("Sign in to your workspace again before adding a Google account.", 401);
    }
    if (!["login", "connect"].includes(transaction.mode)) throw new AutomationError("Invalid sign-in request.", 400);
    const token = await exchangeCode(code, transaction.verifier);
    const profile = await getGoogleProfile(token.access_token);
    if (transaction.mode === "login") {
      const isLegacyOwner = profile.id === "101810537438504853009" && profile.email === "andys1stalt@gmail.com";
      const workspaceId = isLegacyOwner ? "default" : `google-${profile.id}`;
      await registerWorkspace(workspaceId);
      await setWorkspaceSession(workspaceId, profile.email);
      return NextResponse.redirect(`${appUrl()}/dashboard?signedIn=1`);
    }
    const workspaceId = session!.workspaceId;
    if (!token.scope?.split(" ").includes("https://www.googleapis.com/auth/business.manage")) {
      throw new AutomationError("Allow Business Profile management when connecting this account so it can publish posts.", 400);
    }
    const existing = await getConnectedGoogleAccount(profile.id, workspaceId);
    const refreshToken = token.refresh_token || (existing?.status === "CONNECTED" ? decryptToken(existing.encryptedRefreshToken) : undefined);
    if (!refreshToken) throw new AutomationError("Google did not grant offline access. Reconnect this account and allow the requested permissions.", 400);
    await saveConnectedGoogleAccount({ id: profile.id, email: profile.email, name: profile.name, picture: profile.picture, refreshToken }, workspaceId);
    return NextResponse.redirect(`${appUrl()}/dashboard?connected=1`);
  } catch (error) {
    const message = error instanceof AutomationError ? error.message : "Account connection could not be completed. Please try again.";
    return NextResponse.redirect(`${appUrl()}/dashboard?error=${encodeURIComponent(message)}`);
  }
}
