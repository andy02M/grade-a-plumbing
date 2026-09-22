import { getPostForProfile, publishPostForProfile } from "./automation-google";
import { listRecords, putRecord, recordEvent, withWorkspaceLock } from "./automation-store";
import { type AutomationProfile, type ScheduledPost, errorMessage } from "./automation-types";

function remoteStatus(state: string): ScheduledPost["status"] {
  return state === "LIVE" ? "PUBLISHED" : state === "REJECTED" ? "FAILED" : "SUBMITTED";
}

export async function runWorkspaceQueue(workspaceId: string, options: { postIds?: string[]; deadline?: number } = {}) {
  const deadline = options.deadline || Date.now() + 40000;
  return withWorkspaceLock(workspaceId, "queue", async () => {
    const now = new Date().toISOString();
    const all = await listRecords<ScheduledPost>(workspaceId, "posts");
    const profiles = await listRecords<AutomationProfile>(workspaceId, "profiles");
    const due = all.filter(post => profiles.find(profile => profile.id === post.profileId)?.transport !== "browser" && (!options.postIds || options.postIds.includes(post.id)) && (
      (post.status === "SCHEDULED" && post.scheduledFor <= now) || post.status === "SUBMITTED" || post.status === "PUBLISHING"
    )).sort((a,b) => a.scheduledFor.localeCompare(b.scheduledFor));
    const counts = { processed: 0, published: 0, submitted: 0, failed: 0, needsReview: 0, remaining: due.length };
    let cursor = 0;
    async function work() {
      while (cursor < due.length && Date.now() < deadline) {
        const post = due[cursor++];
        const profile = profiles.find(p => p.id === post.profileId);
        const updated: ScheduledPost = { ...post, updatedAt: new Date().toISOString() };
        try {
          if (post.status === "PUBLISHING") {
            updated.status = "NEEDS_REVIEW";
            updated.lastError = "The previous publishing attempt did not finish recording its result. Check this profile on Google before creating another post.";
          } else if (!profile) {
            updated.status = "FAILED";
            updated.lastError = "The target profile is unavailable. Sync its Google account.";
          } else if (post.remotePostName) {
            const remote = await getPostForProfile(workspaceId, profile, post.remotePostName);
            updated.status = remoteStatus(remote.state);
            updated.remoteState = remote.state;
            updated.lastError = remote.state === "REJECTED" ? "Google rejected this post. Review the content in your Business Profile." : undefined;
          } else {
            if (profile.canOperateLocalPost === false) throw new Error("Google reports this profile cannot currently publish posts.");
            updated.status = "PUBLISHING";
            updated.attempts++;
            await putRecord(workspaceId, "posts", post.id, updated);
            const remote = await publishPostForProfile(workspaceId, profile, post);
            updated.remotePostName = remote.name;
            updated.remoteState = remote.state;
            updated.searchUrl = remote.searchUrl;
            updated.status = remoteStatus(remote.state);
            updated.lastError = remote.state === "REJECTED" ? "Google rejected this post. Review the content in your Business Profile." : undefined;
          }
        } catch (error) {
          if (post.remotePostName) {
            updated.status = "SUBMITTED";
            updated.lastError = `Could not refresh Google status: ${errorMessage(error)}`;
          } else {
            const uncertain = error && typeof error === "object" && "unknownOutcome" in error && error.unknownOutcome;
            updated.status = uncertain ? "NEEDS_REVIEW" : "FAILED";
            updated.lastError = errorMessage(error);
          }
        }
        // A failed durable write leaves PUBLISHING in storage, preventing automatic re-publication.
        await putRecord(workspaceId, "posts", post.id, updated);
        counts.processed++;
        counts.remaining--;
        if (updated.status === "PUBLISHED") counts.published++;
        if (updated.status === "SUBMITTED") counts.submitted++;
        if (updated.status === "FAILED") counts.failed++;
        if (updated.status === "NEEDS_REVIEW") counts.needsReview++;
        if (post.status !== updated.status) await recordEvent(workspaceId, `${post.profileTitle}: ${updated.status.toLowerCase().replaceAll("_", " ")}${updated.lastError ? `. ${updated.lastError}` : ""}`, updated.lastError ? "error" : "info", post.id).catch(() => undefined);
      }
    }
    const outcomes = await Promise.allSettled([work(), work(), work()]);
    const failure = outcomes.find(result => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
    await putRecord(workspaceId, "settings", "worker", { lastRunAt: new Date().toISOString(), ...counts });
    return counts;
  });
}
