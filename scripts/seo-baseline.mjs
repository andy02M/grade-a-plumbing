import { locationReadiness, readSeoConfiguration } from "./location-readiness.mjs";

const { publishedArticles }=readSeoConfiguration("lib/articles.ts");
const readiness=locationReadiness();
console.log(JSON.stringify({
  checkedAt:new Date().toISOString(),
  scope:"Repository baseline; not search performance or Google indexing measurements",
  locations:readiness.summary,
  articles:publishedArticles.map(article=>({slug:article.slug,url:`https://melbourne.gradeaplumbing.store/blog/${article.slug}/`,publishedDate:article.publishedDate,updatedDate:article.updatedDate??null,bodyWords:article.sections.flatMap(section=>section.paragraphs).join(" ").trim().split(/\s+/).length,sourceCount:article.sources?.length??0,relatedArticles:article.relatedArticles.length,locationSlugs:article.locationSlugs??[]})),
  searchPerformance:{status:"Account data not connected to this audit",impressions:null,clicks:null,ctr:null,averagePosition:null,indexedPages:null},
  conversionPerformance:{status:"Verified analytics and enquiry attribution data unavailable",enquiries:null,phoneClicks:null,emailClicks:null},
  coreWebVitals:{status:"No verified field measurements available",LCP:null,INP:null,CLS:null},
},null,2));
