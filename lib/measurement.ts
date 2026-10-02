import { locations } from "./locations";
import { serviceBySlug } from "./seo-services";
import { articleBySlug } from "./articles";

// Only configured public content is eligible. Never retain a raw URL/query.
export function measurementContext(host: string, path: string) {
 const hostname=host.toLowerCase().split(":")[0];
 const location=locations.find(item=>item.hostname===hostname) ?? (["gradeaplumbing.store","www.gradeaplumbing.store"].includes(hostname)?locations.find(item=>item.slug==="melbourne"):undefined);
 if(!location)return null;
 const clean=path.split(/[?#]/)[0].replace(/\/+$/,"") || "/";
 const common:Record<string,string>={"/":"home","/contact":"contact","/service-areas":"service_areas","/blog":"article_index"};
 if(common[clean])return {locationSlug:location.slug,pageType:common[clean]};
 if(serviceBySlug.has(clean.slice(1)))return {locationSlug:location.slug,pageType:"service",serviceSlug:clean.slice(1)};
 const slug=clean.startsWith("/blog/")?clean.slice(6):"";
 if(location.slug==="melbourne"&&articleBySlug.has(slug))return {locationSlug:location.slug,pageType:"article",articleSlug:slug};
 return null;
}

export function sanitiseMeasurement(payload: unknown, host: string) {
 if(!payload || typeof payload!=="object" || Array.isArray(payload))return null;
 const p=payload as Record<string,unknown>;
 if(Object.keys(p).some(key=>!["event","path","placement","metric","value"].includes(key)) || typeof p.path!=="string" || p.path.length>256)return null;
 const context=measurementContext(host,p.path);if(!context)return null;
 if(p.event==="call_click"||p.event==="email_click") {
  if(!["header","main","footer","other"].includes(String(p.placement)))return null;
  return {event:p.event,...context,placement:p.placement};
 }
 if(p.event==="web_vital" && ["LCP","CLS","INP"].includes(String(p.metric)) && typeof p.value==="number" && Number.isFinite(p.value) && p.value>=0 && p.value<= (p.metric==="CLS"?10:120000))return {event:p.event,...context,metric:p.metric,value:Math.round(p.value*1000)/1000};
 return null;
}
