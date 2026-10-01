import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const app="https://gmb-autopilot-fawn.vercel.app";
const stateDir=path.join(root,".gmb-browser-state");
const configPath=path.join(stateDir,"autopilot-worker.json");
const args=new Set(process.argv.slice(2));
const requestedAccount=String(process.env.GMB_BROWSER_ACCOUNTS||"").split(",")[0].trim().toLowerCase();
const accountProfilePath=email=>path.join(
 root,
 ".gmb-browser-profiles",
 crypto.createHash("sha256").update(String(email||"").trim().toLowerCase()).digest("hex").slice(0,24)
);
const browserProfilePath=args.has("--sync")
 ? accountProfilePath(requestedAccount)
 : path.join(root,".gmb-browser-profile");
// Account sync must be visible. Google may require an interactive sign-in and a
// headless retry can be treated as a different/unsupported browser session.
// Using one persistent, visible context lets the user sign in once and allows
// the same run to continue importing profiles immediately afterwards.
const googleScheduleMode=args.has("--google-schedule");
const visible=args.has("--pair")||args.has("--google-login")||args.has("--sync")||args.has("--verify")||args.has("--visible")||googleScheduleMode;
async function launchContext(profilePath,isVisible=visible){
 return await chromium.launchPersistentContext(profilePath,{
  channel:"msedge",
  headless:!isVisible,
  viewport:{width:1440,height:1000},
  args:["--disable-background-mode"]
 });
}
let context=await launchContext(browserProfilePath);
let page=await context.newPage();page.setDefaultTimeout(15000);
let publishingEmail="";
async function usePublishingAccount(email){
 const normalized=String(email||"").trim().toLowerCase();
 if(!normalized)throw new Error("The queued profile has no saved browser account email. Sync profiles again.");
 if(publishingEmail===normalized)return;
 await context.close();
 context=await launchContext(accountProfilePath(normalized),visible);
 page=await context.newPage();page.setDefaultTimeout(15000);
 publishingEmail=normalized;
}
let config;
async function rpc(body){
 const response=await fetch(`${app}/api/automation/browser`,{method:"POST",headers:{Authorization:`Bearer ${config.token}`,"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 const result=await response.json();if(!response.ok)throw new Error(result.error||"Browser connection failed.");return result;
}
async function currentGoogleEmail(){
 const account=page.locator('[aria-label^="Google Account:"]');
 await account.first().waitFor({state:"visible"});
 const label=await account.first().getAttribute("aria-label");
 const email=label?.match(/\(([^\s()]+@[^\s()]+)\)/)?.[1]?.toLowerCase();
 if(!email)throw new Error("Cannot verify which Google account is active. Sign in to the browser worker again.");
 return email;
}
async function openManager(email){
 await page.goto(`https://business.google.com/locations${email?`?authuser=${encodeURIComponent(email)}`:""}`,{waitUntil:"domcontentloaded"});
 if(new URL(page.url()).hostname==="accounts.google.com"){
  // Never collect Google credentials inside Playwright. Google can reject that
  // automated context as an insecure browser. The manual server sees this
  // marker, opens ordinary Edge with this same dedicated profile, and resumes
  // the original sync automatically after the user closes that Edge window.
  throw new Error(`SECURE_EDGE_SIGNIN_REQUIRED:${email}`);
 }
 const actual=await currentGoogleEmail();
 if(email&&actual!==email)throw new Error(`Wrong Google account: expected ${email}, found ${actual}. No post was submitted.`);
 await page.getByRole("row").nth(1).waitFor({state:"visible"});
 return actual;
}
async function scanProfiles(email){
 const actual=await openManager(email);
 const results=[];
 for(let count=0;count<100;count++){
  const rows=await page.getByRole("row").all();
  for(const row of rows){
   const link=row.locator('a[href*="/n/"]').first();if(!await link.count())continue;
   const lines=(await link.innerText()).split("\n").map(s=>s.trim()).filter(Boolean);
   const cells=await row.getByRole("cell").allTextContents();
   const statusText=cells[3]?.trim();
   const record={title:lines[0],address:lines.slice(1).join(", "),browserUrl:await link.getAttribute("href"),status:statusText==="Verified"?"VERIFIED":statusText==="Suspended"?"SUSPENDED":/verification/i.test(statusText)?"VERIFICATION_REQUIRED":"UNKNOWN"};
   if(!results.some(p=>p.browserUrl===record.browserUrl))results.push(record);
  }
  const next=page.getByRole("button",{name:"Next",exact:true});
  if(!await next.count()||await next.getAttribute("aria-disabled")==="true"||!await next.isEnabled())break;
  const previous=(await page.getByRole("row").nth(1).innerText());
  await next.click();await page.waitForFunction(text=>document.querySelectorAll("tr")[1]?.innerText!==text,previous);
  if(count===99)throw new Error("More than 100 profile pages found. Sync did not complete.");
 }
 return {email:actual,profiles:results};
}
async function findProfileRow(profile){
 await openManager(profile.browserEmail);
 const target=new URL(profile.browserUrl).pathname;
 for(let count=0;count<100;count++){
  const row=page.getByRole("row").filter({has:page.locator(`a[href*="${target}"]`)});
  if(await row.count()===1){
   const title=(await row.locator('a[href*="/n/"]').first().innerText()).split("\n")[0].trim();
   if(title!==profile.title)throw new Error("The Google profile name changed. Sync profiles before posting.");
   return row;
  }
  const next=page.getByRole("button",{name:"Next",exact:true});
  if(!await next.count()||await next.getAttribute("aria-disabled")==="true")break;
  const previous=await page.getByRole("row").nth(1).innerText();await next.click();await page.waitForFunction(text=>document.querySelectorAll("tr")[1]?.innerText!==text,previous);
 }
 throw new Error("The exact target profile could not be found on this Google account.");
}
async function composerFor(profile){
 const row=await findProfileRow(profile);
 await row.getByRole("button",{name:"Create post",exact:true}).click();
 for(let i=0;i<40;i++){
  const frame=page.frames().find(frame=>/\/promote\/updates\/add/.test(frame.url()));
  if(frame&&await frame.locator("textarea").first().isVisible().catch(()=>false))return frame;
  await page.waitForTimeout(250);
 }
 throw new Error("Google's post composer could not be opened.");
}
async function fillComposer(frame,post){
 if(post.imageUrl)throw new Error("Browser publishing currently supports text and buttons. Remove the image URL or use the API publisher for this post.");
 await frame.locator("textarea").first().fill(post.summary);
 if(await frame.locator("textarea").first().inputValue()!==post.summary)throw new Error("Post text did not match the saved queue entry.");
 if(post.ctaType!=="NONE"){
  await frame.getByRole("button",{name:"Add link fields",exact:true}).click();
  const selected=frame.getByRole("button",{name:/^(None|Book|Order online|Buy|Learn more|Sign up|Call now)$/});
  await selected.click();
  const label={CALL:"Call now",LEARN_MORE:"Learn more",BOOK:"Book"}[post.ctaType];
  if(!label)throw new Error("Unsupported browser action button.");
  await frame.getByRole("menuitem",{name:label,exact:true}).click();
  if(post.ctaType!=="CALL"){
   const url=frame.getByRole("textbox",{name:/link|url/i});
   if(await url.count()!==1)throw new Error("Google's button-link field could not be identified safely.");
   await url.fill(post.url);
  }
  await frame.getByRole("button",{name:label,exact:true}).waitFor();
 }
}
function escapeRegExp(value){return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
function googleScheduleParts(post){
 const rounded=new Date(post.scheduledFor);
 rounded.setUTCSeconds(0,0);
 const remainder=rounded.getUTCMinutes()%30;
 if(remainder)rounded.setUTCMinutes(rounded.getUTCMinutes()+(30-remainder));
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-AU",{
  timeZone:post.timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
 }).formatToParts(rounded).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
 return {date:`${parts.year}-${parts.month}-${parts.day}`,displayDate:`${parts.day}/${parts.month}/${parts.year}`,time:`${parts.hour}:${parts.minute}`,scheduledFor:rounded.toISOString(),
  label:new Intl.DateTimeFormat("en-AU",{timeZone:post.timezone,day:"numeric",month:"short"}).format(rounded)};
}
async function setGoogleSchedule(frame,post){
 const schedule=googleScheduleParts(post);
 const switchControl=frame.getByRole("switch",{name:/Schedule(?: this)? post/i}).first();
 const checkbox=frame.getByRole("checkbox",{name:/Schedule(?: this)? post/i}).first();
 if(await switchControl.isVisible().catch(()=>false)){
  if(await switchControl.getAttribute("aria-checked")!=="true")await switchControl.click();
  if(await switchControl.getAttribute("aria-checked")!=="true")throw new Error("Google's Schedule this post switch did not turn on.");
 }else if(await checkbox.isVisible().catch(()=>false)){
  if(!await checkbox.isChecked())await checkbox.check();
  if(!await checkbox.isChecked())throw new Error("Google's Schedule this post checkbox did not turn on.");
 }else{
  const label=frame.getByText(/Schedule this post/i).first();
  if(!await label.isVisible().catch(()=>false))throw new Error("Google's Schedule this post control was not found.");
  const row=label.locator("xpath=..");
  const unlabeledSwitch=row.locator('[role="switch"], input[type="checkbox"], button').last();
  if(!await unlabeledSwitch.isVisible().catch(()=>false))throw new Error("Google's unlabeled Schedule this post switch was not found in its row.");
  await unlabeledSwitch.click();
 }
 await frame.waitForTimeout(300);
 const nativeDate=frame.locator('input[type="date"]').first();
 const nativeTime=frame.locator('input[type="time"]').first();
 const dateBox=await nativeDate.isVisible().catch(()=>false)?nativeDate:frame.getByRole("textbox",{name:/schedule.*date|date/i}).first();
 const timeBox=await nativeTime.isVisible().catch(()=>false)?nativeTime:frame.getByRole("combobox",{name:/time/i}).first();
 if(!await dateBox.isVisible().catch(()=>false)||!await timeBox.isVisible().catch(()=>false))throw new Error("Google's scheduling date or time field was not found.");
 await dateBox.fill(await nativeDate.isVisible().catch(()=>false)?schedule.date:schedule.displayDate);
 await timeBox.fill(schedule.time);
 if(!await nativeTime.isVisible().catch(()=>false)){
  const option=frame.getByRole("option",{name:new RegExp(`^${escapeRegExp(schedule.time)}$`,"i")}).first();
  if(!await option.isVisible().catch(()=>false))throw new Error(`Google did not offer the ${schedule.time} time slot.`);
  await option.click();
  await timeBox.press("Tab");
 }
 const actualDate=await dateBox.inputValue();const actualTime=await timeBox.inputValue();
 if(!actualDate.includes(schedule.date)&&!actualDate.includes(schedule.displayDate))throw new Error(`Google's scheduled date was not set to ${schedule.displayDate}.`);
 if(!actualTime.startsWith(schedule.time))throw new Error(`Google's scheduled time was not set to ${schedule.time}.`);
 if(await timeBox.getAttribute("aria-invalid")==="true")throw new Error(`Google rejected the scheduled time ${schedule.time}.`);
 return schedule;
}
async function publish(job){
 let clicked=false;
 try{
  const frame=await composerFor(job.profile);await fillComposer(frame,job.post);
  const schedule=googleScheduleMode?await setGoogleSchedule(frame,job.post):null;
  const postButton=frame.getByRole("button",{name:"Post",exact:true});
  if(await postButton.count()!==1)throw new Error("The final Post button could not be identified.");
  clicked=true;await postButton.click();
  for(let i=0;i<60;i++){
   for(const scope of page.frames()){
    const copy=scope.getByText(/Copy the update to other profiles that you manage/i);
    if(await copy.first().isVisible().catch(()=>false)){
     // Each saved job has its own exact target. Copying to others here would repeat queued jobs.
     const skip=scope.getByRole("button",{name:/^(Skip|No thanks|Not now)$/i});
     if(await skip.count()===1&&await skip.isVisible())await skip.click();
    }
    const confirmation=scope.getByText(/^(Your post (has been |was )?published[.!]?|Post published[.!]?|Your update is live[.!]?)$/i);
    if(!googleScheduleMode&&await confirmation.first().isVisible().catch(()=>false))return {status:"PUBLISHED",confirmed:true};
    // Google's newer composer closes into the "Your posts" list without a
    // toast. Confirm only when both this post's unique text prefix and a fresh
    // Published timestamp are visibly present in the same frame.
    const prefix=job.post.summary.slice(0,70).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const publishedCopy=scope.getByText(new RegExp(prefix,"i")).first();
    const recentPublished=scope.getByText(/Published\s+(?:just now|\d+\s+seconds?\s+ago|\d+\s+minutes?\s+ago)/i).first();
    if(!googleScheduleMode&&await publishedCopy.isVisible().catch(()=>false)&&await recentPublished.isVisible().catch(()=>false))
     return {status:"PUBLISHED",confirmed:true};
    if(googleScheduleMode){
     const scheduled=scope.getByText(new RegExp(`Scheduled\\s+${escapeRegExp(schedule.label)}`,"i")).first();
     if(await publishedCopy.isVisible().catch(()=>false)&&await scheduled.isVisible().catch(()=>false))
      return {status:"SUBMITTED",confirmed:true,scheduledForActual:schedule.scheduledFor};
    }
   }
   await page.waitForTimeout(500);
  }
  throw new Error(googleScheduleMode?"Google did not show the matching scheduled post and date. Review the profile before trying again.":"Google did not show an unambiguous publication confirmation. Review the profile before replacing this post.");
 }catch(error){return {status:clicked?"NEEDS_REVIEW":"FAILED",confirmed:false,error:error.message};}
}
try {
 await fs.mkdir(stateDir,{recursive:true});
 if(args.has("--google-login")){
  await page.goto("https://accounts.google.com/AddSession",{waitUntil:"domcontentloaded"});
  console.log("Complete Google sign-in in the visible browser. The worker will resume on the next run.");
  await page.waitForTimeout(60000);process.exitCode=0;
 }else{
  try{config=JSON.parse(await fs.readFile(configPath,"utf8"));}catch{}
  if(args.has("--pair")||!config){
   await page.goto(`${app}/api/google/oauth/start?mode=login`,{waitUntil:"domcontentloaded"});
   const owner=process.env.GMB_WORKSPACE_OWNER_EMAIL||"andys1stalt@gmail.com";
   const choice=page.getByText(owner,{exact:true});
   if(await choice.count()===1)await choice.click();
   const until=Date.now()+60000;
   while(!page.url().startsWith(`${app}/dashboard`)&&Date.now()<until){
    const continueButton=page.getByRole("button",{name:"Continue",exact:true});
    if(await continueButton.count()===1&&await continueButton.isVisible())await continueButton.click();
    await page.waitForTimeout(500);
   }
   if(!page.url().startsWith(`${app}/dashboard`))throw new Error("Complete Google sign-in in the visible browser, then run pairing again.");
   const session=await (await context.request.get(`${app}/api/automation/session`)).json();
   if(!session.authenticated||session.email.toLowerCase()!==owner.toLowerCase())throw new Error("The signed-in workspace owner does not match the requested owner. Pairing stopped.");
   const response=await context.request.post(`${app}/api/automation/browser`,{headers:{Origin:app},data:{action:"pair"}});
   const paired=await response.json();if(!response.ok())throw new Error(paired.error||"Pairing failed.");
   config={token:paired.token,expiresAt:paired.expiresAt,emails:[owner]};
   await fs.writeFile(configPath,JSON.stringify(config),{mode:0o600});
   console.log("Browser worker paired securely. No Google API credentials are required.");
  }
  const requested=process.env.GMB_BROWSER_ACCOUNTS?.split(",").map(v=>v.trim().toLowerCase()).filter(Boolean);
  if(requested)config.emails=requested;
  await rpc({action:"heartbeat"});
  let first;
  if(args.has("--sync")||args.has("--verify")){
   for(const email of config.emails){const scan=await scanProfiles(email);const result=await rpc({action:"sync",...scan});console.log(`${email}: ${result.profiles} profiles synced, ${result.verified} verified.`);if(!first)first=scan.profiles.find(p=>p.status==="VERIFIED");}
  }
  if(args.has("--verify")){
   if(!first)throw new Error("No verified browser profiles available to test.");
   const frame=await composerFor({...first,browserEmail:config.emails[0]});
   const previewPost={summary:"Browser automation preview. This draft is not published.",ctaType:"CALL",scheduledFor:new Date(Date.now()+86400000).toISOString(),timezone:"Australia/Melbourne"};
   await fillComposer(frame,previewPost);
   if(googleScheduleMode)await setGoogleSchedule(frame,previewPost);
   await page.screenshot({path:path.join(stateDir,"browser-composer-preview.png"),fullPage:true});
   console.log(`Verified: exact profile targeting, composer text, Call now button${googleScheduleMode?", and Google schedule fields":""}. The Post button was not clicked.`);
  }else if(!args.has("--sync")&&!args.has("--pair")){
   const maxJobs=googleScheduleMode?Math.min(25,Math.max(1,Number(process.env.GMB_GOOGLE_SCHEDULE_LIMIT||10))):100;
   for(let i=0;i<maxJobs;i++){
    const job=await rpc({action:googleScheduleMode?"claim-scheduled":"claim"});if(!job.post)break;
    await usePublishingAccount(job.profile.browserEmail);
    const result=await publish(job);
    const evidence=path.join(stateDir,`post-${job.post.id.replace(/[^a-zA-Z0-9_-]/g,"")}.png`);
    await page.screenshot({path:evidence,fullPage:true}).catch(()=>{});
    await rpc({action:"result",id:job.post.id,claim:job.claim,...result});
    console.log(`${job.profile.title}: ${result.status}${result.error?` — ${result.error}`:""}`);
    if(result.status==="NEEDS_REVIEW")break;
   }
  }
 }
}catch(error){
 await page.screenshot({path:path.join(stateDir,"browser-worker-error.png"),fullPage:true}).catch(()=>{});
 const diagnosticFrame=page.frames().find(frame=>/\/promote\/updates\/add/.test(frame.url()));
 if(diagnosticFrame)await fs.writeFile(path.join(stateDir,"browser-worker-error.html"),await diagnosticFrame.content()).catch(()=>{});
 console.error(error.message);process.exitCode=1;
}
finally{await context.close();}
