import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {randomUUID} from "node:crypto";
import ts from "typescript";
import {readSeoConfiguration} from "./location-readiness.mjs";
const {measurementContext,sanitiseMeasurement}=readSeoConfiguration("lib/measurement.ts");
test("measurement covers configured public pages only and strips URL details",()=>{
 assert.equal(measurementContext("coburg.gradeaplumbing.store","/?email=private#fragment").pageType,"home");
 assert.equal(measurementContext("coburg.gradeaplumbing.store","/blocked-drains/").serviceSlug,"blocked-drains");
 for(const path of ["/dashboard/","/api/quote/","/seo-dashboard/","/unknown/","/blog/not-published/"])assert.equal(measurementContext("coburg.gradeaplumbing.store",path),null);
 assert.equal(measurementContext("unknown.gradeaplumbing.store","/"),null);
 assert.equal(measurementContext("preview.vercel.app","/"),null);
});
test("events reject identifiers, arbitrary labels and invalid metrics",()=>{
 const host="coburg.gradeaplumbing.store";
 const base={event:"call_click",path:"/",placement:"main"};assert.equal(sanitiseMeasurement(base,host).event,"call_click");
 assert.equal(sanitiseMeasurement({...base,email:"private@example.com"},host),null);
 assert.equal(sanitiseMeasurement({...base,placement:"customer name"},host),null);
 assert.equal(sanitiseMeasurement({...base,event:"quote_accepted"},host),null);
 for(const value of [NaN,Infinity,-1,120001])assert.equal(sanitiseMeasurement({event:"web_vital",path:"/",metric:"LCP",value},host),null);
 assert.equal(sanitiseMeasurement({event:"web_vital",path:"/",metric:"CLS",value:.1},host).value,.1);
});
test("measurement cannot block booking and respects browser preferences",()=>{
 const client=readFileSync(new URL('../components/SiteMeasurement.tsx',import.meta.url),'utf8');
 assert.match(client,/doNotTrack/);assert.match(client,/globalPrivacyControl/);assert.doesNotMatch(client,/localStorage|document.cookie|preventDefault|FormData/);
 const quote=readFileSync(new URL('../app/api/quote/route.ts',import.meta.url),'utf8');assert.match(quote,/if\(emailed && context/);assert.match(quote,/event:"quote_accepted"/);
 const route=readFileSync(new URL('../app/api/measurement/route.ts',import.meta.url),'utf8');assert.match(route,/sec-gpc/);assert.match(route,/size>2048/);assert.match(route,/sanitiseMeasurement/);
});
test("accepted quote measurement requires provider acceptance and contains no customer fields",async()=>{
 const source=readFileSync(new URL('../app/api/quote/route.ts',import.meta.url),'utf8');
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const logs=[];let accepted=true;const module={exports:{}};
 runInNewContext(output,{module,exports:module.exports,crypto:{randomUUID},process:{env:{NODE_ENV:'production',RESEND_API_KEY:'mock-key'}},console:{info:(...args)=>logs.push(args),error:()=>{}},fetch:async()=>({ok:accepted,text:async()=>"Mock provider failure"}),require:specifier=>{
  if(specifier==='next/server')return {NextResponse:{json:(body,options)=>({status:options?.status??200,body})}};
  if(specifier==='@/lib/site')return {site:{phone:'(02) 5837 5457',email:'support@gradeaplumbing.store'}};
  if(specifier==='@/lib/measurement')return {measurementContext};
  throw Error(specifier);
 }});
 const body={name:'Private name',phone:'0400000000',suburb:'Coburg',service:'Blocked drain',source:'Homepage quote form'};
 const request=()=>new Request('https://coburg.gradeaplumbing.store/api/quote',{method:'POST',headers:{host:'coburg.gradeaplumbing.store','content-type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await module.exports.POST(request())).status,200);
 const event=JSON.parse(logs.find(row=>row[0]==='site_measurement')[1]);
 assert.equal(event.event,'quote_accepted');assert.equal(event.locationSlug,'coburg');assert.equal(event.pageType,'home');assert.ok(!JSON.stringify(event).includes('Private'));assert.ok(!JSON.stringify(event).includes(body.phone));
 logs.length=0;accepted=false;assert.equal((await module.exports.POST(request())).status,500);assert.equal(logs.length,0);
});
