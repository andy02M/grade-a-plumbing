if(!process.env.RESEND_API_KEY)throw new Error("Failure email requires GitHub secret RESEND_API_KEY.");
const runUrl=process.env.FAILED_RUN_URL;
if(!runUrl?.startsWith("https://github.com/andy02M/grade-a-plumbing/actions/runs/"))throw new Error("Invalid run URL.");
const test=process.env.TEST_EMAIL==="true";
const response=await fetch("https://api.resend.com/emails",{
 method:"POST",headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"article-alert-"+process.env.FAILED_RUN_ID+(test?"-test":"")},
 body:JSON.stringify({from:process.env.ALERT_FROM_EMAIL||"Grade A Plumbing <support@gradeaplumbing.store>",to:["andys1stalt@gmail.com"],subject:test?"Grade A Plumbing: publishing alerts test":"Grade A Plumbing: daily article publishing failed",text:test?"Your cloud article failure alerts are configured. Run: "+runUrl:"The daily article workflow failed or was cancelled. Check the failed step and rerun after resolving the problem: "+runUrl+"\nNo successful publication is implied by this email."}),signal:AbortSignal.timeout(30000)
});
if(!response.ok)throw new Error("Failure email rejected: HTTP "+response.status);
console.log("Alert email accepted by provider.");
