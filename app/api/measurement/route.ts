import { sanitiseMeasurement } from "@/lib/measurement";

export const runtime="nodejs";
const limits=new Map<string,{at:number;count:number}>();
export async function POST(request:Request) {
 if(request.headers.get("dnt")==="1" || request.headers.get("sec-gpc")==="1")return new Response(null,{status:204});
 const host=request.headers.get("x-forwarded-host")??request.headers.get("host")??"";
 const origin=request.headers.get("origin");
 try {if(!origin || new URL(origin).host!==host)return new Response(null,{status:403});}catch{return new Response(null,{status:403});}
 if(Number(request.headers.get("content-length"))>2048)return new Response(null,{status:413});
 try {
  const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400});
  let size=0;const chunks:Uint8Array[]=[];
  while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>2048){await reader.cancel();return new Response(null,{status:413});}chunks.push(chunk.value);}
  const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
  const text=new TextDecoder().decode(data);
  const event=sanitiseMeasurement(JSON.parse(text),host);if(!event)return new Response(null,{status:400});
  // Best-effort per-instance cap, not persistent visitor tracking or a WAF.
  const bucket=limits.get(event.locationSlug);const now=Date.now();
  if(bucket&&now-bucket.at<60000){if(++bucket.count>180)return new Response(null,{status:429});}
  else limits.set(event.locationSlug,{at:now,count:1});
  console.info("site_measurement",JSON.stringify(event));
  return new Response(null,{status:204});
 } catch {return new Response(null,{status:400});}
}
