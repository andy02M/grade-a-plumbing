import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLocationFromHost, isUnconfiguredLocationHost } from "./locations";

export async function getRequestLocation() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  // Unknown wildcard hosts are not real suburb pages. Keep configured hosts,
  // www, apex, local development and deployment previews unchanged.
  if (isUnconfiguredLocationHost(host)) notFound();
  return getLocationFromHost(host);
}
