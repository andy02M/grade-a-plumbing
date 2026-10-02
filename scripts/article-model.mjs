export async function modelJson(prompt, { maxOutputTokens = 2000, env = process.env, fetcher = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), allowFallback = true } = {}) {
  if (!env.GEMINI_API_KEY) throw new Error("Set GEMINI_API_KEY in GitHub Actions secrets.");
  const model = (env.GEMINI_MODEL || "gemini-3.8-flash").trim().replace(/^models\//, "");
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error("Invalid GEMINI_MODEL: use a model ID, not a URL.");
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
  response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method:"POST", headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},
    body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens}}),
    signal:AbortSignal.timeout(180000),
  });
  if (response.ok) break;
  let error; try { error = (await response.json()).error; } catch { /* Never log raw responses or request data. */ }
  const detail = String(error?.message ?? "No provider detail").split(env.GEMINI_API_KEY).join("[redacted]").replace(/AIza[\w-]+/g, "[redacted]").replace(/https?:\/\/\S+/g, "[URL redacted]").slice(0, 600);
  if (attempt < 2 && [429, 500, 502, 503, 504].includes(response.status)) { await sleep(5000 * (attempt + 1)); continue; }
  // Only the maintained default has an automatic, bounded availability fallback.
  // Explicit model choices, authentication, quota and billing failures never switch.
  if (allowFallback && !env.GEMINI_MODEL?.trim() && [404, 500, 502, 503, 504].includes(response.status)) {
    console.warn(`Gemini ${model} unavailable (HTTP ${response.status}); trying gemini-3.1-flash-lite once with bounded retries.`);
    return modelJson(prompt, {maxOutputTokens, env:{...env,GEMINI_MODEL:"gemini-3.1-flash-lite"},fetcher,sleep,allowFallback:false});
  }
  throw new Error(`Gemini HTTP ${response.status} (${model}): ${detail}`);
  }
  const result = await response.json();
  const candidate = result.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== "STOP") throw new Error(`Incomplete model response: ${candidate.finishReason}`);
  return JSON.parse(candidate?.content?.parts?.map(part=>part.text||"").join("") || "null");
}
