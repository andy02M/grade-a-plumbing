import crypto from "node:crypto";
import { listConnectedGoogleAccounts } from "./google-account-db-store";
import { getRecord, listRecords, putRecord, putRecords, redisCommand, withWorkspaceLock } from "./automation-store";
import { AutomationError, type AutomationProfile, type ScheduledPost } from "./automation-types";

const TOKENS = "gmb-autopilot:v2:browser-worker-tokens";
type Worker = { id: string; enabled: boolean; tokenHash: string; expiresAt: number; lastSeenAt?: string; lastError?: string; name: string };
export async function pairBrowser(workspaceId: string) {
  return withWorkspaceLock(workspaceId, "browser-pair", async()=>{
    const old = await getRecord<Worker>(workspaceId,"settings","browser");
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const worker: Worker = { id:crypto.randomUUID(), enabled:true, tokenHash, expiresAt:Date.now()+90*86400000, name:"Local browser worker" };
    await redisCommand(["HSET",TOKENS,tokenHash,JSON.stringify({workspaceId,id:worker.id,expiresAt:worker.expiresAt})]);
    await putRecord(workspaceId,"settings","browser",worker);
    if(old) await redisCommand(["HDEL",TOKENS,old.tokenHash]);
    return {token,expiresAt:worker.expiresAt};
  });
}
export async function browserWorkspace(request:Request) {
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||"";
  if(!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new AutomationError("Browser worker is not paired.",401);
  const hash=crypto.createHash("sha256").update(token).digest("hex");
  const raw=await redisCommand<string|null>(["HGET",TOKENS,hash]);
  if(!raw)throw new AutomationError("Browser pairing expired. Pair this computer again.",401);
  const record=JSON.parse(raw) as {workspaceId:string;id:string;expiresAt:number};
  const worker=await getRecord<Worker>(record.workspaceId,"settings","browser");
  if(!worker?.enabled||worker.id!==record.id||record.expiresAt<Date.now())throw new AutomationError("Browser worker has been stopped or expired.",401);
  await putRecord(record.workspaceId,"settings","browser",{...worker,lastSeenAt:new Date().toISOString()});
  return record.workspaceId;
}
export async function disableBrowser(workspaceId:string) {
  const worker=await getRecord<Worker>(workspaceId,"settings","browser");
  if(worker) {await putRecord(workspaceId,"settings","browser",{...worker,enabled:false});await redisCommand(["HDEL",TOKENS,worker.tokenHash]);}
}
export async function browserStatus(workspaceId:string) {
  const worker=await getRecord<Worker>(workspaceId,"settings","browser");
  return worker?{enabled:worker.enabled,lastSeenAt:worker.lastSeenAt,expiresAt:worker.expiresAt,name:worker.name,lastError:worker.lastError}:{enabled:false};
}
export async function browserSync(workspaceId:string, body:Record<string,unknown>) {
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new AutomationError("The browser must identify its signed-in Google account.");
  if(!Array.isArray(body.profiles)||body.profiles.length>1000)throw new AutomationError("Invalid browser profile list.");
  const accounts=await listConnectedGoogleAccounts(workspaceId);
  const accountId=accounts.find(a=>a.email.toLowerCase()===email)?.id||`browser-${crypto.createHash("sha256").update(email).digest("hex").slice(0,24)}`;
  const profiles:AutomationProfile[]=body.profiles.map(value=>{
    if(!value||typeof value!=="object")throw new AutomationError("Invalid profile.");
    const p=value as Record<string,unknown>;
    const url=new URL(String(p.browserUrl));
    if(url.origin!=="https://business.google.com"||!/^\/n\/\d+\/(?:profile|searchprofile)$/.test(url.pathname))throw new AutomationError("Invalid Google profile link.");
    const nativeId=url.pathname.split("/")[2];
    const title=String(p.title||"").trim();
    if(!title||title.length>300)throw new AutomationError("Invalid business name.");
    const status=["VERIFIED","SUSPENDED","VERIFICATION_REQUIRED"].includes(String(p.status))?String(p.status):"UNKNOWN";
    return {id:`browser-${crypto.createHash("sha256").update(`${accountId}:${nativeId}`).digest("hex").slice(0,24)}`,googleAccountId:accountId,accountName:"browser",locationName:`browser/${nativeId}`,title,address:String(p.address||"").slice(0,500),city:String(p.city||"").slice(0,200),status,canOperateLocalPost:status==="VERIFIED",syncedAt:new Date().toISOString(),transport:"browser",browserUrl:url.toString(),browserEmail:email};
  });
  await withWorkspaceLock(workspaceId,"queue",async()=>{
    const old=await listRecords<AutomationProfile>(workspaceId,"profiles");
    const stale=old.filter(p=>p.transport==="browser"&&p.googleAccountId===accountId&&!profiles.some(next=>next.id===p.id)).map(p=>({...p,status:"UNAVAILABLE",canOperateLocalPost:false}));
    await putRecords(workspaceId,"profiles",[...profiles,...stale]);
    await putRecord(workspaceId,"browser-accounts",accountId,{id:accountId,email,name:email,status:"BROWSER_CONNECTED",connectedAt:new Date().toISOString()});
  });
  return {profiles:profiles.length,verified:profiles.filter(p=>p.status==="VERIFIED").length};
}
export async function claimBrowserPost(workspaceId:string) {
  return withWorkspaceLock(workspaceId,"queue",async()=>{
    const posts=await listRecords<ScheduledPost>(workspaceId,"posts");
    const profiles=await listRecords<AutomationProfile>(workspaceId,"profiles");
    for(const post of posts.filter(p=>p.status==="PUBLISHING"&&p.browserClaim)) {
      if(Date.now()-Date.parse(post.updatedAt)>10*60000)await putRecord(workspaceId,"posts",post.id,{...post,status:"NEEDS_REVIEW",lastError:"Browser stopped during a publishing attempt. Review the profile before replacing this post."});
      else return {post:null};
    }
    const post=posts.filter(p=>p.status==="SCHEDULED"&&p.scheduledFor<=new Date().toISOString()&&profiles.find(profile=>profile.id===p.profileId)?.transport==="browser").sort((a,b)=>a.scheduledFor.localeCompare(b.scheduledFor))[0];
    if(!post)return {post:null};
    const profile=profiles.find(p=>p.id===post.profileId)!;
    if(!profile.canOperateLocalPost) {await putRecord(workspaceId,"posts",post.id,{...post,status:"FAILED",lastError:"Browser profile is not eligible for posting."});return {post:null};}
    const claim=crypto.randomUUID();
    const claimed:ScheduledPost={...post,status:"PUBLISHING",attempts:post.attempts+1,browserClaim:claim,updatedAt:new Date().toISOString()};
    await putRecord(workspaceId,"posts",post.id,claimed);
    return {post:claimed,profile,claim};
  });
}
export async function completeBrowserPost(workspaceId:string,body:Record<string,unknown>) {
  return withWorkspaceLock(workspaceId,"queue",async()=>{
    const post=await getRecord<ScheduledPost>(workspaceId,"posts",String(body.id));
    if(!post||!post.browserClaim||post.browserClaim!==body.claim)throw new AutomationError("Invalid browser publishing claim.",409);
    if(post.status!=="PUBLISHING")return {ok:true};
    if(!["PUBLISHED","NEEDS_REVIEW","FAILED"].includes(String(body.status)))throw new AutomationError("Invalid browser result.");
    const status=body.status as ScheduledPost["status"];
    if(status==="PUBLISHED"&&body.confirmed!==true)throw new AutomationError("Publication must be verified in Google before it can be recorded.");
    await putRecord(workspaceId,"posts",post.id,{...post,status,updatedAt:new Date().toISOString(),lastError:typeof body.error==="string"?body.error.slice(0,1500):undefined,remoteState:status==="PUBLISHED"?"BROWSER_CONFIRMED":undefined});
    return {ok:true};
  });
}
