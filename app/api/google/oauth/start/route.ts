import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl, requireWorkspace, signCookie } from "@/lib/automation-auth";
import { AutomationError } from "@/lib/automation-types";

export const runtime = "nodejs";

export type OAuthTransaction = {
  state: string;
  mode: "login" | "connect";
  expiresAt: number;
  verifier: string;
  workspaceId?: string;
  ownerEmail?: string;
};

export async function GET(request: Request) {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_GBP_CLIENT_ID;
    if (!clientId) throw new AutomationError("Google sign-in is not configured.", 503);
    const mode = new URL(request.url).searchParams.get("mode") === "login" ? "login" : "connect";
    const session = mode === "connect" ? await requireWorkspace(request) : null;
    const transaction: OAuthTransaction = {
      state: crypto.randomBytes(24).toString("hex"), mode,
      expiresAt: Date.now() + 600_000, verifier: crypto.randomBytes(48).toString("base64url"),
      ...(session ? { workspaceId: session.workspaceId, ownerEmail: session.email } : {})
    };
    const cookieStore = await cookies();
    cookieStore.set("gmb_oauth_state", signCookie(transaction, "oauth-state"), {
      httpOnly: true, maxAge: 600, sameSite: "lax", secure: appUrl().startsWith("https://"), path: "/"
    });
    const params = new URLSearchParams({
      client_id: clientId, redirect_uri: `${appUrl()}/api/google/oauth/callback`, response_type: "code",
      scope: mode === "login" ? "openid email profile" : "openid email profile https://www.googleapis.com/auth/business.manage",
      prompt: mode === "login" ? "select_account" : "select_account consent",
      state: transaction.state,
      code_challenge: crypto.createHash("sha256").update(transaction.verifier).digest("base64url"),
      code_challenge_method: "S256"
    });
    if (mode === "connect") params.set("access_type", "offline");
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const message = error instanceof AutomationError ? error.message : "Google sign-in could not be started. Please try again.";
    return NextResponse.redirect(`${appUrl()}/dashboard?error=${encodeURIComponent(message)}`);
  }
}
