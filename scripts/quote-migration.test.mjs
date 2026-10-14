import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import ts from 'typescript';import {randomUUID} from 'node:crypto';
const compile=path=>ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const validation={exports:{}};runInNewContext(compile('lib/quote-validation.ts'),{module:validation,exports:validation.exports,Buffer});
const base={name:'TEST ONLY Migration',phone:'0491570006',email:'support@gradeaplumbing.store',suburb:'Coburg',postcode:'3058',state:'VIC',service:'Blocked Drains',message:'TEST ONLY. No booking required.',preferredContact:'email',preferredDay:'Tomorrow',preferredTime:'Morning'};
test('quote validation preserves fields and rejects invalid preferences and disguised photos',()=>{
 assert.equal(validation.exports.validateQuote(base),null);
 for(const change of [{phone:'bad'},{email:''},{postcode:'bad'},{state:'ZZ'},{name:4},{preferredContact:'invalid'},{attachments:[{filename:'fake.png',content:Buffer.from('not an image').toString('base64'),contentType:'image/png'}]}])assert.ok(validation.exports.validateQuote({...base,...change}));
});
test('quote API only reports success after provider acceptance, sends fields and deduplicates retries',async()=>{
 const module={exports:{}};const sent=[];let ok=true;
 runInNewContext(compile('app/api/quote/route.ts'),{module,exports:module.exports,crypto:{randomUUID},AbortSignal,process:{env:{RESEND_API_KEY:'test-key'}},console:{info:()=>{},error:()=>{}},fetch:async(_url,options)=>{sent.push(JSON.parse(options.body));return {ok};},require:specifier=>{
  if(specifier==='next/server')return {NextResponse:{json:(body,options)=>({body,status:options?.status??200})}};
  if(specifier==='@/lib/site')return {site:{phone:'(02) 5837 5457',email:'support@gradeaplumbing.store'}};
  if(specifier==='@/lib/measurement')return {measurementContext:()=>null};
  if(specifier==='@/lib/quote-validation')return validation.exports;
  if(specifier.endsWith('location-catalog.json'))return {locations:[]};
  if(specifier.endsWith('locationData'))return {SYDNEY_LOCATIONS:[]};
  throw Error(specifier);
 }});
 const requestId=randomUUID();const request=()=>new Request('http://localhost/api/quote/',{method:'POST',body:JSON.stringify({...base,requestId})});
 assert.equal((await module.exports.POST(request())).status,200);assert.equal((await module.exports.POST(request())).status,200);assert.equal(sent.length,1);
 assert.deepEqual(sent[0].to,['support@gradeaplumbing.store','zenn@gradeaplumbing.store']);for(const value of ['3058','VIC','email','Tomorrow','Morning',base.message])assert.ok(sent[0].text.includes(value));
 ok=false;assert.equal((await module.exports.POST(new Request('http://localhost/api/quote/',{method:'POST',body:JSON.stringify({...base,requestId:randomUUID()})}))).status,503);
});
