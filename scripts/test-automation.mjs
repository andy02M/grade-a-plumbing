import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

// Isolated tests: no production env file, Google request, or external Redis connection.
const require = createRequire(import.meta.url);
const root = process.cwd();
process.env.OAUTH_TOKEN_ENCRYPTION_KEY = "isolated-test-key-not-a-production-secret";
process.env.GOOGLE_OAUTH_CLIENT_ID = "test-client";
process.env.GOOGLE_OAUTH_CLIENT_SECRET = "test-client-secret";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3100";
process.env.KV_REST_API_URL = "https://test-redis.invalid";
process.env.KV_REST_API_TOKEN = "test-token";
delete process.env.DATABASE_URL;
const hashes = new Map(), strings = new Map(), sets = new Map();
const cookies = new Map();
const modules = new Map();
const overrides = new Map();
const legacy = [];
let storageDown = false;
let tests = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  assert.equal(url, "https://test-redis.invalid", "Tests must never make an external request");
  if(storageDown) return Response.json({error:"test outage"},{status:503});
  const [command,key,...args] = JSON.parse(init.body);
  let result;
  switch(command) {
    case "HVALS": result=[...(hashes.get(key)?.values()||[])];break;
    case "HGET": result=hashes.get(key)?.get(args[0])||null;break;
    case "HSET": {const hash=hashes.get(key)||new Map();for(let i=0;i<args.length;i+=2)hash.set(args[i],args[i+1]);hashes.set(key,hash);result=1;break;}
    case "HDEL": result=hashes.get(key)?.delete(args[0])?1:0;break;
    case "LRANGE": result=legacy;break;
    case "SET": if(args.includes("NX")&&strings.has(key))result=null;else {strings.set(key,args[0]);result="OK";}break;
    case "EVAL": {const lock=args[1],token=args[2];result=strings.get(lock)===token?(strings.delete(lock),1):0;break;}
    case "SADD": {const set=sets.get(key)||new Set();set.add(args[0]);sets.set(key,set);result=1;break;}
    case "SMEMBERS": result=[...(sets.get(key)||[])];break;
    default: throw new Error(`Unexpected Redis command ${command}`);
  }
  return Response.json({result});
};
function load(relative) {
  let filename=path.resolve(root,relative);
  if(!path.extname(filename))filename+=".ts";
  if(overrides.has(filename))return overrides.get(filename);
  if(modules.has(filename))return modules.get(filename).exports;
  const module={exports:{}};modules.set(filename,module);
  const code=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const localRequire=(specifier)=>{
    if(specifier==="next/headers")return {cookies:async()=>({get:name=>cookies.has(name)?{value:cookies.get(name)}:undefined,set:(name,value)=>cookies.set(name,value),delete:name=>cookies.delete(name)})};
    if(specifier.startsWith("@/"))return load(specifier.slice(2));
    if(specifier.startsWith("."))return load(path.resolve(path.dirname(filename),specifier));
    return require(specifier);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename})(localRequire,module,module.exports);
  return module.exports;
}
async function test(name, fn) {await fn();tests++;console.log(`PASS ${name}`);}
const content=load("lib/automation-content.ts");
const store=load("lib/automation-store.ts");
const auth=load("lib/automation-auth.ts");
const accounts=load("lib/google-account-db-store.ts");
const request=(body,method="POST",origin="http://localhost:3100")=>new Request("http://localhost:3100/api/test",{method,headers:{origin,"Content-Type":"application/json"},body:JSON.stringify(body)});
const p={id:"p1",googleAccountId:"a1",accountName:"accounts/10",locationName:"locations/100",title:"Example Plumbing",phone:"+61390000000",city:"Melbourne",status:"UNKNOWN",canOperateLocalPost:true};
try {
await test("calendar includes every day and rejects impossible dates",()=>{assert.equal(content.campaignDates("2026-09-14","2026-09-30").length,17);assert.throws(()=>content.campaignDates("2026-02-30","2026-03-03"));});
await test("Melbourne DST changes UTC schedule correctly",()=>{assert.equal(content.localDateTimeToUtc("2026-10-03","09:00","Australia/Melbourne"),"2026-10-02T23:00:00.000Z");assert.equal(content.localDateTimeToUtc("2026-10-04","09:00","Australia/Melbourne"),"2026-10-03T22:00:00.000Z");assert.throws(()=>content.localDateTimeToUtc("2026-10-04","02:30","Australia/Melbourne"));});
await test("template variables resolve and CALL omits link",()=>{const result=content.renderContent({summary:"{{business_name}} in {{city}}",ctaType:"CALL",url:"https://example.com"},p);assert.equal(result.summary,"Example Plumbing in Melbourne");assert.equal(result.url,undefined);assert.throws(()=>content.renderContent({summary:"{{website}}",ctaType:"NONE"},p));assert.throws(()=>content.validateContent({summary:"hello",ctaType:"BOOK",url:"javascript:alert(1)"}));});
await test("session signatures and origin checks isolate owners",async()=>{const signed=auth.signCookie({workspaceId:"test",email:"owner@example.com",expiresAt:Date.now()+10000},"workspace-session");cookies.set("gmb_workspace_session",signed);assert.equal((await auth.requireWorkspace()).workspaceId,"test");cookies.set("gmb_workspace_session",signed+"x");assert.equal(await auth.optionalWorkspace(),null);await auth.setWorkspaceSession("test","owner@example.com");await assert.rejects(()=>auth.requireWorkspace(request({},"POST","https://attacker.invalid")));});
await test("encrypted accounts never leak through listing; tenants remain separate",async()=>{await accounts.saveConnectedGoogleAccount({id:"a1",email:"one@example.com",refreshToken:"token-one"},"test");await accounts.saveConnectedGoogleAccount({id:"a2",email:"two@example.com",refreshToken:"token-two"},"other");const list=await accounts.listConnectedGoogleAccounts("test");assert.equal(list.length,1);assert.equal(list[0].encryptedRefreshToken,undefined);assert.equal(await accounts.getConnectedGoogleAccount("a2","test"),null);assert.equal(accounts.decryptToken((await accounts.getConnectedGoogleAccount("a1","test")).encryptedRefreshToken),"token-one");});
await test("legacy accounts visible only in default owner workspace",async()=>{legacy.push(JSON.stringify({id:"legacy",email:"legacy@example.com",connectedAt:new Date().toISOString(),encryptedRefreshToken:accounts.encryptToken("legacy-token"),businessProfiles:[{id:"old",title:"Old",status:"UNKNOWN",selected:true}]}));assert.equal((await accounts.listConnectedGoogleAccounts("default"))[0].businessProfiles.length,1);assert.equal((await accounts.listConnectedGoogleAccounts("other")).some(a=>a.id==="legacy"),false);});
await test("durable storage fails closed",async()=>{storageDown=true;await assert.rejects(()=>store.putRecord("test","templates","nope",{}));storageDown=false;assert.equal(await store.getRecord("test","templates","nope"),null);});
const templateRoutes=load("app/api/automation/templates/route.ts");
let template;
await test("template API saves validated content",async()=>{const response=await templateRoutes.POST(request({name:"Daily",summary:"{{business_name}} serves {{city}}.",ctaType:"CALL"}));assert.equal(response.status,200);template=(await response.json()).template;assert.equal((await store.listRecords("test","templates")).length,1);});
await store.putRecord("test","profiles",p.id,p);
const duplicate={...p,id:"p2",googleAccountId:"a2"};await store.putRecord("test","profiles",duplicate.id,duplicate);
const postsRoutes=load("app/api/automation/posts/route.ts");
const batch={templateIds:[template.id],profileIds:["p1","p2"],startDate:"2099-09-14",endDate:"2099-09-30",time:"09:00",timezone:"Australia/Melbourne"};
await test("daily campaign de-duplicates shared locations and repeated submissions",async()=>{let response=await postsRoutes.POST(request(batch));assert.equal(response.status,200);let data=await response.json();assert.equal(data.created,17);assert.equal(data.profiles,1);response=await postsRoutes.POST(request(batch));data=await response.json();assert.equal(data.created,0);assert.equal(data.skipped,17);});
await test("a different owner cannot schedule another workspace's profiles",async()=>{await auth.setWorkspaceSession("other","other@example.com");const response=await postsRoutes.POST(request(batch));assert.equal(response.status,400);await auth.setWorkspaceSession("test","owner@example.com");});
let posted=0;
const fakeGoogle={publishPostForProfile:async(_ws,_profile,post)=>{posted++;if(post.summary==="uncertain")throw Object.assign(new Error("Timeout after write"),{unknownOutcome:true});return {name:"accounts/10/locations/100/localPosts/test",state:"PROCESSING"};},getPostForProfile:async()=>({name:"accounts/10/locations/100/localPosts/test",state:"LIVE"})};
overrides.set(path.resolve(root,"lib/automation-google.ts"),fakeGoogle);
const runner=load("lib/automation-runner.ts");
const base=(await store.listRecords("test","posts"))[0];
await store.putRecord("test","posts","due",{...base,id:"due",scheduledFor:"2000-01-01T00:00:00Z"});
await test("worker records submitted then live without publishing twice",async()=>{await runner.runWorkspaceQueue("test");assert.equal(posted,1);assert.equal((await store.getRecord("test","posts","due")).status,"SUBMITTED");await runner.runWorkspaceQueue("test");assert.equal(posted,1);assert.equal((await store.getRecord("test","posts","due")).status,"PUBLISHED");});
await store.putRecord("test","posts","uncertain",{...base,id:"uncertain",summary:"uncertain",scheduledFor:"2000-01-01T00:00:00Z"});
await test("unknown publishing result needs review and is never blindly retried",async()=>{await runner.runWorkspaceQueue("test");assert.equal((await store.getRecord("test","posts","uncertain")).status,"NEEDS_REVIEW");const count=posted;await runner.runWorkspaceQueue("test");assert.equal(posted,count);const res=await postsRoutes.PATCH(request({ids:["uncertain"],action:"retry"},"PATCH"));assert.equal((await res.json()).updated,0);});
await test("pause and resume persist without changing saved content",async()=>{let res=await postsRoutes.PATCH(request({ids:[base.id],action:"pause"},"PATCH"));assert.equal((await res.json()).updated,1);assert.equal((await store.getRecord("test","posts",base.id)).status,"PAUSED");res=await postsRoutes.PATCH(request({ids:[base.id],action:"resume"},"PATCH"));assert.equal((await res.json()).updated,1);assert.equal((await store.getRecord("test","posts",base.id)).summary,base.summary);});
let created=0,validated=0;
fakeGoogle.googleClient=async()=>({});fakeGoogle.accountsWithClient=async()=>[{name:"accounts/10",accountName:"Example"}];fakeGoogle.locationsWithClient=async()=>[];
fakeGoogle.createLocationWithClient=async(_c,_a,location,_id,validate)=>{if(validate){validated++;return {};}created++;return {...location,name:"locations/created"};};
fakeGoogle.profileFromLocation=(id,account,location)=>({...p,id:"created",googleAccountId:id,accountName:account.name,locationName:location.name,title:location.title});
const profileModule=load("lib/automation-profiles.ts");
const settings={title:"Example Real Business",categoryName:"categories/gcid:plumber",categoryLabel:"Plumber",phone:"+61390000000",websiteUri:"https://example.com",description:"Example plumbing business",businessType:"STOREFRONT",regionCode:"AU",addressLine:"1 Example Street",city:"Melbourne",state:"VIC",postalCode:"3000",serviceAreas:[],days:["MONDAY"],opens:"09:00",closes:"17:00",allDay:false};
let draft;
await test("profile drafts persist independently of Google and require validation",async()=>{draft=await profileModule.saveProfileDraft("test",{googleAccountId:"a1",accountName:"accounts/10",settings});assert.equal(draft.status,"DRAFT");assert.equal(created,0);await assert.rejects(()=>profileModule.actOnProfileDraft("test",draft.id,"create"));});
await test("validated draft creates once using saved account and request ID",async()=>{await profileModule.actOnProfileDraft("test",draft.id,"validate");assert.equal(validated,1);assert.equal(created,0);await profileModule.actOnProfileDraft("test",draft.id,"create");await profileModule.actOnProfileDraft("test",draft.id,"create");assert.equal(created,1);assert.equal((await store.getRecord("test","profile-drafts",draft.id)).remoteName,"locations/created");});
await test("service-area payload omits storefront address and validates place IDs",()=>{const payload=profileModule.locationPayload({...settings,businessType:"SERVICE_AREA",serviceAreas:[{placeName:"Melbourne",placeId:"valid-place-id"}]});assert.equal(payload.storefrontAddress,undefined);assert.equal(payload.serviceArea.businessType,"CUSTOMER_LOCATION_ONLY");assert.throws(()=>profileModule.locationPayload({...settings,businessType:"SERVICE_AREA"}));});
const browserWorker=load("lib/browser-worker.ts");
let pairing;
await test("browser pairing is scoped and revocable",async()=>{pairing=await browserWorker.pairBrowser("test");const req=new Request("http://localhost:3100/api/automation/browser",{headers:{authorization:`Bearer ${pairing.token}`}});assert.equal(await browserWorker.browserWorkspace(req),"test");assert.equal((await browserWorker.browserStatus("test")).enabled,true);});
await test("browser profiles require a Google profile URL and eligible status",async()=>{await assert.rejects(()=>browserWorker.browserSync("test",{email:"one@example.com",profiles:[{title:"Bad",browserUrl:"https://attacker.invalid/n/1/profile",status:"VERIFIED"}]}));const result=await browserWorker.browserSync("test",{email:"one@example.com",profiles:[{title:"Browser business",browserUrl:"https://business.google.com/n/123/profile?fid=456",status:"VERIFIED"}]});assert.equal(result.verified,1);});
await test("browser and API workers cannot publish the same job",async()=>{const profile=(await store.listRecords("test","profiles")).find(p=>p.transport==="browser");await store.putRecord("test","posts","browser-due",{...base,id:"browser-due",profileId:profile.id,scheduledFor:"2000-01-01T00:00:00Z"});const before=posted;await runner.runWorkspaceQueue("test");assert.equal(posted,before);const job=await browserWorker.claimBrowserPost("test");assert.equal(job.post.id,"browser-due");assert.equal((await browserWorker.claimBrowserPost("test")).post,null);await assert.rejects(()=>browserWorker.completeBrowserPost("test",{id:job.post.id,claim:"wrong",status:"PUBLISHED",confirmed:true}));await browserWorker.completeBrowserPost("test",{id:job.post.id,claim:job.claim,status:"NEEDS_REVIEW",error:"Unconfirmed"});assert.equal((await store.getRecord("test","posts","browser-due")).status,"NEEDS_REVIEW");});
await test("stopping a browser worker revokes its credential",async()=>{await browserWorker.disableBrowser("test");await assert.rejects(()=>browserWorker.browserWorkspace(new Request("http://localhost:3100/api/automation/browser",{headers:{authorization:`Bearer ${pairing.token}`}})));});
console.log(`\n${tests} automation checks passed. No live Google posts or profiles were created.`);
} finally {globalThis.fetch=realFetch;}
