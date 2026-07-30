import { NextResponse } from "next/server";
import { fetchVapiMonoRecording, verifyRecordingAccessToken } from "@/lib/recordings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RecordingRouteContext = {
  params: Promise<{
    callId: string;
  }>;
};

export async function GET(request: Request, context: RecordingRouteContext) {
  const { callId } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const range = request.headers.get("range");

  if (!verifyRecordingAccessToken(callId, token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const recordingResponse = await fetchVapiMonoRecording(callId, range);

  if (!recordingResponse) {
    return NextResponse.json({ error: "Vapi private key is not configured." }, { status: 500 });
  }

  if (!recordingResponse.ok || !recordingResponse.body) {
    return NextResponse.json({ error: "Recording is not available yet." }, { status: recordingResponse.status || 404 });
  }

  return new Response(recordingResponse.body, {
    headers: buildRecordingHeaders(recordingResponse, callId),
    status: recordingResponse.status
  });
}

function buildRecordingHeaders(recordingResponse: Response, callId: string) {
  const headers = new Headers({
    "Accept-Ranges": recordingResponse.headers.get("accept-ranges") ?? "bytes",
    "Cache-Control": "private, no-store",
    "Content-Disposition": `inline; filename="${callId}-recording.wav"`,
    "Content-Type": normalizeAudioContentType(recordingResponse.headers.get("content-type"))
  });
  const passthroughHeaders = ["content-length", "content-range"];

  for (const headerName of passthroughHeaders) {
    const value = recordingResponse.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function normalizeAudioContentType(contentType: string | null) {
  if (!contentType || contentType === "application/octet-stream") {
    return "audio/wav";
  }

  return contentType;
}
