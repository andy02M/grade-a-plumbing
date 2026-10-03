import test from 'node:test';
import assert from 'node:assert/strict';
import { planBrief } from './plan-article.mjs';
test('replacement planning receives rejection and accessible evidence without changing location',async()=>{
 let prompt;
 const context={rejected:{reason:'Sanitary drainage is not supported by stormwater evidence'},sources:[{id:'consumer',content:'Written scope and consumer guarantees'}]};
 const result=await planBrief('2027-01-01',[],[],async value=>{prompt=value;return {title:'Reading a written plumbing scope',slug:'reading-a-written-plumbing-scope',targetKeyword:'reading a written plumbing scope'};},'coburg',context);
 assert.equal(result.locationSlug,'coburg');
 assert.ok(prompt.includes(JSON.stringify(context)));
 assert.match(prompt,/Do not put the suburb into a generic technical question/);
});
test('plans future dates and rejects duplicate or invalid topics',async()=>{
 const original=globalThis.fetch;const key=process.env.GEMINI_API_KEY;
 process.env.GEMINI_API_KEY='test-only';
 let topic={title:'Preparing for drain inspection',slug:'preparing-for-drain-inspection',targetKeyword:'drain inspection preparation'};
 globalThis.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(topic)}]}}]})});
 try{
 const calendar=[{locationSlug:'coburg',title:'Old topic',slug:'old-topic'}];
 const brief=await planBrief('2027-01-01',calendar,[]);
 assert.equal(brief.date,'2027-01-01');assert.equal(brief.locationSlug,'coburg');assert.equal(brief.status,'planned');
 topic={...topic,slug:'old-topic'};
 await assert.rejects(planBrief('2027-01-02',calendar,[]),/Duplicate/);
 topic={...topic,slug:'invalid slug'};
 await assert.rejects(planBrief('2027-01-02',calendar,[]),/Invalid/);
 }finally{globalThis.fetch=original;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key;}
});
