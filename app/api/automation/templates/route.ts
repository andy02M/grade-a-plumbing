import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/automation-auth";
import { requiredText, validateContent } from "@/lib/automation-content";
import { apiError, readBody } from "@/lib/automation-http";
import { getRecord, listRecords, putRecord, removeRecord } from "@/lib/automation-store";
import { AutomationError, type PostTemplate } from "@/lib/automation-types";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const body = await readBody(request);
    const id = body.id ? requiredText(body.id, "Template ID", 100) : crypto.randomUUID();
    const existing = await getRecord<PostTemplate>(workspaceId, "templates", id);
    if (body.id && !existing) throw new AutomationError("Template not found.", 404);
    if (!existing && (await listRecords(workspaceId, "templates")).length >= 200) throw new AutomationError("This workspace supports up to 200 templates.");
    const now = new Date().toISOString();
    const template: PostTemplate = { id, name: requiredText(body.name, "Template name", 120), ...validateContent(body), createdAt: existing?.createdAt || now, updatedAt: now };
    await putRecord(workspaceId, "templates", id, template);
    return NextResponse.json({ template });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const body = await readBody(request);
    await removeRecord(workspaceId, "templates", requiredText(body.id, "Template ID", 100));
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
