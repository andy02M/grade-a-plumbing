import { NextResponse } from "next/server";
import { optionalWorkspace, assertSameOrigin, clearWorkspaceSession, jsonError } from "@/lib/automation-auth";
import { AutomationError } from "@/lib/automation-types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await optionalWorkspace();
    return NextResponse.json(session ? { authenticated: true, email: session.email, workspaceId: session.workspaceId } : { authenticated: false }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await request.json().catch(() => null) as { action?: string } | null;
    if (body?.action !== "logout") throw new AutomationError("Choose a valid session action.", 400);
    await clearWorkspaceSession();
    return NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    await clearWorkspaceSession();
    return NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return jsonError(error); }
}
