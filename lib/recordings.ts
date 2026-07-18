import { createHmac, timingSafeEqual } from "crypto";

const vapiApiBaseUrl = process.env.VAPI_API_BASE_URL ?? "https://api.vapi.ai";

export function createRecordingLink(baseUrl: string, callId: string) {
  const token = createRecordingAccessToken(callId);

  if (!token || !callId || callId === "Unknown") {
    return "";
  }

  const url = new URL(`/api/call-recording/${encodeURIComponent(callId)}`, baseUrl);
  url.searchParams.set("token", token);

  return url.toString();
}

export function verifyRecordingAccessToken(callId: string, token: string) {
  const expectedToken = createRecordingAccessToken(callId);

  if (!expectedToken || !token) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(token);

  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function fetchVapiMonoRecording(callId: string) {
  const privateKey = getVapiPrivateKey();

  if (!privateKey) {
    return null;
  }

  return fetch(`${vapiApiBaseUrl}/call/${encodeURIComponent(callId)}/mono-recording`, {
    headers: {
      Authorization: `Bearer ${privateKey}`
    },
    cache: "no-store",
    redirect: "follow"
  });
}

function createRecordingAccessToken(callId: string) {
  const secret = process.env.RECORDING_LINK_SECRET || process.env.CALL_WEBHOOK_SECRET || process.env.VAPI_PRIVATE_KEY || "";

  if (!secret || !callId || callId === "Unknown") {
    return "";
  }

  return createHmac("sha256", secret).update(callId).digest("base64url");
}

function getVapiPrivateKey() {
  return process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY || "";
}
