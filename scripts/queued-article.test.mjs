import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {publishQueue,validateQueued} from './publish-queued-article.mjs';
import {readSeoConfiguration} from './location-readiness.mjs';
const queue=JSON.parse(await readFile('data/article-queue.json','utf8'));
const {publishedArticles}=readSeoConfiguration('lib/articles.ts');
const {locations}=readSeoConfiguration('lib/locations.ts');
test('all ready queue articles meet structural, citation, intent and originality checks',()=>{
 for(const entry of queue.filter(e=>e.status==='ready'))assert.ok(validateQueued(entry,publishedArticles,locations,'2026-10-10').words>=1200);
});
test('queue rejects absent review, invalid source mapping, inactive locations and unsupported contacts',()=>{
 for(const mutate of [e=>e.review.status='pending',e=>e.article.sections[0].sourceUrls=['https://invented.invalid/'],e=>e.article.locationSlugs=['unknown'],e=>e.article.sections.forEach(s=>s.paragraphs=s.paragraphs.map(p=>p.replaceAll('(02) 5837 5457','wrong')))]){
  const entry=structuredClone(queue[0]);mutate(entry);assert.throws(()=>validateQueued(entry,publishedArticles,locations,'2026-10-10'));
 }
});
test('queue releases one per Sydney date without AI or source fetch calls and never duplicates',async()=>{
 const dataDir=await mkdtemp(join(tmpdir(),'grade-a-queue-test-'));
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async()=>{throw Error('Queue must not call AI or source fetches');};
 try{
  await writeFile(join(dataDir,'article-queue.json'),JSON.stringify(queue));
  await writeFile(join(dataDir,'generated-articles.json'),'[]');
  await writeFile(join(dataDir,'article-publication-log.json'),'[]');
  await writeFile(join(dataDir,'article-calendar-01.json'),JSON.stringify([{date:'2026-10-10',status:'held',slug:'old-rejected-topic'}]));
  const options={dataDir,now:new Date('2026-10-10T01:00:00Z'),args:[],manual:true};
  await publishQueue(options);await publishQueue(options);
  const generated=JSON.parse(await readFile(join(dataDir,'generated-articles.json'),'utf8'));
  assert.equal(generated.length,1);assert.equal(generated[0].publishedDate,'2026-10-10');
  const calendar=JSON.parse(await readFile(join(dataDir,'article-calendar-01.json'),'utf8'));
  assert.equal(calendar[0].status,'awaiting-deployment');assert.equal(calendar[0].slug,queue[0].article.slug);
 }finally{globalThis.fetch=originalFetch;await rm(dataDir,{recursive:true,force:true});}
});
test('daily workflow uses only queue publishing and retains deployed-content verification',async()=>{
 const workflow=await readFile('.github/workflows/daily-article.yml','utf8');
 assert.doesNotMatch(workflow,/GEMINI_API_KEY|--check-key/);
 assert.match(workflow,/publish-queued-article.mjs --verify/);
 assert.match(workflow,/data\/article-queue.json/);
});
