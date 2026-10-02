import { serviceSlugs } from "./article-quality.mjs";

export function articleDraftSchema(sources, published) {
 const string = {type:"string"};
 const list = (items,minItems=1) => ({type:"array",items,minItems});
 const object = properties => ({type:"object",properties,required:Object.keys(properties),additionalProperties:false});
 return object({
  metaTitle:string,metaDescription:string,excerpt:string,
  sections:list(object({heading:string,paragraphs:list(string),sourceIds:list({type:"string",enum:sources.map(s=>s.id)})}),5),
  faq:list(object({question:string,answer:string}),2),
  relatedServices:list({type:"string",enum:serviceSlugs}),
  relatedArticles:list({type:"string",enum:published.map(a=>a.slug)}),
 });
}
