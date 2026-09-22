import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/automation-auth";
import { apiError, readBody } from "@/lib/automation-http";
import { requiredText } from "@/lib/automation-content";
import { listBusinessAccounts } from "@/lib/automation-google";
import { syncProfiles } from "@/lib/automation-profiles";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const id = requiredText(new URL(request.url).searchParams.get("googleAccountId"), "Google account", 200);
    return NextResponse.json({ businessAccounts: await listBusinessAccounts(workspaceId, id) });
  } catch(error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const body = await readBody(request);
    return NextResponse.json(await syncProfiles(workspaceId, requiredText(body.googleAccountId, "Google account", 200)));
  } catch(error) { return apiError(error); }
}
