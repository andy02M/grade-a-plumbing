"use client";
import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";

function optedOut() {
 return navigator.doNotTrack==="1" || (navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl===true;
}
function report(payload: Record<string,unknown>) {
 if(optedOut())return;
 // No form fields, href destinations, query strings, identifiers or cookies.
 const body=JSON.stringify({...payload,path:window.location.pathname});
 try { const sent=navigator.sendBeacon?.("/api/measurement/",new Blob([body],{type:"application/json"}));if(!sent)void fetch("/api/measurement/",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true,credentials:"omit"}).catch(()=>{}); } catch { /* Measurement must never affect booking. */ }
}
function reportVital(metric: {name:string;value:number}) {
 if(["LCP","CLS","INP"].includes(metric.name))report({event:"web_vital",metric:metric.name,value:metric.value});
}
export function SiteMeasurement() {
 useReportWebVitals(reportVital);
 useEffect(()=>{
  let previous="",at=0;
  const clicked=(event:MouseEvent)=>{
   if(event.defaultPrevented || !(event.target instanceof Element))return;
   const anchor=event.target.closest("a");const href=anchor?.getAttribute("href")??"";
   const action=href.startsWith("tel:")?"call_click":href.startsWith("mailto:")?"email_click":null;
   if(!action || !anchor)return;
   const placement=anchor.closest("header")?"header":anchor.closest("footer")?"footer":anchor.closest("main")?"main":"other";
   const key=`${action}:${placement}`;if(key===previous&&Date.now()-at<1000)return;
   previous=key;at=Date.now();report({event:action,placement});
  };
  document.addEventListener("click",clicked);return()=>document.removeEventListener("click",clicked);
 },[]);
 return null;
}
