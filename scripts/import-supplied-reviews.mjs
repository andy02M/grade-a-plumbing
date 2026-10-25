import {readFile, writeFile} from 'node:fs/promises';

// Parse spreadsheet-pasted TSV, including quoted multiline testimonials.
export function parseTsv(text) {
  const rows=[]; let row=[], field='', quoted=false;
  for(let i=0;i<text.length;i++) {
    const char=text[i];
    if(quoted) {
      if(char==='"' && text[i+1]==='"'){field+='"';i++;}
      else if(char==='"') quoted=false;
      else field+=char;
    } else if(char==='"' && !field) quoted=true;
    else if(char==='\t'){row.push(field);field='';}
    else if(char==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}
    else field+=char;
  }
  if(quoted) throw new Error('Unclosed quoted testimonial');
  if(field || row.length){row.push(field);rows.push(row);}
  return rows;
}

export function importReviews(text) {
  const reviews=[], duplicates=[];const seen=new Set();let inSection=false, sections=0;
  for(const row of parseTsv(text)) {
    const name=row[0]?.trim();
    if(!name) continue;
    if(/^\d+\s*\|/.test(name)){inSection=true;sections++;continue;}
    if(!inSection || name==='Reviewer Name') continue;
    if(row.slice(2).some(value=>value.trim())) throw new Error(`Unexpected extra fields for ${name}`);
    const reviewText=(row[1]??'').replace(/\r\n/g,'\n').trim();
    const key=(name+'\n'+reviewText).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
    if(seen.has(key)){duplicates.push(name);continue;}
    seen.add(key);
    reviews.push({name,rating:5,...(reviewText?{text:reviewText}:{})});
  }
  return {reviews,summary:{sections,reviews:reviews.length,withText:reviews.filter(r=>r.text).length,ratingOnly:reviews.filter(r=>!r.text).length,duplicates}};
}

if(process.argv[2]) {
  const result=importReviews(await readFile(process.argv[2],'utf8'));
  await writeFile('data/supplied-customer-reviews.json',JSON.stringify(result.reviews,null,2)+'\n');
  console.log(JSON.stringify(result.summary,null,2));
}
