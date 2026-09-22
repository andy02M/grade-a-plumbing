import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/automation-auth";
import { apiError } from "@/lib/automation-http";
import { getRecord, listRecords } from "@/lib/automation-store";
import { type AutomationEvent, type ScheduledPost } from "@/lib/automation-types";
import { listConnectedGoogleAccounts } from "@/lib/google-account-db-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const [apiAccounts, profiles, templates, posts, drafts, events, worker, browserAccounts] = await Promise.all([
      listConnectedGoogleAccounts(workspaceId), listRecords(workspaceId, "profiles"), listRecords(workspaceId, "templates"),
      listRecords<ScheduledPost>(workspaceId, "posts"), listRecords(workspaceId, "profile-drafts"), listRecords<AutomationEvent>(workspaceId, "events"), getRecord(workspaceId, "settings", "worker"), listRecords<{id:string;email:string;status:string}>(workspaceId,"browser-accounts")
    ]);
    const accounts = [...apiAccounts.map(account => browserAccounts.some(browser => browser.id === account.id) ? {...account,status:"BROWSER_CONNECTED"} : account), ...browserAccounts.filter(browser => !apiAccounts.some(account => account.id === browser.id))];
    return NextResponse.json({ accounts, profiles, templates, posts: posts.sort((a,b) => a.scheduledFor.localeCompare(b.scheduledFor)), drafts,
      events: events.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,200),
      settings: { timezone: "Australia/Melbourne", worker },
      capabilities: {
        storage: true, oauthConfigured: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_GBP_CLIENT_ID), schedulerConfigured: Boolean(process.env.CRON_SECRET),
        schedulerNote: "Automatic publishing checks the queue daily between 23:00 and 23:59 UTC (09:00–09:59 Melbourne standard time; 10:00–10:59 during daylight saving). Posts publish on the first run after their selected time. Exact-time publishing requires a more frequent scheduler.",
        googleNote: "Profile sync and post publishing use the local browser automation runner while Google Business Profile API quota is unavailable.",
        legacyNote: "Only posts saved in this queue appear here. Due posts are published by clicking Run browser posts now."
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
