import { createHash } from "node:crypto";

export const serviceSlugs = ["blocked-drains", "sewer-repairs", "pipe-relining", "hot-water", "emergency-plumber", "burst-pipe-repair", "gas-plumbing", "commercial-plumbing"];
export const editorialHost = "https://melbourne.gradeaplumbing.store";
export class QualityHold extends Error {}
export const sourceCatalog = [
  { id: "storm-help", title: "VICSES: when to call for emergency assistance", url: "https://www.ses.vic.gov.au/when-to-call", pattern: /ceiling|leak|burst|storm|flood|emergency|urgent/i },
  { id: "water-electrical-safety", title: "Victorian Government: power safety and emergency contacts", url: "https://www.energy.vic.gov.au/about-energy/safety/power-safety-and-emergency-contacts", pattern: /ceiling|leak|burst|storm|flood|electric|emergency/i },
  { id: "storm-flood-building", title: "Building and Plumbing Commission: storm and flood safety", url: "https://www.bpc.vic.gov.au/resource-hub/safety-guides/storm-and-flood-information", pattern: /ceiling|leak|burst|storm|flood/i },
  { id: "quotes", title: "Consumer Affairs Victoria: getting quotes", url: "https://www.consumer.vic.gov.au/housing/building-and-renovating/plan-and-manage-your-building-project/getting-quotes", pattern: null },
  { id: "practitioners", title: "Consumer Affairs Victoria: builders and tradespeople", url: "https://www.consumer.vic.gov.au/housing/building-and-renovating/plan-and-manage-your-building-project/about-builders-tradespeople-and-other-building-practitioners", pattern: null },
  { id: "bpc", title: "Building and Plumbing Commission: engaging a plumber", url: "https://www.bpc.vic.gov.au/home-owners/before-you-start-building/engaging-a-plumber", pattern: /plumber|licen|register|qualif|certificate/i },
  { id: "drains", title: "South East Water: blockage responsibilities and prevention", url: "https://southeastwater.com.au/faults-and-works/maintenance/blockages/", pattern: /drain|sewer|toilet|relin|block|root|cctv/i },
  { id: "sewers", title: "Greater Western Water: fixing a blocked sewer", url: "https://www.gww.com.au/faults-works/helpful-advice/fixing-blocked-sewer", pattern: /drain|sewer|toilet|relin|block|root|cctv/i },
  { id: "hot-water", title: "Australian Government: hot water system selection", url: "https://www.energy.gov.au/households/hot-water-systems", pattern: /hot water|heater|heat pump/i },
  { id: "gas", title: "Energy Safe Victoria: gas emergencies", url: "https://www.energysafe.vic.gov.au/community-safety/emergencies/gas-emergencies", pattern: /gas|carbon monoxide/i },
  { id: "rentals", title: "Consumer Affairs Victoria: repairs in rental properties", url: "https://www.consumer.vic.gov.au/housing/renting/repairs-alterations-safety-and-pets/repairs/repairs-in-rental-properties", pattern: /rent|tenant|apartment|ceiling|leak|burst/i },
];

export function decodeHtml(text) {
  return text.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => {
    const value = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
    return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : " ";
  }).replace(/&(?:amp|quot|apos|lt|gt|nbsp|ndash|mdash|rsquo|lsquo|ldquo|rdquo);/g, token => ({"&amp;":"&","&quot;":'"',"&apos;":"'","&lt;":"<","&gt;":">","&nbsp;":" ","&ndash;":"-","&mdash;":"-","&rsquo;":"'","&lsquo;":"'","&ldquo;":'"',"&rdquo;":'"'}[token]));
}

export function sourceText(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return decodeHtml(main.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ").trim();
}

export async function collectSources(brief, localGuidance = {}, fetcher = fetch) {
  const topic = `${brief.title} ${brief.targetKeyword}`;
  const candidates = sourceCatalog.filter(source => !source.pattern || source.pattern.test(topic));
  for (const [index, source] of (localGuidance[brief.locationSlug]?.sources ?? []).entries()) {
    candidates.push({ ...source, id: `local-${brief.locationSlug}-${index}` });
  }
  const sources = [], unavailable = [];
  for (const candidate of candidates) {
    try {
      const response = await fetcher(candidate.url, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Grade-A-Plumbing-Editorial-Source-Check/1.0" } });
      const allowedHosts = new Set(candidates.map(source => new URL(source.url).hostname));
      if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) throw new Error(`HTTP ${response.status} or non-HTML response`);
      if (response.url && !allowedHosts.has(new URL(response.url).hostname)) throw new Error("Redirect outside curated source hosts");
      const content = sourceText(await response.text());
      if (content.length < 600 || /access denied|verify you are human|enable javascript and cookies/i.test(content.slice(0, 600))) throw new Error("No usable source content");
      sources.push({ id: candidate.id, title: candidate.title, url: candidate.url, checkedDate: new Date().toISOString().slice(0,10), digest: createHash("sha256").update(content).digest("hex"), content: content.slice(0, 18000) });
    } catch (error) { unavailable.push({ id: candidate.id, reason: error.message }); }
  }
  if (sources.length < 2) {
    const error = new QualityHold("Fewer than two accessible official sources; no article generated.");
    error.unavailableSources = unavailable;
    throw error;
  }
  return { sources, unavailable };
}

export function normalisedIntent(title, locationNames = []) {
  let text = title.toLowerCase();
  for (const name of [...locationNames].sort((a,b) => b.length-a.length)) text = text.replaceAll(name.toLowerCase(), " ");
  return text.replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|a|an|in|at|for|of|to|and|or|your|our|you|is|are|does|do|how|what|when|with|before|after)\b/g, " ").replace(/\s+/g, " ").trim();
}

export function assertDistinctIntent(brief, published, locationNames = []) {
  const intent = normalisedIntent(brief.title, locationNames);
  if (/^plumber\s+/i.test(brief.targetKeyword) || /^emergency plumber\s+/i.test(brief.targetKeyword)) throw new QualityHold("Booking keyword belongs to a location/service landing page, not another article.");
  if (published.some(article => article.slug === brief.slug || normalisedIntent(article.title, locationNames) === intent)) throw new QualityHold("Existing article already covers this normalised intent.");
}

function shingles(text, size = 7) {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(words.slice(0, -size + 1).map((_, index) => words.slice(index,index+size).join(" ")));
}

export function validateDraft(draft, brief, sources, published) {
  if (!draft || !Array.isArray(draft.sections) || draft.sections.length < 5 || !Array.isArray(draft.faq) || draft.faq.length < 2) throw new QualityHold("Incomplete sections or FAQs.");
  for (const key of ["metaTitle", "metaDescription", "excerpt"]) if (typeof draft[key] !== "string" || !draft[key].trim()) throw new QualityHold(`Missing ${key}.`);
  if (draft.metaTitle.length > 85 || draft.metaDescription.length < 80 || draft.metaDescription.length > 190) throw new QualityHold("Metadata needs editing.");
  const ids = new Set(sources.map(source => source.id)), used = new Set(), headings = new Set();
  for (const section of draft.sections) {
    if (typeof section.heading !== "string" || !section.heading.trim() || headings.has(section.heading.toLowerCase()) || !Array.isArray(section.paragraphs) || !section.paragraphs.length || !section.paragraphs.every(p => typeof p === "string" && p.trim())) throw new QualityHold("Invalid or repeated section.");
    headings.add(section.heading.toLowerCase());
    if (!Array.isArray(section.sourceIds) || section.sourceIds.some(id => !ids.has(id))) throw new QualityHold("Invalid section source references.");
    section.sourceIds.forEach(id => used.add(id));
  }
  if (used.size < 2) throw new QualityHold("At least two fetched sources must actually support the draft.");
  for (const item of draft.faq) if (typeof item.question !== "string" || !item.question.trim() || typeof item.answer !== "string" || !item.answer.trim()) throw new QualityHold("Invalid FAQ.");
  const body = draft.sections.flatMap(s => s.paragraphs).join(" ");
  const allText = [brief.title,draft.metaTitle,draft.metaDescription,draft.excerpt,body,...draft.faq.flatMap(f=>[f.question,f.answer])].join(" ");
  const words = body.trim().split(/\s+/).length;
  if (words < 1200 || words > 2200) throw new QualityHold(`Draft has ${words} words; required range is 1200-2200. Revise useful substance or remove repetition; do not pad.`);
  if (/<\/?[a-z][^>]*>/i.test(allText) || /https?:\/\//i.test(allText)) throw new QualityHold("HTML or unvalidated inline URLs in draft text.");
  if (!body.includes("(02) 5837 5457") || !body.includes("support@gradeaplumbing.store")) throw new QualityHold("Missing accurate contact CTA.");
  if (/we (?:guarantee|are (?:fully )?licensed|arrive within)|guaranteed (?:response|arrival|ranking)|number one on google/i.test(allText)) throw new QualityHold("Unsupported business or ranking promise.");
  if (!Array.isArray(draft.relatedServices) || !draft.relatedServices.length || draft.relatedServices.some(slug=>!serviceSlugs.includes(slug))) throw new QualityHold("Invalid service links.");
  const publicSlugs = new Set(published.map(article=>article.slug));
  if (!Array.isArray(draft.relatedArticles) || !draft.relatedArticles.length || draft.relatedArticles.some(slug=>!publicSlugs.has(slug) || slug === brief.slug)) throw new QualityHold("Related article links must target existing published guides.");
  const candidate = shingles(body);
  for (const article of published) {
    const previous = shingles(article.sections.flatMap(s=>s.paragraphs).join(" "));
    const repeated = [...candidate].filter(value=>previous.has(value)).length / Math.max(1,candidate.size);
    if (repeated > .25) throw new QualityHold(`Substantial wording reused from ${article.slug}.`);
  }
  for (const source of sources) {
    // Reject long copied passages. This is a guard, not proof of originality.
    const copied = shingles(source.content, 26);
    if ([...shingles(body,26)].some(value=>copied.has(value))) throw new QualityHold(`Long copied source passage: ${source.id}.`);
  }
  return { words, usedSourceIds: [...used] };
}

export function articleUrl(slug) { return `${editorialHost}/blog/${slug}/`; }
export function liveArticleMatches(html, expected) {
  const canonical = (html.match(/<link\b[^>]*>/gi) ?? []).find(tag=>/rel=["']canonical["']/i.test(tag))?.match(/href=["']([^"']+)/i)?.[1];
  if (!canonical || canonical !== articleUrl(expected.slug)) return false;
  if (/<meta\b[^>]*(?:name=["']robots["'][^>]*content=["'][^"']*noindex|content=["'][^"']*noindex[^>]*name=["']robots)/i.test(html)) return false;
  const h1 = decodeHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g, " ") ?? "").replace(/\s+/g," ").trim();
  if (h1 !== expected.title) return false;
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes = [];
  for (const block of blocks) { try { const data=JSON.parse(block[1]); nodes.push(...(Array.isArray(data)?data:[data])); } catch { return false; } }
  const visible=decodeHtml(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi," ").replace(/<[^>]*>/g," ")).replace(/\s+/g," ");
  if (!expected.sections?.length || !expected.sections.flatMap(section=>section.paragraphs).every(paragraph=>visible.includes(paragraph.replace(/\s+/g," ")))) return false;
  return nodes.some(node=>node["@type"] === "Article" && node.headline === expected.title && node.datePublished === expected.publishedDate && (!expected.updatedDate || node.dateModified===expected.updatedDate) && node.description===expected.metaDescription && node.mainEntityOfPage === articleUrl(expected.slug));
}

export function sydneyTime(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone:"Australia/Sydney",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23" }).formatToParts(now).map(part=>[part.type,part.value]));
  return { date:`${parts.year}-${parts.month}-${parts.day}`, hour:Number(parts.hour) };
}

export function runReadiness(calendar, generated, now = new Date(), manual = false) {
  const {date,hour}=sydneyTime(now), brief=calendar.find(item=>item.date===date);
  const pending=calendar.filter(item=>item.status==="awaiting-deployment");
  const generatedToday=generated.find(article=>article.publishedDate===date);
  const held=brief?.status==="held" && !manual;
  const shouldGenerate=(manual || hour>=9) && !held && brief?.status!=="published" && !generatedToday;
  return { date, hour, shouldGenerate, shouldRun:shouldGenerate || pending.length>0 || Boolean(generatedToday && brief?.status!=="published") || (brief?.status==="published" && !brief.verifiedAt), pending };
}
