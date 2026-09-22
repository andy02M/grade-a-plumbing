import {chromium} from "playwright";
import path from "node:path";
const context=await chromium.launchPersistentContext(path.resolve(".gmb-browser-profile"),{channel:"msedge",headless:true});
try {
 const page=await context.newPage();
 if(process.argv.includes("--login")) {
  await page.goto("https://gmb-autopilot-fawn.vercel.app/api/google/oauth/start?mode=login",{waitUntil:"domcontentloaded"});
 } else {
  await page.goto("https://business.google.com/locations",{waitUntil:"domcontentloaded"});
  const row=page.getByRole("row").filter({has:page.getByRole("link",{name:/^Grade A Plumbing Melbourne/})});
  console.log("row",await row.innerText());
  console.log("rowhtml",(await row.innerHTML()).slice(0,8000));
  await row.getByRole("button",{name:"Create post",exact:true}).click();
 }
 await page.waitForTimeout(3000);
 for(const frame of page.frames())console.log(JSON.stringify({origin:new URL(frame.url()).origin,path:new URL(frame.url()).pathname,text:(await frame.locator("body").innerText().catch(()=>"")).slice(0,8000),controls:await frame.locator("input,textarea,button,[role=button]").evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,role:n.getAttribute("role"),name:n.getAttribute("name"),label:n.getAttribute("aria-label"),text:n.textContent?.trim().slice(0,120)})).slice(0,80)).catch(()=>[])}));
}finally{await context.close();}
