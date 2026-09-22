import { NextResponse } from "next/server";
import { claimRecentAlert, getStoredJson, hasDurableCallAlertStore, setStoredJson } from "@/lib/call-alert-store";
import { getGmbCampaignDates, getGmbPostForDate } from "@/lib/gmb-posts";
import { hasGoogleBusinessProfileConfig, publishGoogleBusinessProfilePost } from "@/lib/google-business-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postRecordTtlMs = 370 * 24 * 60 * 60 * 1000;
const publishLockTtlMs = 10 * 60 * 1000;
type PublishedPostRecord = { googlePostName: string; publishedAt: string; state: string };

export async function GET(request: Request) {
  const authError = validateCronSecret(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const date = url.searchParams.get("date") || getMelbourneDate();
  const dryRun = url.searchParams.get("dryRun") === "1";
  const post = getGmbPostForDate(date);

  if (!post) {
    return NextResponse.json({ campaign: getGmbCampaignDates(), date, message: "No Grade A Plumbing post is scheduled for this date.", ok: true, published: false });
  }

  if (dryRun) return NextResponse.json({ date, dryRun: true, ok: true, post });

  if (!hasGoogleBusinessProfileConfig()) {
    return NextResponse.json({
      error: "Google Business Profile credentials are not configured.",
      missingConfiguration: ["GOOGLE_GBP_CLIENT_ID", "GOOGLE_GBP_CLIENT_SECRET", "GOOGLE_GBP_REFRESH_TOKEN", "GOOGLE_GBP_ACCOUNT_ID", "GOOGLE_GBP_LOCATION_ID"],
      ok: false
    }, { status: 503 });
  }

  if (!hasDurableCallAlertStore()) {
    return NextResponse.json({ error: "Durable Redis storage is required to prevent duplicate Google posts.", ok: false }, { status: 503 });
  }

  const existing = await getStoredJson<PublishedPostRecord>("gmb-post", date, postRecordTtlMs);
  if (existing) return NextResponse.json({ date, ok: true, post, published: false, reason: "already-published", record: existing });

  const ownsLock = await claimRecentAlert(`gmb-publish-lock:${date}`, publishLockTtlMs);
  if (!ownsLock) return NextResponse.json({ date, ok: true, published: false, reason: "publish-in-progress" });

  try {
    const result = await publishGoogleBusinessProfilePost(post);
    const record: PublishedPostRecord = { googlePostName: result.name, publishedAt: new Date().toISOString(), state: result.state };
    await setStoredJson("gmb-post", date, record, postRecordTtlMs);
    return NextResponse.json({ date, ok: true, post, published: true, record });
  } catch (error) {
    console.error("Google Business Profile daily post failed", { date, error });
    return NextResponse.json({ date, error: error instanceof Error ? error.message : "Google Business Profile post failed.", ok: false, published: false }, { status: 502 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

function validateCronSecret(request: Request) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });

  const url = new URL(request.url);
  const providedSecret = url.searchParams.get("secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (providedSecret !== expectedSecret) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return null;
}

function getMelbourneDate() {
  return new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: "Australia/Melbourne", year: "numeric" }).format(new Date());
}
