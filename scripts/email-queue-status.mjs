import {readFile,writeFile} from 'node:fs/promises';
const queue=JSON.parse(await readFile('data/article-queue.json','utf8'));
const remaining=queue.filter(item=>item.status==='ready').length;
if(remaining>=7){console.log(`Queue healthy: ${remaining} ready articles.`);process.exit(0);}
const statePath='data/article-queue-alert.json';
let state={};try{state=JSON.parse(await readFile(statePath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
// One alert per queue batch/level, not repeated every recovery run.
const key=queue.map(item=>item.article.slug).join('|')+(remaining===0?'|empty':'|low');
if(state.key===key){console.log('Queue alert already sent for this batch.');process.exit(0);}
if(!process.env.RESEND_API_KEY)throw Error('Queue alert requires RESEND_API_KEY.');
const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`queue-${queue.length}-${queue.at(-1)?.article.slug}-${remaining===0?'empty':'low'}`},body:JSON.stringify({from:process.env.ALERT_FROM_EMAIL||'Grade A Plumbing <support@gradeaplumbing.store>',to:['andys1stalt@gmail.com'],subject:'Grade A Plumbing: article queue needs replenishing',text:`${remaining} reviewed articles remain. The publisher does not generate new articles automatically. Replenish the reviewed queue to continue daily posting. This alert does not imply a deployment failure.`}),signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error(`Queue alert rejected: HTTP ${response.status}`);
await writeFile(statePath,JSON.stringify({key,remaining,acceptedAt:new Date().toISOString()})+'\n');
console.log('Queue alert accepted by email provider; inbox delivery not independently verified.');
