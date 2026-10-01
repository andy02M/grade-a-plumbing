export async function planBrief(date,calendar,articles){
 if(!process.env.GEMINI_API_KEY)throw new Error("Missing GEMINI_API_KEY for planning.");
 const locations=[...new Set(calendar.map(b=>b.locationSlug))];
 const locationSlug=locations[(Math.floor(Date.parse(date)/86400000))%locations.length];
 const titles=[...calendar.map(b=>b.title),...articles.map(a=>a.title)];
 const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(process.env.GEMINI_MODEL||"gemini-2.5-flash")+":generateContent",{
  method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
  body:JSON.stringify({contents:[{parts:[{text:"Plan ONE distinct useful plumbing article for Grade A Plumbing targeting "+locationSlug+". Return JSON title,slug,targetKeyword. Do not duplicate or compete with these intents: "+JSON.stringify(titles)+". Choose a practical customer question or service guide; no invented local facts or suburb-swapped copies. Slug must be lowercase hyphenated ASCII."}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:1000}}),signal:AbortSignal.timeout(90000)
 });
 if(!response.ok)throw new Error("Topic planning HTTP "+response.status);
 const result=await response.json();
 const topic=JSON.parse(result.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"null");
 if(!topic||!["title","slug","targetKeyword"].every(k=>typeof topic[k]==="string"&&topic[k].trim())||!/^[-a-z0-9]+$/.test(topic.slug)||topic.slug.length>150)throw new Error("Invalid planned topic.");
 if(calendar.some(b=>b.slug===topic.slug||b.title.toLowerCase()===topic.title.toLowerCase())||articles.some(a=>a.slug===topic.slug))throw new Error("Duplicate planned topic; editorial input required.");
 return {date,time:"09:00",timezone:"Australia/Sydney",title:topic.title,slug:topic.slug,targetKeyword:topic.targetKeyword,locationSlug,status:"planned",publishedUrl:null};
}
