import { NextResponse } from "next/server";
import { AutomationError, errorMessage } from "./automation-types";

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > 200000) throw new AutomationError("The request is too large.", 413);
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new AutomationError("Send valid JSON."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AutomationError("Send a JSON object.");
  return value as Record<string, unknown>;
}

export function apiError(error: unknown) {
  const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 500;
  return NextResponse.json({ error: errorMessage(error) }, { status, headers: { "Cache-Control": "no-store" } });
}

export function idsFrom(value: unknown, label: string, max = 200) {
  if (!Array.isArray(value) || !value.length || value.length > max || value.some(id => typeof id !== "string" || id.length > 250)) throw new AutomationError(`Select 1–${max} ${label}.`);
  return [...new Set(value)] as string[];
}
