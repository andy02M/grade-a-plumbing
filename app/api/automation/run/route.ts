import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/automation-auth";
import { apiError, idsFrom, readBody } from "@/lib/automation-http";
import { runWorkspaceQueue } from "@/lib/automation-runner";
import { listWorkspaceIds } from "@/lib/automation-store";
import { AutomationError, errorMessage } from "@/lib/automation-types";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const body = await readBody(request);
    const postIds = body.postIds ? idsFrom(body.postIds, "posts", 5000) : undefined;
    return NextResponse.json(await runWorkspaceQueue(workspaceId, { postIds }));
  } catch (error) { return apiError(error); }
}
export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) throw new AutomationError("The publishing scheduler is not configured.", 503);
    const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    if (supplied.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) throw new AutomationError("Unauthorized.", 401);
    const workspaceIds = await listWorkspaceIds();
    const results: Record<string, unknown>[] = [];
    const deadline = Date.now() + 40000;
    for (const workspaceId of workspaceIds) {
      if (Date.now() >= deadline) break;
      try { results.push({ workspaceId, ...await runWorkspaceQueue(workspaceId, { deadline }) }); }
      catch (error) { results.push({ workspaceId, error: errorMessage(error) }); }
    }
    return NextResponse.json({ results, workspacesDeferred: workspaceIds.length - results.length });
  } catch (error) { return apiError(error); }
}
