import crypto from "node:crypto";
import { accountsWithClient, createLocationWithClient, googleClient, locationsWithClient, profileFromLocation, type GoogleBusinessAccount } from "./automation-google";
import { getConnectedGoogleAccount } from "./google-account-db-store";
import { getRecord, listRecords, putRecord, putRecords, recordEvent, withWorkspaceLock } from "./automation-store";
import { AutomationError, errorMessage, type AutomationProfile } from "./automation-types";
import { requiredText } from "./automation-content";

export type ProfileSettings = {
  title: string; categoryName: string; categoryLabel: string; phone: string; websiteUri: string; description: string;
  businessType: "STOREFRONT" | "SERVICE_AREA" | "HYBRID"; regionCode: string; addressLine: string; city: string; state: string; postalCode: string;
  serviceAreas: Array<{ placeName: string; placeId: string }>;
  days: string[]; opens: string; closes: string; allDay: boolean;
  verificationAddress?: { addressLine: string; city: string; state: string; postalCode: string };
  chatEnabled?: boolean; chatPhone?: string; services?: string[]; customServices?: string[]; openingDate?: string;
  attributes?: Record<string, boolean>; shopFrontPhoto?: string; workPhotos?: string[];
};
export type ProfileDraft = {
  id: string; googleAccountId: string; accountName: string; settings: ProfileSettings; requestId: string;
  status: "DRAFT" | "VALIDATED" | "CREATING" | "CREATED" | "NEEDS_REVIEW";
  createdAt: string; updatedAt: string; validatedAt?: string; remoteName?: string; lastError?: string;
};

export async function syncProfiles(workspaceId: string, googleAccountId: string) {
  return withWorkspaceLock(workspaceId, `sync:${googleAccountId}`, async () => {
    const client = await googleClient(workspaceId, googleAccountId);
    const accounts = await accountsWithClient(client);
    const profiles: AutomationProfile[] = [];
    for (const account of accounts) {
      const locations = await locationsWithClient(client, account.name);
      for (const location of locations) {
        const profile = profileFromLocation(googleAccountId, account, location);
        if (!profiles.some(p => p.locationName === profile.locationName)) profiles.push(profile);
      }
    }
    const old = await listRecords<AutomationProfile>(workspaceId, "profiles");
    const stale = old.filter(p => p.googleAccountId === googleAccountId && !profiles.some(next => next.id === p.id)).map(p => ({ ...p, status: "UNAVAILABLE", canOperateLocalPost: false }));
    await putRecords(workspaceId, "profiles", [...profiles, ...stale]);
    await putRecord(workspaceId, "settings", `sync:${googleAccountId}`, { at: new Date().toISOString(), profiles: profiles.length });
    await recordEvent(workspaceId, `Synced ${profiles.length} business profiles from ${accounts.length} business accounts.`).catch(() => undefined);
    return { profiles, businessAccounts: accounts };
  });
}

export function normalizeSettings(input: unknown): ProfileSettings {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new AutomationError("Enter profile settings.");
  const value = input as Record<string, unknown>;
  const text = (key: string, max = 300) => { const t = value[key] ?? ""; if (typeof t !== "string" || t.length > max) throw new AutomationError(`Invalid ${key}.`); return t.trim(); };
  const areas = value.serviceAreas ?? [];
  if (!Array.isArray(areas) || areas.length > 20) throw new AutomationError("Enter up to 20 service areas.");
  const days = value.days ?? [];
  const validDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  if (!Array.isArray(days) || days.some(day => !validDays.includes(day))) throw new AutomationError("Choose valid opening days.");
  if (!["STOREFRONT", "SERVICE_AREA", "HYBRID"].includes(String(value.businessType))) throw new AutomationError("Choose the business type.");
  return {
    title: text("title"), categoryName: text("categoryName"), categoryLabel: text("categoryLabel"), phone: text("phone", 40), websiteUri: text("websiteUri", 2048), description: text("description", 750),
    businessType: value.businessType as ProfileSettings["businessType"], regionCode: text("regionCode", 2).toUpperCase(), addressLine: text("addressLine"), city: text("city"), state: text("state"), postalCode: text("postalCode", 30),
    serviceAreas: areas.map(area => { if (!area || typeof area !== "object" || typeof area.placeName !== "string" || typeof area.placeId !== "string" || area.placeName.length > 200 || area.placeId.length > 200) throw new AutomationError("Enter a valid service area name and Google place ID."); return { placeName: area.placeName.trim(), placeId: area.placeId.trim() }; }),
    days: [...new Set(days)] as string[], opens: text("opens", 5), closes: text("closes", 5), allDay: value.allDay === true,
    verificationAddress: value.verificationAddress && typeof value.verificationAddress === "object" ? {addressLine:String((value.verificationAddress as Record<string,unknown>).addressLine||"").slice(0,300),city:String((value.verificationAddress as Record<string,unknown>).city||"").slice(0,200),state:String((value.verificationAddress as Record<string,unknown>).state||"").slice(0,100),postalCode:String((value.verificationAddress as Record<string,unknown>).postalCode||"").slice(0,30)} : undefined,
    chatEnabled:value.chatEnabled===true,chatPhone:typeof value.chatPhone==="string"?value.chatPhone.slice(0,40):"",services:Array.isArray(value.services)?value.services.filter((v):v is string=>typeof v==="string").slice(0,100):[],customServices:Array.isArray(value.customServices)?value.customServices.filter((v):v is string=>typeof v==="string").slice(0,100):[],openingDate:typeof value.openingDate==="string"?value.openingDate.slice(0,10):"",attributes:value.attributes&&typeof value.attributes==="object"?Object.fromEntries(Object.entries(value.attributes as Record<string,unknown>).slice(0,100).map(([k,v])=>[k.slice(0,100),v===true])):{},shopFrontPhoto:typeof value.shopFrontPhoto==="string"?value.shopFrontPhoto.slice(0,1000):"",workPhotos:Array.isArray(value.workPhotos)?value.workPhotos.filter((v):v is string=>typeof v==="string").slice(0,200):[]
  };
}

export function locationPayload(settings: ProfileSettings) {
  const title = requiredText(settings.title, "Business name", 300);
  if (!/^categories\/[A-Za-z0-9_:-]+$/.test(settings.categoryName)) throw new AutomationError("Search and select a Google business category.");
  if (!/^[A-Z]{2}$/.test(settings.regionCode)) throw new AutomationError("Enter a two-letter country code.");
  if (!settings.description) throw new AutomationError("Add the business description.");
  if (settings.websiteUri) { try { const u = new URL(settings.websiteUri); if (!["http:", "https:"].includes(u.protocol) || u.username || u.password) throw new Error(); } catch { throw new AutomationError("Enter a valid business website URL."); } }
  if (settings.phone && !/^\+?[\d ()-]{6,40}$/.test(settings.phone)) throw new AutomationError("Enter a valid business phone number.");
  const storefront = settings.businessType !== "SERVICE_AREA";
  if (storefront && (!settings.addressLine || !settings.city)) throw new AutomationError("Enter the actual storefront address and city.");
  if (settings.businessType !== "STOREFRONT" && (!settings.serviceAreas.length || settings.serviceAreas.some(area => !area.placeName || !/^[A-Za-z0-9_-]+$/.test(area.placeId)))) throw new AutomationError("Service-area businesses need service areas with valid Google place IDs.");
  const regularHours = settings.days.length ? { periods: settings.days.map(day => {
    if (!settings.allDay && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.opens) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.closes) || settings.closes <= settings.opens)) throw new AutomationError("Choose closing hours after opening hours, or use Open 24 hours.");
    const time = (value: string) => ({ hours: Number(value.slice(0,2)), minutes: Number(value.slice(3,5)) });
    return { openDay: day, closeDay: day, openTime: settings.allDay ? { hours: 0, minutes: 0 } : time(settings.opens), closeTime: settings.allDay ? { hours: 24, minutes: 0 } : time(settings.closes) };
  }) } : undefined;
  return {
    title, languageCode: "en", categories: { primaryCategory: { name: settings.categoryName } }, profile: { description: settings.description },
    ...(settings.phone ? { phoneNumbers: { primaryPhone: settings.phone } } : {}), ...(settings.websiteUri ? { websiteUri: settings.websiteUri } : {}),
    ...(storefront ? { storefrontAddress: { regionCode: settings.regionCode, addressLines: [settings.addressLine], locality: settings.city, administrativeArea: settings.state, postalCode: settings.postalCode } } : {}),
    ...(settings.businessType !== "STOREFRONT" ? { serviceArea: { businessType: settings.businessType === "HYBRID" ? "CUSTOMER_AND_BUSINESS_LOCATION" : "CUSTOMER_LOCATION_ONLY", regionCode: settings.regionCode, places: { placeInfos: settings.serviceAreas } } } : {}),
    ...(regularHours ? { regularHours } : {})
  };
}

export async function saveProfileDraft(workspaceId: string, body: Record<string, unknown>) {
  const id = body.id ? requiredText(body.id, "Draft ID", 100) : crypto.randomUUID();
  return withWorkspaceLock(workspaceId, `draft:${id}`, async () => {
    const existing = await getRecord<ProfileDraft>(workspaceId, "profile-drafts", id);
    if (body.id && !existing) throw new AutomationError("Draft not found.", 404);
    if (existing && ["CREATING", "CREATED", "NEEDS_REVIEW"].includes(existing.status)) throw new AutomationError("This draft was already submitted. Duplicate its settings to prepare another profile.", 409);
    const googleAccountId = requiredText(body.googleAccountId, "Google account", 200);
    if (!await getConnectedGoogleAccount(googleAccountId, workspaceId)) throw new AutomationError("Choose an account connected to this workspace.", 404);
    const accountName = typeof body.accountName === "string" ? body.accountName.slice(0,200) : "";
    const now = new Date().toISOString();
    const draft: ProfileDraft = { id, googleAccountId, accountName, settings: normalizeSettings(body.settings), requestId: crypto.randomUUID(), status: "DRAFT", createdAt: existing?.createdAt || now, updatedAt: now };
    await putRecord(workspaceId, "profile-drafts", id, draft);
    return draft;
  });
}

export async function actOnProfileDraft(workspaceId: string, id: string, action: "validate" | "create") {
  return withWorkspaceLock(workspaceId, `draft:${id}`, async () => {
    const draft = await getRecord<ProfileDraft>(workspaceId, "profile-drafts", id);
    if (!draft) throw new AutomationError("Draft not found.", 404);
    if (draft.status === "CREATED") return draft;
    if (["CREATING", "NEEDS_REVIEW"].includes(draft.status)) throw new AutomationError("The previous submission needs review in Google Business Profile before another creation attempt.", 409);
    if (action === "create" && draft.status !== "VALIDATED") throw new AutomationError("Validate the saved settings with Google before creating the profile.");
    const location = locationPayload(draft.settings);
    const client = await googleClient(workspaceId, draft.googleAccountId);
    const accounts = await accountsWithClient(client);
    const parent = accounts.find(account => account.name === draft.accountName);
    if (!parent) throw new AutomationError("The selected business account is not available on this Gmail account.", 403);
    const existing = await locationsWithClient(client, draft.accountName);
    if (existing.some(item => item.title?.trim().toLowerCase() === draft.settings.title.toLowerCase() && (draft.settings.businessType === "SERVICE_AREA" || item.storefrontAddress?.addressLines?.join(", ").toLowerCase() === draft.settings.addressLine.toLowerCase()))) throw new AutomationError("A matching business profile already exists on this account. Sync and use it instead of creating a duplicate.", 409);
    let submitted = false;
    try {
      if (action === "create") { draft.status = "CREATING"; await putRecord(workspaceId, "profile-drafts", id, draft); submitted = true; }
      const result = await createLocationWithClient(client, draft.accountName, location, action === "validate" ? crypto.randomUUID() : draft.requestId, action === "validate");
      if (action === "create" && !result.name) throw Object.assign(new Error("Google returned no profile ID. Check Google before trying again."), { unknownOutcome: true });
      const now = new Date().toISOString();
      draft.status = action === "validate" ? "VALIDATED" : "CREATED";
      draft.updatedAt = now; draft.lastError = undefined;
      if (action === "validate") draft.validatedAt = now;
      else draft.remoteName = result.name;
      await putRecord(workspaceId, "profile-drafts", id, draft);
      if (action === "create") {
        const profile = profileFromLocation(draft.googleAccountId, parent, { ...location, ...result, categories: result.categories || { primaryCategory: { name: draft.settings.categoryName, displayName: draft.settings.categoryLabel } } });
        await putRecord(workspaceId, "profiles", profile.id, profile);
      }
      await recordEvent(workspaceId, `${draft.settings.title}: ${action === "validate" ? "settings validated by Google" : "profile created; check Google for verification requirements"}.`).catch(() => undefined);
      return draft;
    } catch (error) {
      const uncertain = submitted && (draft.remoteName || (error && typeof error === "object" && "unknownOutcome" in error && error.unknownOutcome));
      draft.status = uncertain ? "NEEDS_REVIEW" : "DRAFT"; draft.lastError = errorMessage(error); draft.updatedAt = new Date().toISOString();
      await putRecord(workspaceId, "profile-drafts", id, draft);
      throw error;
    }
  });
}
