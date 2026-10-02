import { chromium } from "playwright";

const targets = process.argv.slice(2);
if (!targets.length) targets.push("https://melbourne.gradeaplumbing.store/", "https://coburg.gradeaplumbing.store/", "https://ballarat.gradeaplumbing.store/", "https://melbourne.gradeaplumbing.store/blocked-drains/", "https://melbourne.gradeaplumbing.store/blog/how-long-does-a-hot-water-system-last/");
const browser = await chromium.launch({headless:true});
try {
 for (const url of targets) {
  const context = await browser.newContext({viewport:{width:375,height:812},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  // Lab visits must not contaminate production customer measurements.
  await context.route("**/api/measurement/**", route => route.fulfill({status:204}));
  const page = await context.newPage(); const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
  await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
  await page.addInitScript(()=>{
   window.__lab={lcp:null,cls:0};
   new PerformanceObserver(list=>{for(const e of list.getEntries())window.__lab.lcp=e.startTime;}).observe({type:"largest-contentful-paint",buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__lab.cls+=e.value;}).observe({type:"layout-shift",buffered:true});
  });
  const response = await page.goto(url,{waitUntil:"networkidle",timeout:60000});
  await page.waitForTimeout(2000);
  const result = await page.evaluate(()=>{
   const nav=performance.getEntriesByType("navigation")[0];
   const resources=performance.getEntriesByType("resource");
   return {lcpMs:window.__lab.lcp,observedLayoutShift:window.__lab.cls,ttfbMs:nav.responseStart,domContentLoadedMs:nav.domContentLoadedEventEnd,transferBytes:resources.reduce((n,r)=>n+r.transferSize,nav.transferSize),viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,largestResources:resources.sort((a,b)=>b.transferSize-a.transferSize).slice(0,5).map(r=>({url:r.name,bytes:r.transferSize}))};
  });
  console.log(JSON.stringify({kind:"single-run mobile lab sample; not field CWV or a Lighthouse score",url,status:response.status(),...result}));
  await context.close();
 }
} finally { await browser.close(); }
