import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/automation-auth";
import { campaignDates, localDateTimeToUtc, renderContent, requiredText } from "@/lib/automation-content";
import { dedupeProfiles, sameBusiness } from "@/lib/automation-dedupe";
import { apiError, idsFrom, readBody } from "@/lib/automation-http";
import { listRecords, putRecords, recordEvent, registerWorkspace, withWorkspaceLock } from "@/lib/automation-store";
import { AutomationError, type AutomationProfile, type PostTemplate, type ScheduledPost } from "@/lib/automation-types";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const body = await readBody(request);
    const templateIds = idsFrom(body.templateIds, "templates");
    const syncMissing = body.action === "sync-missing" || body.syncMissing === true;
    const profileIds = syncMissing && body.profileIds === undefined ? [] : idsFrom(body.profileIds, "profiles");
    const timezone = requiredText(body.timezone, "Time zone", 100);
    const dates = campaignDates(requiredText(body.startDate, "Start date", 10), requiredText(body.endDate, "End date", 10));
    const time = requiredText(body.time, "Time", 5);
    if (!syncMissing && dates.length * profileIds.length > 5000) throw new AutomationError("Schedule up to 5,000 profile posts at a time.");
    const result = await withWorkspaceLock(workspaceId, "queue", async () => {
      const [allProfiles, allTemplates, existing] = await Promise.all([
        listRecords<AutomationProfile>(workspaceId, "profiles"), listRecords<PostTemplate>(workspaceId, "templates"), listRecords<ScheduledPost>(workspaceId, "posts")
      ]);
      const eligibleProfiles = allProfiles.filter(profile => profile.canOperateLocalPost !== false && !["SUSPENDED", "UNAVAILABLE", "VERIFICATION_REQUIRED", "NEEDS_VERIFICATION"].includes(profile.status));
      const profiles = dedupeProfiles(syncMissing ? eligibleProfiles : profileIds.map(id => {
        const profile = allProfiles.find(p => p.id === id);
        if (!profile) throw new AutomationError("A selected profile is no longer available. Refresh profiles.");
        if (!eligibleProfiles.some(p => p.id === profile.id)) throw new AutomationError(`${profile.title} is not currently eligible for posting.`);
        return profile;
      }));
      if (dates.length * profiles.length > 5000) throw new AutomationError("Schedule up to 5,000 profile posts at a time.");
      const templates = templateIds.map(id => {
        const template = allTemplates.find(t => t.id === id);
        if (!template) throw new AutomationError("A selected template was removed. Refresh templates.");
        return template;
      });
      const now = new Date().toISOString();
      const batchId = crypto.randomUUID();
      const posts: ScheduledPost[] = [];
      let skipped = 0;
      for (const [index, date] of dates.entries()) {
        const scheduledFor = localDateTimeToUtc(date, time, timezone);
        if (scheduledFor <= now) throw new AutomationError("Schedule posts in the future. Choose a later start date or time.");
        const template = templates[index % templates.length];
        for (const profile of profiles) {
          const duplicate = existing.some(p => p.status !== "CANCELLED" && p.scheduledFor === scheduledFor && (p.profileId === profile.id || sameBusiness(allProfiles.find(other => other.id === p.profileId), profile)));
          if (duplicate) { skipped++; continue; }
          posts.push({ id: crypto.randomUUID(), batchId, templateId: template.id, profileId: profile.id, profileTitle: profile.title, googleAccountId: profile.googleAccountId, scheduledFor, timezone, ...renderContent(template, profile), status: "SCHEDULED", attempts: 0, createdAt: now, updatedAt: now });
        }
      }
      if (existing.length + posts.length > 20000) throw new AutomationError("This workspace has reached its 20,000 saved-post limit.");
      await registerWorkspace(workspaceId);
      await putRecords(workspaceId, "posts", posts);
      await recordEvent(workspaceId, `Scheduled ${posts.length} profile posts across ${dates.length} days; ${skipped} existing slots skipped.`).catch(() => undefined);
      return { created: posts.length, days: dates.length, profiles: profiles.length, skipped, expected: dates.length * profiles.length, batchId };
    });
    return NextResponse.json(result);
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const body = await readBody(request);
    const ids = idsFrom(body.ids, "posts", 5000);
    const action = body.action;
    if (!["pause", "resume", "cancel", "retry"].includes(String(action))) throw new AutomationError("Choose a valid queue action.");
    const result = await withWorkspaceLock(workspaceId, "queue", async () => {
      const all = await listRecords<ScheduledPost>(workspaceId, "posts");
      const updated: ScheduledPost[] = [];
      for (const id of ids) {
        const post = all.find(p => p.id === id);
        if (!post) throw new AutomationError("Post not found.", 404);
        const allowed = action === "pause" ? ["SCHEDULED"] : action === "resume" ? ["PAUSED"] : action === "cancel" ? ["SCHEDULED", "PAUSED", "FAILED"] : ["FAILED"];
        if (!allowed.includes(post.status) || (action === "retry" && post.remotePostName)) continue;
        updated.push({ ...post, status: action === "pause" ? "PAUSED" : action === "cancel" ? "CANCELLED" : "SCHEDULED", lastError: undefined, updatedAt: new Date().toISOString() });
      }
      await putRecords(workspaceId, "posts", updated);
      await recordEvent(workspaceId, `${action}: ${updated.length} saved posts updated.`).catch(() => undefined);
      return { updated: updated.length };
    });
    return NextResponse.json(result);
  } catch (error) { return apiError(error); }
}
