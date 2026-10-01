export async function modelJson(prompt, { maxOutputTokens = 2000, env = process.env, fetcher = fetch } = {}) {
  if (!env.GEMINI_API_KEY) throw new Error("Set GEMINI_API_KEY in GitHub Actions secrets.");
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method:"POST", headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},
    body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens}}),
    signal:AbortSignal.timeout(180000),
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}; check key, quota and model.`);
  const result = await response.json();
  const candidate = result.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== "STOP") throw new Error(`Incomplete model response: ${candidate.finishReason}`);
  return JSON.parse(candidate?.content?.parts?.map(part=>part.text||"").join("") || "null");
}
