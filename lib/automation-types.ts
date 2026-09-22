export class AutomationError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export type PostContent = {
  summary: string;
  ctaType: "CALL" | "LEARN_MORE" | "BOOK" | "NONE";
  url?: string;
  imageUrl?: string;
};

export type PostTemplate = PostContent & { id: string; name: string; createdAt: string; updatedAt: string };

export type AutomationProfile = {
  transport?: "browser";
  browserUrl?: string;
  browserEmail?: string;
  id: string;
  googleAccountId: string;
  accountName: string;
  locationName: string;
  title: string;
  address?: string;
  city?: string;
  phone?: string;
  websiteUri?: string;
  status: string;
  canOperateLocalPost?: boolean;
  syncedAt?: string;
  accountLabel?: string;
  category?: string;
  description?: string;
  selected?: boolean;
  storefrontAddress?: { regionCode: string; addressLines?: string[]; locality?: string; administrativeArea?: string; postalCode?: string };
  metadata?: { mapsUri?: string; placeId?: string; duplicateLocation?: string; canOperateLocalPost?: boolean; hasVoiceOfMerchant?: boolean };
};

export type ScheduledPost = PostContent & {
  browserClaim?: string;
  id: string;
  batchId: string;
  templateId: string;
  profileId: string;
  profileTitle: string;
  googleAccountId: string;
  scheduledFor: string;
  timezone: string;
  status: "SCHEDULED" | "PAUSED" | "PUBLISHING" | "SUBMITTED" | "PUBLISHED" | "FAILED" | "NEEDS_REVIEW" | "CANCELLED";
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
  remotePostName?: string;
  remoteState?: string;
  searchUrl?: string;
};

export type AutomationEvent = { id: string; createdAt: string; level: "info" | "error"; message: string; postId?: string };

export function errorMessage(error: unknown) { return error instanceof Error ? error.message : "The operation could not be completed."; }
