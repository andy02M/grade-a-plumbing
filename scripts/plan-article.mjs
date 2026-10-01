import { modelJson } from "./article-model.mjs";
import { readSeoConfiguration } from "./location-readiness.mjs";
import { assertDistinctIntent } from "./article-quality.mjs";

export async function planBrief(date,calendar,articles) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date).toISOString().slice(0,10)!==date) throw new Error("Invalid planning date.");
  const { locations }=readSeoConfiguration("lib/locations.ts");
  const active=locations.filter(location=>location.googleBusinessProfile?.status==="Active");
  const scheduledLocations=new Set(calendar.map(brief=>brief.locationSlug));
  const existing=active.filter(location=>scheduledLocations.has(location.slug));
  const candidates=existing.length?existing:active;
  if(!candidates.length) throw new Error("No configured Active location available for planning.");
  const coverage=location=>articles.filter(article=>article.locationSlugs?.includes(location.slug)).length;
  const minimum=Math.min(...candidates.map(coverage));
  const pool=candidates.filter(location=>coverage(location)===minimum).sort((a,b)=>a.slug.localeCompare(b.slug));
  const location=pool[Math.floor(Date.parse(date)/86400000)%pool.length];
  const intents=[...calendar.map(({title,slug,targetKeyword})=>({title,slug,targetKeyword})),...articles.map(({title,slug,excerpt})=>({title,slug,excerpt}))];
  const topic=await modelJson(`Plan ONE distinct useful informational plumbing article for Grade A Plumbing relevant to ${location.location}. Return JSON title,slug,targetKeyword. Do not duplicate or compete with these existing or scheduled intents: ${JSON.stringify(intents)}. Prefer a specific unanswered practical customer question, not a broad service landing page. A changed suburb name is not a new intent. Existing articles may be better improved instead of publishing another. No invented local facts, jobs, premises or suburb-swapped copies. General guides belong on Melbourne editorial host and link to the matching suburb. Slug must be lowercase hyphen-separated ASCII words. Do not target the booking keyword plumber [suburb].`);
  if(!topic||!["title","slug","targetKeyword"].every(key=>typeof topic[key]==="string"&&topic[key].trim())||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.slug)||topic.slug.length>150) throw new Error("Invalid planned topic.");
  if(calendar.some(brief=>brief.slug===topic.slug||brief.title.toLowerCase()===topic.title.toLowerCase())||articles.some(article=>article.slug===topic.slug)) throw new Error("Duplicate planned topic; editorial input required.");
  assertDistinctIntent(topic,[...articles,...calendar],locations.map(item=>item.location));
  return {date,time:"09:00",timezone:"Australia/Sydney",...topic,locationSlug:location.slug,status:"planned",publishedUrl:null};
}
