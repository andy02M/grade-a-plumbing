import crypto from "node:crypto";
import { decryptToken, getConnectedGoogleAccount, markAccountNeedsReauth } from "./google-account-db-store";
import { AutomationError, type AutomationProfile, type PostContent } from "./automation-types";

const ACCOUNT_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const INFORMATION_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const POSTS_API = "https://mybusiness.googleapis.com/v4";
const GOOGLE_HOSTS = new Set(["mybusinessaccountmanagement.googleapis.com", "mybusinessbusinessinformation.googleapis.com", "mybusiness.googleapis.com"]);

export type GoogleBusinessAccount = { name: string; accountName: string; type?: string; role?: string };
export type GoogleCategory = { name: string; displayName: string };
export type GoogleLocation = {
  name?: string;
  title?: string;
  languageCode?: string;
  storefrontAddress?: AutomationProfile["storefrontAddress"];
  phoneNumbers?: { primaryPhone?: string };
  websiteUri?: string;
  categories?: { primaryCategory?: GoogleCategory };
  metadata?: AutomationProfile["metadata"];
  profile?: { description?: string };
  serviceArea?: { places?: { placeInfos?: Array<{ placeName: string; placeId: string }> } };
};

export class GoogleApiError extends AutomationError {
  public unknownOutcome: boolean;
  constructor(message: string, status: number, public code: string, public ambiguous = false) {
    super(message, status);
    this.name = "GoogleApiError";
    this.unknownOutcome = ambiguous;
  }
}

type GoogleErrorBody = { error?: { message?: string; status?: string; details?: Array<{ reason?: string; fieldViolations?: Array<{ field?: string; description?: string }> }> } };

function apiError(status: number, data: GoogleErrorBody, operation: string) {
  const reason = data.error?.details?.map(item => item.reason || "").join(" ") || "";
  const detail = (data.error?.message || "").replace(/Bearer\s+\S+/gi, "[redacted]").slice(0, 900);
  const fields = data.error?.details?.flatMap(item => item.fieldViolations || [])
    .map(item => `${item.field}: ${item.description}`).join("; ").slice(0, 900);
  if (status === 401) return new GoogleApiError("Google authorization has expired. Reconnect this Gmail account, then retry.", 401, "NEEDS_REAUTH");
  if (status === 403 && /SERVICE_DISABLED|ACCESS_NOT_CONFIGURED|has not been used|is disabled/i.test(`${reason} ${detail}`)) {
    return new GoogleApiError(`Google Business API access is not enabled for this app. Enable the API named by Google and complete any required Business Profile API access approval. ${detail}`, 403, "API_NOT_ENABLED");
  }
  if (status === 403) return new GoogleApiError(`Google did not allow ${operation}. Check that this Gmail manages the selected business account and that the app has Business Profile API approval and business.manage permission. ${detail}`, 403, "GOOGLE_ACCESS_DENIED");
  if (status === 429) return new GoogleApiError(`Google's API quota was exceeded. Retry later; a quota of zero can mean Business Profile API access has not been approved. ${detail}`, 429, "GOOGLE_QUOTA");
  if (status === 404) return new GoogleApiError(`Google could not find the selected business profile or account. Sync profiles again. ${detail}`, 404, "GOOGLE_NOT_FOUND");
  return new GoogleApiError(`Google could not complete ${operation}. ${fields || detail || `HTTP ${status}`}`, status >= 500 ? 502 : 400, data.error?.status || "GOOGLE_REQUEST_FAILED", status >= 500);
}

export function assertGoogleAccountName(value: string) {
  if (!/^accounts\/[A-Za-z0-9_-]+$/.test(value)) throw new AutomationError("Choose a valid Google Business account.");
}

export function assertGoogleLocationName(value: string) {
  if (!/^locations\/[A-Za-z0-9_-]+$/.test(value)) throw new AutomationError("The profile is missing a valid Google location ID. Sync profiles again.");
}

export async function googleClient(workspaceId: string, googleAccountId: string) {
  if (!googleAccountId || googleAccountId.length > 200) throw new AutomationError("Choose a connected Gmail account.");
  const account = await getConnectedGoogleAccount(googleAccountId, workspaceId);
  if (!account || account.status === "REVOKED") throw new AutomationError("This Gmail account is not connected to your workspace.", 404);
  if (account.status !== "CONNECTED") throw new GoogleApiError("Reconnect this Gmail account before continuing.", 401, "NEEDS_REAUTH");
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_GBP_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_GBP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new AutomationError("Google account connection is not configured on the server.", 503);
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", refresh_token: decryptToken(account.encryptedRefreshToken) })
    });
  } catch {
    throw new GoogleApiError("Could not reach Google to refresh authorization. Please retry.", 502, "GOOGLE_UNAVAILABLE");
  }
  const token = await tokenResponse.json().catch(() => ({})) as { access_token?: string; error?: string };
  if (!tokenResponse.ok || !token.access_token) {
    if (token.error === "invalid_grant") {
      await markAccountNeedsReauth(account.id, workspaceId);
      throw new GoogleApiError("Google authorization expired or was revoked. Reconnect this Gmail account. Accounts connected while the Google app is in testing can expire after seven days.", 401, "NEEDS_REAUTH");
    }
    if (token.error === "invalid_client") throw new GoogleApiError("Google rejected this app's OAuth credentials. The app administrator must check the Google client ID and secret.", 503, "OAUTH_CONFIGURATION");
    throw new GoogleApiError("Google could not refresh this account's authorization. Please retry or reconnect the account.", 502, "GOOGLE_UNAVAILABLE");
  }
  return {
    accountId: account.id,
    async request<T>(url: string, operation: string, init?: RequestInit): Promise<T> {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || !GOOGLE_HOSTS.has(parsed.hostname)) throw new AutomationError("Invalid Google API destination.");
      let response: Response;
      try {
        response = await fetch(url, {
          ...init, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(25000),
          headers: { "Content-Type": "application/json", "X-GOOG-API-FORMAT-VERSION": "2", ...init?.headers, Authorization: `Bearer ${token.access_token}` }
        });
      } catch {
        throw new GoogleApiError(`Google did not return a response for ${operation}.`, 502, "GOOGLE_TIMEOUT", init?.method === "POST");
      }
      const result = await response.json().catch(() => null) as T | GoogleErrorBody | null;
      if (!response.ok) {
        if (response.status === 401) await markAccountNeedsReauth(account.id, workspaceId);
        throw apiError(response.status, (result || {}) as GoogleErrorBody, operation);
      }
      if (result === null) throw new GoogleApiError(`Google returned an unreadable response for ${operation}.`, 502, "GOOGLE_INVALID_RESPONSE", init?.method === "POST");
      return result as T;
    }
  };
}

export type GoogleClient = Awaited<ReturnType<typeof googleClient>>;

export async function accountsWithClient(client: GoogleClient): Promise<GoogleBusinessAccount[]> {
  const accounts: GoogleBusinessAccount[] = [];
  const seen = new Set<string>();
  const tokens = new Set<string>();
  let pageToken = "";
  do {
    const params = new URLSearchParams({ pageSize: "20", ...(pageToken ? { pageToken } : {}) });
    const page = await client.request<{ accounts?: GoogleBusinessAccount[]; nextPageToken?: string }>(`${ACCOUNT_API}/accounts?${params}`, "listing business accounts");
    for (const account of page.accounts || []) {
      assertGoogleAccountName(account.name);
      if (!seen.has(account.name)) { accounts.push(account); seen.add(account.name); }
    }
    if (page.nextPageToken && tokens.has(page.nextPageToken)) throw new GoogleApiError("Google returned the same account page twice. Retry the sync.", 502, "GOOGLE_PAGINATION");
    pageToken = page.nextPageToken || "";
    tokens.add(pageToken);
  } while (pageToken);
  return accounts;
}

export async function listBusinessAccounts(workspaceId: string, googleAccountId: string) {
  return accountsWithClient(await googleClient(workspaceId, googleAccountId));
}

export async function locationsWithClient(client: GoogleClient, accountName: string) {
  assertGoogleAccountName(accountName);
  const locations: GoogleLocation[] = [];
  const tokens = new Set<string>();
  let pageToken = "";
  do {
    const params = new URLSearchParams({ pageSize: "100", readMask: "name,title,storefrontAddress,phoneNumbers,websiteUri,categories,metadata,profile,serviceArea", ...(pageToken ? { pageToken } : {}) });
    const page = await client.request<{ locations?: GoogleLocation[]; nextPageToken?: string }>(`${INFORMATION_API}/${accountName}/locations?${params}`, "listing business profiles");
    locations.push(...(page.locations || []));
    if (page.nextPageToken && tokens.has(page.nextPageToken)) throw new GoogleApiError("Google returned the same profile page twice. Retry the sync.", 502, "GOOGLE_PAGINATION");
    pageToken = page.nextPageToken || "";
    tokens.add(pageToken);
  } while (pageToken);
  return locations;
}

export function profileFromLocation(googleAccountId: string, account: GoogleBusinessAccount, location: GoogleLocation): AutomationProfile {
  assertGoogleLocationName(location.name || "");
  const address = location.storefrontAddress;
  return {
    id: crypto.createHash("sha256").update(`${googleAccountId}:${location.name}`).digest("hex").slice(0, 32),
    googleAccountId, accountName: account.name, accountLabel: account.accountName,
    locationName: location.name!, title: location.title || "Untitled business",
    ...(address ? { storefrontAddress: address, address: [...address.addressLines || [], address.locality, address.administrativeArea, address.postalCode, address.regionCode].filter(Boolean).join(", "), city: address.locality } : {}),
    phone: location.phoneNumbers?.primaryPhone, websiteUri: location.websiteUri,
    category: location.categories?.primaryCategory?.displayName, description: location.profile?.description,
    // Listing access or posting eligibility is not proof of Google verification.
    status: "UNKNOWN", canOperateLocalPost: location.metadata?.canOperateLocalPost,
    metadata: location.metadata, syncedAt: new Date().toISOString(), selected: true
  };
}

export async function searchBusinessCategories(workspaceId: string, googleAccountId: string, query: string, regionCode = "AU", languageCode = "en", pageToken?: string) {
  if (!/^[A-Z]{2}$/.test(regionCode) || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(languageCode)) throw new AutomationError("Choose a valid country and language.");
  if (query.length > 80 || /[\r\n=]/.test(query)) throw new AutomationError("Use a short category name such as Plumber.");
  const params = new URLSearchParams({ regionCode, languageCode, view: "BASIC", pageSize: "100", ...(query.trim() ? { filter: `displayName=${query.trim()}` } : {}), ...(pageToken ? { pageToken } : {}) });
  return (await googleClient(workspaceId, googleAccountId)).request<{ categories?: GoogleCategory[]; nextPageToken?: string }>(`${INFORMATION_API}/categories?${params}`, "searching business categories");
}

export async function createLocationWithClient(client: GoogleClient, accountName: string, location: object, requestId: string, validateOnly: boolean) {
  assertGoogleAccountName(accountName);
  const params = new URLSearchParams({ requestId, validateOnly: String(validateOnly) });
  return client.request<GoogleLocation>(`${INFORMATION_API}/${accountName}/locations?${params}`, validateOnly ? "validating the profile" : "creating the profile", { method: "POST", body: JSON.stringify(location) });
}

export async function publishPostForProfile(workspaceId: string, profile: AutomationProfile, content: PostContent) {
  assertGoogleAccountName(profile.accountName);
  assertGoogleLocationName(profile.locationName);
  if (profile.status === "UNAVAILABLE") throw new AutomationError("This profile is no longer available. Sync the account before posting.", 409);
  if (profile.canOperateLocalPost === false) throw new AutomationError("Google says this profile cannot manage posts. Check the profile in Google Business Profile.", 409);
  const body = {
    languageCode: "en", topicType: "STANDARD", summary: content.summary,
    ...(content.ctaType === "NONE" ? {} : { callToAction: { actionType: content.ctaType, ...(content.ctaType === "CALL" ? {} : { url: content.url }) } }),
    ...(content.imageUrl ? { media: [{ mediaFormat: "PHOTO", sourceUrl: content.imageUrl }] } : {})
  };
  const result = await (await googleClient(workspaceId, profile.googleAccountId)).request<{ name?: string; state?: string; searchUrl?: string }>(`${POSTS_API}/${profile.accountName}/${profile.locationName}/localPosts`, "publishing the post", { method: "POST", body: JSON.stringify(body) });
  if (!result.name) throw new GoogleApiError("Google returned no post ID. Check the business profile before retrying to avoid a duplicate post.", 502, "GOOGLE_UNCONFIRMED", true);
  return { name: result.name, state: result.state || "PROCESSING", ...(result.searchUrl ? { searchUrl: result.searchUrl } : {}) };
}

export async function getPostForProfile(workspaceId: string, profile: AutomationProfile, remotePostName: string) {
  assertGoogleAccountName(profile.accountName);
  assertGoogleLocationName(profile.locationName);
  const prefix = `${profile.accountName}/${profile.locationName}/localPosts/`;
  if (!remotePostName.startsWith(prefix) || !/^[A-Za-z0-9_-]+$/.test(remotePostName.slice(prefix.length))) throw new AutomationError("The saved Google post ID does not match this profile.");
  const result = await (await googleClient(workspaceId, profile.googleAccountId)).request<{ name?: string; state?: string; searchUrl?: string }>(`${POSTS_API}/${remotePostName}`, "checking the post status");
  return { name: result.name || remotePostName, state: result.state || "PROCESSING", ...(result.searchUrl ? { searchUrl: result.searchUrl } : {}) };
}
