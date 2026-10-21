import {mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {readSeoConfiguration, locationReadiness} from './location-readiness.mjs';

// Read-only bounded GET audit. No account APIs, forms, cookies or credentials.
const args=process.argv.slice(2), value=name=>args.find(x=>x.startsWith(name+'='))?.slice(name.length+1);
const out=value('--out')??'output/seo-20261021/baseline.json';
const base=value('--base');
const {locations}=readSeoConfiguration('lib/locations.ts');
const {publishedArticles}=readSeoConfiguration('lib/articles.ts');
const eligible=l=>l.tier===1||l.slug==='melbourne'||Boolean(l.address);
const services=['blocked-drains','sewer-repairs','pipe-relining','hot-water','emergency-plumber','burst-pipe-repair','gas-plumbing','commercial-plumbing','toilet-repairs','kitchen-plumbing','bathroom-plumbing','leak-detection'];
const marketing=['services','about','our-work','reviews','service-areas','contact'];
const inventory=locations.flatMap(l=>[...['/',...marketing.map(x=>'/'+x+'/')],...(eligible(l)?services.map(x=>'/'+x+'/'):[])].map(path=>({url:l.website+path,location:l.slug,kind:path==='/'?'location':marketing.some(x=>path==='/'+x+'/')?'marketing':'service'})));
inventory.push(...publishedArticles.map(a=>({url:'https://melbourne.gradeaplumbing.store/blog/'+a.slug+'/',location:'melbourne',kind:'article'})),{url:'https://melbourne.gradeaplumbing.store/blog/',location:'melbourne',kind:'article-index'});
const targets=base?inventory.filter(x=>x.location==='melbourne'):[...inventory];
if(!base)targets.push(...locations.flatMap(l=>['/robots.txt','/sitemap.xml'].map(path=>({url:l.website+path,location:l.slug,kind:path.endsWith('xml')?'sitemap':'robots'}))),...['https://gradeaplumbing.store/','https://www.gradeaplumbing.store/','http://gradeaplumbing.store/','https://melbourne.gradeaplumbing.store/sitemap-index.xml'].map(url=>({url,kind:'entry'})));
const strip=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),m[2]]));
const results=[];let next=0;
async function inspect(item){
 const url=base?base.replace(/\/$/,'')+new URL(item.url).pathname:item.url;
 const started=performance.now();
 try{
  let current=url, response, chain=[];
  for(let i=0;i<6;i++){
   response=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(25000),headers:{'User-Agent':'GradeA-SEO-Audit/1.0'}});
   chain.push({url:current,status:response.status});
   if(response.status>=300&&response.status<400&&response.headers.get('location')){await response.body?.cancel();current=new URL(response.headers.get('location'),current).href;continue;}break;
  }
  const html=await response.text(), isHtml=(response.headers.get('content-type')??'').includes('text/html');
  const meta=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0]));
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0]));
  const headings=[...html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m=>({level:Number(m[1]),text:strip(m[2])}));
  const schemas=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>{try{return JSON.parse(m[1]);}catch{return {parseError:true};}});
  const anchors=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
  const images=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>attrs(m[0]));
  return {...item,requested:url,finalUrl:current,status:response.status,chain,fetchMs:Math.round(performance.now()-started),bytes:Buffer.byteLength(html),contentType:response.headers.get('content-type'),title:isHtml?strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??''):null,description:meta.find(m=>m.name==='description')?.content??null,canonical:links.filter(l=>l.rel==='canonical').map(l=>l.href),robots:meta.find(m=>m.name==='robots')?.content??null,xRobots:response.headers.get('x-robots-tag'),headings,schemas,links:[...new Set(anchors)],images:images.map(i=>({src:i.src,alt:i.alt??null,width:i.width??null,height:i.height??null,loading:i.loading??null})),words:isHtml?strip(html).split(/\s+/).length:null,contentHash:isHtml?createHash('sha256').update(strip(html)).digest('hex'):null,sitemapUrls:item.kind==='sitemap'?[...html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]):undefined,body:item.kind==='robots'?html:undefined};
 }catch(error){return {...item,requested:url,error:error.message};}
}
await Promise.all(Array.from({length:8},async()=>{while(next<targets.length){const item=targets[next++];results.push(await inspect(item));if(results.length%100===0)console.log(`Audited ${results.length}/${targets.length}`);}}));
const html=results.filter(r=>r.contentType?.includes('text/html')&&r.status===200);
const duplicate=(key)=>Object.entries(Object.groupBy(html,r=>typeof key==='function'?key(r):r[key])).filter(([v,rows])=>v&&rows.length>1).map(([value,rows])=>({value,count:rows.length,urls:rows.map(r=>r.url)}));
const summary={targets:targets.length,completed:results.length,errors:results.filter(r=>r.error).length,non200:results.filter(r=>r.status&&r.status!==200).length,html:html.length,missingTitles:html.filter(r=>!r.title).length,missingDescriptions:html.filter(r=>!r.description).length,missingCanonicals:html.filter(r=>r.canonical.length!==1).length,canonicalMismatch:html.filter(r=>r.canonical[0]!==r.finalUrl).length,h1NotOne:html.filter(r=>r.headings.filter(h=>h.level===1).length!==1).length,invalidJsonLd:html.filter(r=>r.schemas.some(s=>s.parseError)).length};
await mkdir(dirname(out),{recursive:true});
await writeFile(out,JSON.stringify({checkedAt:new Date().toISOString(),scope:base?'Local candidate: Melbourne routes; host handling checked separately':'Configured network HTTP crawl; not Google indexation, rankings or field CWV',summary,readiness:locationReadiness(),inventory,duplicates:{titles:duplicate('title'),h1:duplicate(r=>r.headings.find(h=>h.level===1)?.text??'')},results},null,2)+'\n');
console.log(JSON.stringify(summary));
