import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLocationFromHost, isUnconfiguredLocationHost } from "./locations";
import { site } from "./site";

export async function getRequestLocation() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  // Unknown wildcard hosts are not real suburb pages. Keep configured hosts,
  // www, apex, local development and deployment previews unchanged.
  if (isUnconfiguredLocationHost(host)) notFound();
  const location = getLocationFromHost(host);
  if (/^(?:www\.)?gradeaplumbing\.store(?::\d+)?$/i.test(host ?? "")) {
    return { ...location, hostname: "gradeaplumbing.store", website: site.mainUrl };
  }
  return location;
}
