import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/automation-auth";
import { apiError, readBody } from "@/lib/automation-http";
import { requiredText } from "@/lib/automation-content";
import { actOnProfileDraft, saveProfileDraft } from "@/lib/automation-profiles";
import { AutomationError } from "@/lib/automation-types";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const body = await readBody(request);
    if (!body.action || body.action === "save") return NextResponse.json({ draft: await saveProfileDraft(workspaceId, body) });
    if (body.action !== "validate" && body.action !== "create") throw new AutomationError("Choose a valid draft action.");
    return NextResponse.json({ draft: await actOnProfileDraft(workspaceId, requiredText(body.id, "Draft ID", 100), body.action) });
  } catch(error) { return apiError(error); }
}
