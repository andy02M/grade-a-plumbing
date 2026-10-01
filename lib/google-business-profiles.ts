import suppliedRegister from "@/data/google-business-register.json";

export type GoogleBusinessStatus = "Active" | "Pending" | "Suspended" | "Appeal Pending" | "Verification Required" | "Verification Submitted";
export type GoogleBusinessRecord = {
  name: string;
  locality: string;
  region: string;
  status: GoogleBusinessStatus;
  mapsUrl: string | null;
  locationSlug: string;
};
export type GoogleBusinessProfile = {
  name?: string;
  locality?: string;
  status: GoogleBusinessStatus;
  mapsUrl?: string;
  additionalProfiles?: GoogleBusinessRecord[];
};

// Supplied register, not a live Google verification result. Preserve every record.
export const googleBusinessRegister = suppliedRegister as GoogleBusinessRecord[];
export const googleBusinessProfiles: Record<string, GoogleBusinessProfile> = {};
for (const record of googleBusinessRegister) {
  const existing = googleBusinessProfiles[record.locationSlug];
  if (existing) {
    (existing.additionalProfiles ??= []).push(record);
    continue;
  }
  // The first Melbourne record remains primary; the second is retained separately.
  googleBusinessProfiles[record.locationSlug] = {
    name: record.name, locality: record.locality, status: record.status,
    ...(record.mapsUrl ? { mapsUrl: record.mapsUrl } : {}),
  };
}
export function publicMapsUrl(profile?: GoogleBusinessProfile) {
  return profile?.status === "Active" ? profile.mapsUrl : undefined;
}
