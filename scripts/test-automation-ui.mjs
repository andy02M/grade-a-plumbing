import assert from "node:assert/strict";
import { chromium } from "playwright";
import fs from "node:fs/promises";

const base="http://localhost:3100";
const browser=await chromium.launch({channel:"msedge",headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];page.on("pageerror",e=>errors.push(e.message));
const now=new Date().toISOString();
const state={accounts:[{id:"test-account",email:"example@example.com",name:"Example business owner",status:"CONNECTED"}],profiles:[{id:"test-profile",googleAccountId:"test-account",accountName:"accounts/1",locationName:"locations/2",title:"Example Plumbing",city:"Melbourne",phone:"+61390000000",address:"Example address, Melbourne",status:"UNKNOWN",canOperateLocalPost:true,transport:"browser"}],templates:[],posts:[],drafts:[],events:[],settings:{timezone:"Australia/Melbourne"},capabilities:{schedulerConfigured:true,schedulerNote:"Browser runner publishes when clicked.",googleNote:"Browser automation mode.",legacyNote:"Due posts are published by clicking Run browser posts now."}};
let authenticated=true;
await page.route("**/api/**",async route=>{
 const url=new URL(route.request().url());const body=route.request().postDataJSON();let result;
 if(url.pathname==="/api/automation/session")result={authenticated,email:"owner@example.com"};
 else if(url.pathname==="/api/automation/state")result=state;
 else if(url.pathname==="/api/automation/browser")result={enabled:true,lastSeenAt:now};
 else if(url.pathname==="/api/automation/templates"){
  if(route.request().method()==="DELETE")state.templates=state.templates.filter(t=>t.id!==body.id);
  else {const template={...body,id:body.id||"template-1",createdAt:now,updatedAt:now};state.templates=state.templates.filter(t=>t.id!==template.id);state.templates.push(template);result={template};}
 }
 else if(url.pathname==="/api/automation/posts") {state.posts.push({id:"post-1",...state.templates[0],profileId:"test-profile",profileTitle:"Example Plumbing",googleAccountId:"test-account",scheduledFor:"2099-09-14T00:00:00.000Z",timezone:"Australia/Melbourne",status:"SCHEDULED",createdAt:now,updatedAt:now});result={created:17,skipped:0};}
 else if(url.pathname==="/api/automation/profiles")result={businessAccounts:[{name:"accounts/1",accountName:"Example location group"}],profiles:state.profiles};
 else if(url.pathname==="/api/automation/categories")result={categories:[{name:"categories/gcid:plumber",displayName:"Plumber"}]};
 else if(url.pathname==="/api/automation/profile-drafts") {const draft={id:"draft-1",...body,status:"DRAFT",createdAt:now,updatedAt:now};state.drafts.push(draft);result={draft};}
 else throw new Error(`Unexpected test API ${url.pathname}`);
 await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(result||{ok:true})});
});
await page.route("http://127.0.0.1:53683/**",async route=>{
 const url=new URL(route.request().url());
 const result=url.pathname==="/status"?{ok:true,running:false,port:53683,lastRun:{startedAt:now,finishedAt:now,code:0,output:"ok"}}:{ok:true,started:true,running:false};
 await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(result)});
});
try {
 await page.goto(`${base}/dashboard`);await page.getByRole("heading",{name:"Simple posting control."}).waitFor();
 await fs.mkdir("artifacts/automation",{recursive:true});
 await page.screenshot({path:"artifacts/automation/dashboard-desktop.png",fullPage:true});
 await page.getByRole("button",{name:/GMB profiles/}).click();await page.getByText("Example Plumbing",{exact:true}).waitFor();
 await page.getByRole("button",{name:/Post templates/}).click();
 await page.getByLabel("Template name",{exact:true}).fill("Daily service update");
 await page.getByLabel("Post text",{exact:false}).fill("{{business_name}} can help in {{city}}.");
 await page.getByRole("button",{name:"Save template",exact:true}).click();await page.getByText("Daily service update",{exact:true}).waitFor();
 await page.getByRole("button",{name:/Schedule posts/}).click();
 await page.getByRole("button",{name:"Select visible eligible"}).click();
 await page.getByLabel("Daily service update").check();
 await page.getByLabel("First day",{exact:true}).fill("2099-09-14");await page.getByLabel("Last day",{exact:true}).fill("2099-09-30");
 await page.getByRole("button",{name:"Preview selected profiles"}).click();await page.getByText("Example Plumbing can help in Melbourne.",{exact:true}).waitFor();
 await page.getByRole("button",{name:"Schedule selected profiles",exact:true}).click();await page.getByText("17 profile posts saved to the queue. 0 existing slots skipped.").waitFor();
 await page.getByRole("button",{name:"Run browser posts now"}).click();
 await page.getByRole("navigation",{name:"Automation menu"}).getByRole("button",{name:/Create GMB/}).click();
 await page.getByLabel("Google account",{exact:true}).selectOption("test-account");
 await page.getByRole("button",{name:"Load business accounts"}).click();await page.getByText("1 business accounts available.").waitFor();
 await page.getByLabel("Google Business Profile account",{exact:true}).selectOption("accounts/1");
 await page.getByLabel("Real-world business name").fill("Example second location");
 await page.getByLabel("Business type",{exact:true}).selectOption("SERVICE_AREA");
 await page.getByLabel("Service areas",{exact:false}).fill("Melbourne | test-place-id");
 assert.equal(await page.getByLabel("Service areas",{exact:false}).inputValue(),"Melbourne | test-place-id");
 await page.getByRole("button",{name:"Save profile draft",exact:true}).click();await page.getByText("Profile draft saved. Validate the saved settings before submitting.").waitFor();
 await page.screenshot({path:"artifacts/automation/profile-draft-desktop.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});
 for(const tab of ["Home","Gmail accounts","GMB profiles","Post templates","Schedule posts","Create GMB","Activity"]){await page.getByRole("navigation",{name:"Automation menu"}).getByRole("button",{name:new RegExp(tab)}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`No horizontal overflow on ${tab}`);}
 await page.getByRole("navigation",{name:"Automation menu"}).getByRole("button",{name:/Home/}).click();
 await page.screenshot({path:"artifacts/automation/dashboard-mobile.png",fullPage:true});
 authenticated=false;await page.reload();await page.getByRole("link",{name:/Continue with Google/}).waitFor();
 assert.equal(await page.getByRole("link",{name:/Continue with Google/}).getAttribute("href"),"/api/google/oauth/start?mode=login");
 assert.deepEqual(errors,[]);
 console.log("PASS dashboard navigation, template save, browser-run button, campaign preview/save, account-specific draft save, seven mobile tabs, unauthenticated login, and no browser errors. All API data was isolated test data.");
} finally {await browser.close();}
