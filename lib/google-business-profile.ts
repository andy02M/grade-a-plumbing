import type { GmbPost } from "@/lib/gmb-posts";

type GoogleTokenResponse = { access_token?: string; error?: string; error_description?: string };
type GoogleLocalPost = { name?: string; state?: string };

export function hasGoogleBusinessProfileConfig() {
  return Boolean(
    process.env.GOOGLE_GBP_CLIENT_ID && process.env.GOOGLE_GBP_CLIENT_SECRET &&
    process.env.GOOGLE_GBP_REFRESH_TOKEN && process.env.GOOGLE_GBP_ACCOUNT_ID &&
    process.env.GOOGLE_GBP_LOCATION_ID
  );
}

export async function publishGoogleBusinessProfilePost(post: GmbPost) {
  const accessToken = await getAccessToken();
  const accountId = requiredEnv("GOOGLE_GBP_ACCOUNT_ID");
  const locationId = requiredEnv("GOOGLE_GBP_LOCATION_ID");
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(accountId)}/locations/${encodeURIComponent(locationId)}/localPosts`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-GOOG-API-FORMAT-VERSION": "2" },
      body: JSON.stringify({ callToAction: post.callToAction, languageCode: "en-AU", summary: post.summary, topicType: post.topicType }),
      cache: "no-store"
    }
  );
  const result = (await response.json()) as GoogleLocalPost & { error?: unknown };

  if (!response.ok) throw new Error(`Google Business Profile rejected the post: ${JSON.stringify(result.error ?? result)}`);
  if (!result.name) throw new Error("Google Business Profile did not return a post ID.");

  return { name: result.name, state: result.state ?? "PROCESSING" };
}

async function getAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requiredEnv("GOOGLE_GBP_CLIENT_ID"),
      client_secret: requiredEnv("GOOGLE_GBP_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: requiredEnv("GOOGLE_GBP_REFRESH_TOKEN")
    }),
    cache: "no-store"
  });
  const result = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !result.access_token) {
    throw new Error(`Google OAuth token refresh failed: ${result.error_description ?? result.error ?? response.statusText}`);
  }

  return result.access_token;
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
