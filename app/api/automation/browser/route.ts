import {NextResponse} from "next/server";
import {requireWorkspace} from "@/lib/automation-auth";
import {apiError,readBody} from "@/lib/automation-http";
import {AutomationError} from "@/lib/automation-types";
import {browserWorkspace,browserStatus,pairBrowser,disableBrowser,browserSync,claimBrowserPost,completeBrowserPost} from "@/lib/browser-worker";
export const runtime="nodejs";
export async function GET(request:Request){try{const {workspaceId}=await requireWorkspace(request);return NextResponse.json(await browserStatus(workspaceId));}catch(e){return apiError(e);}}
export async function POST(request:Request){try{
  const body=await readBody(request);
  if(body.action==="pair"||body.action==="disable"){
    const {workspaceId}=await requireWorkspace(request);
    if(body.action==="pair")return NextResponse.json(await pairBrowser(workspaceId),{headers:{"Cache-Control":"no-store"}});
    await disableBrowser(workspaceId);return NextResponse.json({ok:true});
  }
  const workspaceId=await browserWorkspace(request);
  if(body.action==="sync")return NextResponse.json(await browserSync(workspaceId,body));
  if(body.action==="claim")return NextResponse.json(await claimBrowserPost(workspaceId));
  if(body.action==="result")return NextResponse.json(await completeBrowserPost(workspaceId,body));
  if(body.action==="heartbeat")return NextResponse.json({ok:true});
  throw new AutomationError("Invalid browser worker action.");
}catch(e){return apiError(e);}}
