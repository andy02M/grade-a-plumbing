import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/automation-auth";
import { apiError } from "@/lib/automation-http";
import { requiredText } from "@/lib/automation-content";
import { searchBusinessCategories } from "@/lib/automation-google";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const query = new URL(request.url).searchParams;
    return NextResponse.json(await searchBusinessCategories(workspaceId, requiredText(query.get("googleAccountId"), "Google account", 200), query.get("q") || "", query.get("regionCode") || "AU"));
  } catch(error) { return apiError(error); }
}
