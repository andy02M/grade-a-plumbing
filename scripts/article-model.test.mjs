import test from "node:test";
import assert from "node:assert/strict";
import { modelJson } from "./article-model.mjs";
const env = { GEMINI_API_KEY: "secret-test-value", GEMINI_MODEL: " models/gemini-2.5-flash " };
const success = () => ({ ok:true, json:async()=>({candidates:[{finishReason:"STOP",content:{parts:[{text:'{"ok":true}'}]}}]}) });
test("default model uses the supported Gemini replacement",async()=>{
 await modelJson("test",{env:{GEMINI_API_KEY:env.GEMINI_API_KEY},fetcher:async url=>{assert.ok(url.includes('/gemini-3.8-flash:'));return success();}});
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
