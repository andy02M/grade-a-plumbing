import {readSeoConfiguration} from './location-readiness.mjs';
import {liveArticleMatches} from './article-quality.mjs';
const base='http://localhost:3100';
const {locations}=readSeoConfiguration('lib/locations.ts');
const {publishedArticles}=readSeoConfiguration('lib/articles.ts');
const failures=[];
for(let i=0;i<locations.length;i+=6){
 await Promise.all(locations.slice(i,i+6).map(async location=>{
  const response=await fetch(base+'/',{headers:{'x-forwarded-host':new URL(location.website).hostname}});
  const html=await response.text();
  const canonical=html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)/)?.[1];
  if(response.status!==200||!canonical||new URL(canonical).href!==new URL(location.website+'/').href)failures.push({slug:location.slug,status:response.status,canonical});
 }));
}
for(const article of publishedArticles){const response=await fetch(base+'/blog/'+article.slug+'/');if(response.status!==200||!liveArticleMatches(await response.text(),article))failures.push({article:article.slug,status:response.status,issue:'article metadata/schema/content mismatch'});}
console.log(JSON.stringify({locationHomepagesChecked:locations.length,articlesChecked:publishedArticles.length,failures},null,2));
if(failures.length)process.exitCode=1;
