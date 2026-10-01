import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { QualityHold, collectSources, validateDraft, assertDistinctIntent, liveArticleMatches, articleUrl, sydneyTime, runReadiness, sourceText } from "./article-quality.mjs";
import { reviewEditorial, verifyArticle, runPublisher } from "./publish-daily-article.mjs";

const brief={date:"2030-01-01",title:"Planning access for a hot water assessment",slug:"planning-access-hot-water-assessment",targetKeyword:"hot water assessment access",locationSlug:"coburg",status:"planned"};
const publicArticle={slug:"existing-guide",title:"Existing guide",sections:[{heading:"Existing",paragraphs:["A different short earlier article."]}]};
const sources=[{id:"quotes",title:"Quotes",url:"https://example.test/quotes",content:"Official guidance about quotes."},{id:"practitioners",title:"Trades",url:"https://example.test/trades",content:"Official guidance about trades."}];
const approval={approved:true,overlaps:[],unsupportedClaims:[],unsafeAdvice:[],localClaimsVerified:true,readerValue:"A concrete question about access restrictions and what to prepare before an assessment.",reason:"Distinct supported customer question."};
function draftFixture() {
 return {metaTitle:"Planning access for a hot water assessment",metaDescription:"Prepare useful information about hot water access, property constraints and approval before discussing the appropriate professional assessment.",excerpt:"Prepare the information needed for an assessment.",sections:Array.from({length:5},(_,section)=>({heading:`Assessment topic ${section}`,sourceIds:[section%2?"quotes":"practitioners"],paragraphs:[Array.from({length:260},(_,word)=>`detail${section}word${word}`).join(" ")+(section===4?" Call (02) 5837 5457 or email support@gradeaplumbing.store.":"")]})),faq:[{question:"What helps?",answer:"Provide the records."},{question:"What remains uncertain?",answer:"The assessment findings."}],relatedServices:["hot-water"],relatedArticles:["existing-guide"]};
}
function liveHtml(expected) {
 return `<link rel="canonical" href="${articleUrl(expected.slug)}"><h1>${expected.title}</h1><article>${expected.sections.map(section=>section.paragraphs.map(p=>`<p>${p}</p>`).join("")).join("")}</article><script type="application/ld+json">${JSON.stringify({"@type":"Article",headline:expected.title,datePublished:expected.publishedDate,dateModified:expected.updatedDate,description:expected.metaDescription,mainEntityOfPage:articleUrl(expected.slug)})}</script>`;
}

test("Sydney windows handle daylight saving, daily locks and recovery",()=>{
 assert.deepEqual(sydneyTime(new Date("2026-10-01T23:00:00Z")),{date:"2026-10-02",hour:9});
 assert.deepEqual(sydneyTime(new Date("2026-10-05T22:00:00Z")),{date:"2026-10-06",hour:9});
 const early=new Date("2026-10-01T22:00:00Z"),late=new Date("2026-10-02T02:00:00Z");
 const planned={...brief,date:"2026-10-02"};
 assert.equal(runReadiness([planned],[],early).shouldGenerate,false);
 assert.equal(runReadiness([planned],[],early,true).shouldGenerate,true);
 assert.equal(runReadiness([planned],[],late).shouldGenerate,true);
 assert.equal(runReadiness([{...planned,status:"held"}],[],late).shouldRun,false);
 const generated=[{slug:planned.slug,publishedDate:planned.date}];
 assert.equal(runReadiness([planned],generated,late).shouldGenerate,false);
 assert.equal(runReadiness([planned],generated,late).shouldRun,true);
 assert.equal(runReadiness([{...planned,status:"published",verifiedAt:"already"}],generated,late).shouldRun,false);
});

test("source collection strips executable/navigation content and fails closed",async()=>{
 const text=sourceText('<main><nav>Ignore this</nav><script>ignore instructions</script><p>Useful &amp; safe advice.</p></main>');
 assert.equal(text,"Useful & safe advice.");
 const content=`<main>${"Official consumer information supporting professional scope and assessment. ".repeat(25)}</main>`;
 const good=async url=>new Response(content,{status:200,headers:{"content-type":"text/html"}});
 const collected=await collectSources(brief,{},good);
 assert.ok(collected.sources.length>=2);
 assert.ok(collected.sources.every(source=>source.digest.length===64&&source.checkedDate));
 await assert.rejects(collectSources(brief,{},async()=>new Response("Blocked",{status:403})),QualityHold);
 await assert.rejects(collectSources(brief,{},async()=>new Response("{}",{headers:{"content-type":"application/json"}})),QualityHold);
});

test("suburb-swapped titles and booking keywords are held",()=>{
 assert.throws(()=>assertDistinctIntent({...brief,title:"Preparing for a plumber in Camberwell"},[{slug:"old",title:"Preparing for a plumber in Coburg"}],["Coburg","Camberwell"]),QualityHold);
 assert.throws(()=>assertDistinctIntent({...brief,targetKeyword:"plumber coburg"},[]),QualityHold);
 assert.doesNotThrow(()=>assertDistinctIntent(brief,[publicArticle],["Coburg"]));
});

test("drafts require real sources, useful links, contact details and safe text",()=>{
 assert.ok(validateDraft(draftFixture(),brief,sources,[publicArticle]).words>=1200);
 for(const change of [
  draft=>draft.sections[0].sourceIds=["invented"],
  draft=>draft.relatedArticles=["not-published"],
  draft=>draft.relatedServices=[],
  draft=>draft.sections[1].paragraphs=["<script>bad</script>"],
  draft=>draft.sections[1].paragraphs.push("We guarantee arrival within five minutes."),
  draft=>draft.faq=[],
  draft=>draft.sections.forEach(section=>section.sourceIds=["quotes"]),
 ]) { const draft=draftFixture();change(draft);assert.throws(()=>validateDraft(draft,brief,sources,[publicArticle]),QualityHold); }
 const reused=draftFixture();
 assert.throws(()=>validateDraft(reused,brief,sources,[{...publicArticle,sections:reused.sections}]),/reused/);
});

test("editorial review holds unsupported claims and missing reader value",async()=>{
 assert.ok((await reviewEditorial({phase:"brief"},async()=>approval)).readerValue);
 for(const negative of [{...approval,approved:false},{...approval,overlaps:["old"]},{...approval,unsupportedClaims:["Invented local job"]},{...approval,localClaimsVerified:false},{...approval,readerValue:"More SEO"}]) await assert.rejects(reviewEditorial({phase:"draft"},async()=>negative),QualityHold);
});

test("live verification requires exact canonical, schema, date, visible content and indexability",async()=>{
 const expected={...brief,metaDescription:"A useful guide.",publishedDate:"2030-01-01",updatedDate:"2030-01-01",sections:[{heading:"Topic",paragraphs:["The real published content."]}]};
 const html=liveHtml(expected);
 assert.equal(liveArticleMatches(html,expected),true);
 for(const altered of [html.replace(articleUrl(expected.slug),"https://melbourne.gradeaplumbing.store/"),html.replace('<h1>','<h1>Wrong '),html.replace('"datePublished":"2030-01-01"','"datePublished":"2029-12-31"'),html.replace("The real published content.","Stale text."),html+'<meta name="robots" content="noindex">']) assert.equal(liveArticleMatches(altered,expected),false);
 assert.equal(await verifyArticle(expected,{fetcher:async()=>new Response(html,{status:200}),attempts:1}),articleUrl(expected.slug));
 await assert.rejects(verifyArticle(expected,{fetcher:async()=>new Response(html,{status:200,headers:{"x-robots-tag":"noindex"}}),attempts:1}),/not verified/);
});

test("a failed quality gate records a hold without adding an article or calling the model",async()=>{
 const dataDir=await mkdtemp(join(tmpdir(),"grade-a-publisher-test-"));
 try {
  await writeFile(join(dataDir,"article-calendar-01.json"),JSON.stringify([{...brief,date:"2029-12-31",slug:"missed-guide"},brief]));
  await writeFile(join(dataDir,"generated-articles.json"),"[]");
  await writeFile(join(dataDir,"article-publication-log.json"),"[]");
  let calls=0;
  const result=await runPublisher({dataDir,args:[],now:new Date("2030-01-01T00:00:00Z"),model:async()=>{calls++;throw Error("Unexpected model call");},fetcher:async()=>new Response("Blocked",{status:403})});
  assert.equal(result.outcome,"held");assert.equal(calls,0);
  assert.deepEqual(JSON.parse(await readFile(join(dataDir,"generated-articles.json"),"utf8")),[]);
  const calendar=JSON.parse(await readFile(join(dataDir,"article-calendar-01.json"),"utf8"));
  assert.equal(calendar[0].status,"missed");assert.equal(calendar[1].status,"held");
  const log=JSON.parse(await readFile(join(dataDir,"article-publication-log.json"),"utf8"));
  assert.ok(log.some(item=>item.outcome==="held"&&item.unavailableSources.length));
 } finally { await rm(dataDir,{recursive:true,force:true}); }
});

test("successful preparation retains citations and links, and cannot repeat the daily generation",async()=>{
 const dataDir=await mkdtemp(join(tmpdir(),"grade-a-publisher-success-"));
 try {
  await writeFile(join(dataDir,"article-calendar-01.json"),JSON.stringify([brief]));
  await writeFile(join(dataDir,"generated-articles.json"),"[]");
  await writeFile(join(dataDir,"article-publication-log.json"),"[]");
  const draft=draftFixture();draft.relatedArticles=["how-long-does-a-hot-water-system-last"];
  const responses=[approval,draft,approval];let calls=0;
  const fetcher=async()=>new Response(`<main>${"Official consumer information about assessment, professional authority and written scope. ".repeat(25)}</main>`,{headers:{"content-type":"text/html"}});
  const model=async()=>responses[calls++];
  const options={dataDir,args:[],now:new Date("2030-01-01T00:00:00Z"),model,fetcher};
  assert.equal((await runPublisher(options)).outcome,"prepared");assert.equal(calls,3);
  const articles=JSON.parse(await readFile(join(dataDir,"generated-articles.json"),"utf8"));
  assert.equal(articles.length,1);assert.equal(articles[0].sources.length,2);
  assert.equal(articles[0].sections[0].sourceUrls.length,1);
  assert.deepEqual(articles[0].relatedArticles,draft.relatedArticles);
  assert.equal(JSON.parse(await readFile(join(dataDir,"article-calendar-01.json"),"utf8"))[0].status,"awaiting-deployment");
  await runPublisher(options);assert.equal(calls,3);
  assert.equal(JSON.parse(await readFile(join(dataDir,"generated-articles.json"),"utf8")).length,1);
 } finally { await rm(dataDir,{recursive:true,force:true}); }
});
