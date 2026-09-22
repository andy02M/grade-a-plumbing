import { headers } from "next/headers";
import { getLocationFromHost } from "./locations";

export async function getRequestLocation() {
  const requestHeaders = await headers();
  return getLocationFromHost(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  );
}
