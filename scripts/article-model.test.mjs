import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import { modelJson } from "./article-model.mjs";
const env = { GEMINI_API_KEY: "secret-test-value", GEMINI_MODEL: " models/gemini-2.5-flash " };
const success = () => ({ ok:true, json:async()=>({candidates:[{finishReason:"STOP",content:{parts:[{text:'{"ok":true}'}]}}]}) });
test("cloud workflow keeps daytime recovery and the single publisher concurrency lock",()=>{
 const workflow=readFileSync(new URL('../.github/workflows/daily-article.yml',import.meta.url),'utf8');
 assert.match(workflow,/cron: '0 2,4,6,8 \* \* \*'/);
 assert.match(workflow,/group: daily-article/);
 assert.match(workflow,/cancel-in-progress: false/);
});
test("default model uses the supported Gemini replacement",async()=>{
 await modelJson("test",{env:{GEMINI_API_KEY:env.GEMINI_API_KEY},fetcher:async url=>{assert.ok(url.includes('/gemini-3.8-flash:'));return success();}});
});
test("default availability fallback is bounded and never bypasses quota errors",async()=>{
 const keyEnv={GEMINI_API_KEY:env.GEMINI_API_KEY};let calls=0;
 const result=await modelJson("test",{env:keyEnv,sleep:async()=>{},fetcher:async url=>{calls++;if(url.includes('gemini-3.8'))return {ok:false,status:503,json:async()=>({error:{message:"High demand"}})};assert.ok(url.includes('gemini-3.1-flash-lite'));return success();}});assert.equal(result.ok,true);assert.equal(calls,4);
 calls=0;await assert.rejects(modelJson("test",{env:keyEnv,sleep:async()=>{},fetcher:async url=>{calls++;assert.ok(url.includes('gemini-3.8'));return {ok:false,status:429,json:async()=>({error:{message:"Quota"}})};}}),/429/);assert.equal(calls,3);
});
test("model IDs are normalized and actual JSON generation is used", async()=>{
 const result=await modelJson("test",{env,fetcher:async(url,options)=>{assert.ok(url.endsWith('/models/gemini-2.5-flash:generateContent'));assert.equal(options.method,"POST");return success();}});
 assert.equal(result.ok,true);
});
test("404 preserves safe provider detail and is not blindly retried", async()=>{
 let calls=0; await assert.rejects(modelJson("test",{env,fetcher:async()=>{calls++;return {ok:false,status:404,json:async()=>({error:{message:"Model unavailable secret-test-value"}})};}}),/404.*Model unavailable \[redacted\]/);assert.equal(calls,1);
});
test("temporary overload is retried with bounded delays",async()=>{
 let calls=0;const delays=[];const result=await modelJson("test",{env,sleep:async ms=>delays.push(ms),fetcher:async()=>++calls<3?{ok:false,status:503,json:async()=>({error:{message:"Overloaded"}})}:success()});assert.equal(result.ok,true);assert.deepEqual(delays,[5000,10000]);assert.equal(calls,3);
});
test("truncated JSON retries once with a larger budget, never parses partial output",async()=>{
 const budgets=[];const result=await modelJson("test",{env,fetcher:async(_url,options)=>{budgets.push(JSON.parse(options.body).generationConfig.maxOutputTokens);return budgets.length===1?{ok:true,json:async()=>({candidates:[{finishReason:"MAX_TOKENS",content:{parts:[{text:'{"ok":'}]}}]})}:success();}});assert.equal(result.ok,true);assert.deepEqual(budgets,[8000,16000]);
 let calls=0;await assert.rejects(modelJson("test",{env,fetcher:async()=>{calls++;return {ok:true,json:async()=>({candidates:[{finishReason:"MAX_TOKENS"}]})};}}),/Incomplete model response/);assert.equal(calls,2);
});
