import type { AutomationProfile } from "./automation-types";

export function profileIdentity(profile: AutomationProfile) {
  if (profile.metadata?.duplicateLocation) return `duplicate:${profile.metadata.duplicateLocation}`;
  if (profile.metadata?.placeId) return `place:${profile.metadata.placeId}`;
  if (profile.browserUrl) {
    try {
      const url = new URL(profile.browserUrl);
      const nativeId = url.pathname.match(/\/n\/([0-9]+)/)?.[1];
      const fid = url.searchParams.get("fid");
      if (nativeId) return `browser:${nativeId}${fid ? `:${fid}` : ""}`;
    } catch {}
  }
  return `location:${profile.locationName}`;
}

export function dedupeProfiles(profiles: AutomationProfile[]) {
  const seen = new Set<string>();
  return profiles.filter(profile => {
    const identity = profileIdentity(profile);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export function sameBusiness(a?: AutomationProfile, b?: AutomationProfile) {
  if (!a || !b) return false;
  return profileIdentity(a) === profileIdentity(b);
}
