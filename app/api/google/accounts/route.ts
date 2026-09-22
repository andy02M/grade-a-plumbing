import { NextResponse } from "next/server";
import { listConnectedGoogleAccounts } from "@/lib/google-account-db-store";
import { requireWorkspace, jsonError } from "@/lib/automation-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await requireWorkspace(request);
    const accounts = await listConnectedGoogleAccounts(session.workspaceId);
    return NextResponse.json({ accounts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return jsonError(error); }
}
