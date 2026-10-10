import { readFile, writeFile, appendFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readSeoConfiguration } from './location-readiness.mjs';
import { sydneyTime, validateDraft, assertDistinctIntent, articleUrl } from './article-quality.mjs';
import { runPublisher } from './publish-daily-article.mjs';

const read=async path=>JSON.parse(await readFile(path,'utf8'));
const output=async(key,value)=>{if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`${key}=${value}\n`);};
export function validateQueued(entry,published,locations,today) {
 if(entry.review?.status!=='approved'||entry.review?.method!=='source-checked-editorial-review'||!entry.review?.checkedDate||entry.review.checkedDate>today)throw Error('Queue entry lacks a completed source review.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(entry.availableFrom)||!entry.article?.slug||!entry.article?.title)throw Error('Invalid queued article identity or release date.');
 const article=entry.article;
 if(!article.locationSlugs?.length||article.locationSlugs.some(slug=>!locations.some(l=>l.slug===slug&&l.googleBusinessProfile?.status==='Active')))throw Error('Queued article must link to configured Active locations.');
 if(article.author!=='Grade A Plumbing'||article.status!=='draft')throw Error('Invalid queued author or status.');
 const sources=(article.sources??[]).map((s,index)=>({...s,id:String(index),content:''}));
 if(sources.length<2||sources.some(s=>!s.checkedDate||s.checkedDate>today||new URL(s.url).protocol!=='https:'))throw Error('Reviewed HTTPS sources required.');
 const draft={...article,sections:article.sections.map(section=>({...section,sourceIds:(section.sourceUrls??[]).map(url=>{const index=sources.findIndex(s=>s.url===url);if(index<0)throw Error('Section cites unknown source.');return String(index);})}))};
 assertDistinctIntent({title:article.title,slug:article.slug,targetKeyword:entry.targetKeyword},published,locations.map(l=>l.location));
 return validateDraft(draft,{title:article.title,slug:article.slug},sources,published);
}

export async function publishQueue({dataDir='data',now=new Date(),args=process.argv.slice(2),manual=process.env.MANUAL_RUN==='true',verifyOnly=process.env.VERIFY_ONLY==='true',catalog=()=>readSeoConfiguration('lib/articles.ts').publishedArticles}={}) {
 if(args.includes('--verify'))return runPublisher({dataDir,now,args:['--verify']});
 const queue=await read(`${dataDir}/article-queue.json`);
 const generated=await read(`${dataDir}/generated-articles.json`);
 const files=(await readdir(dataDir)).filter(file=>/^article-calendar-\d+\.json$/.test(file)).sort();
 const lists=await Promise.all(files.map(file=>read(`${dataDir}/${file}`)));
 const calendar=lists.flat(),{date,hour}=sydneyTime(now);
 const pending=calendar.some(item=>item.status==='awaiting-deployment');
 const existing=generated.find(article=>article.publishedDate===date);
 const daily=calendar.find(item=>item.date===date);
 const due=(manual||hour>=9)&&!existing&&daily?.status!=='published'&&!verifyOnly;
 const shouldRun=due||pending||Boolean(existing&&!daily?.verifiedAt)||verifyOnly;
 await output('should_run',shouldRun);await output('should_generate',false);
 if(args.includes('--preflight')){console.log(`Queue publisher: Sydney ${date}; work required: ${shouldRun}; AI calls: zero.`);return;}
 if(!shouldRun){await output('outcome','idle');return;}
 if(!due){await output('outcome','verification-only');return;}
 // Verify any prior release before consuming another entry. Do not batch missed days.
 if(pending){await output('outcome','verification-only');return;}
 const entry=queue.find(item=>item.status==='ready'&&item.availableFrom<=date);
 if(!entry)throw Error('Article queue empty or no reviewed article due. Replenishment required; no AI generation attempted.');
 const publishedArticles=catalog();
 const {locations}=readSeoConfiguration('lib/locations.ts');
 const checks=validateQueued(entry,publishedArticles,locations,date);
 if(generated.some(article=>article.slug===entry.article.slug))throw Error('Duplicate queue slug.');
 const article={...entry.article,publishedDate:date,updatedDate:date,status:'published'};
 generated.push(article);
 const brief={date,time:'09:00',timezone:'Australia/Sydney',title:article.title,slug:article.slug,targetKeyword:entry.targetKeyword,locationSlug:article.locationSlugs[0],status:'awaiting-deployment',publishedUrl:null,reason:null};
 if(daily)Object.assign(daily,brief);else {if(!lists.length){files.push('article-calendar-01.json');lists.push([]);}lists[0].push(brief);}
 entry.status='released';entry.releasedDate=date;
 const log=await read(`${dataDir}/article-publication-log.json`);
 log.push({date,outcome:'prepared',recordedAt:now.toISOString(),slug:article.slug,words:checks.words,method:'reviewed-queue',review:entry.review});
 await writeFile(`${dataDir}/generated-articles.json`,JSON.stringify(generated,null,2)+'\n');
 await writeFile(`${dataDir}/article-queue.json`,JSON.stringify(queue,null,2)+'\n');
 for(let i=0;i<files.length;i++)await writeFile(`${dataDir}/${files[i]}`,JSON.stringify(lists[i])+'\n');
 await writeFile(`${dataDir}/article-publication-log.json`,JSON.stringify(log,null,2)+'\n');
 await output('outcome','prepared');
 console.log(`Prepared reviewed queue article: ${articleUrl(article.slug)} (${checks.words} words). Live publication is not yet verified.`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))publishQueue().catch(error=>{console.error(error.message);process.exitCode=1;});
