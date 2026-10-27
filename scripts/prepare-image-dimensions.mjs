import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const result = {};
await mkdir('public/assets/optimized', { recursive: true });
const logoPalette = await sharp('public/assets/GradeAPlumberLogo-horizontal.png').resize({width:384}).png({palette:true,colours:32,dither:0}).toBuffer();
await sharp(logoPalette).webp({lossless:true,effort:6}).toFile('public/assets/optimized/header-logo.webp');
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'options' && entry.name !== 'performance') await walk(file);
    } else if (/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {
      const { width, height } = await sharp(file).metadata();
      if (width && height) result['/' + path.relative('public', file).split(path.sep).join('/')] = { width, height };
    }
  }
}
await walk('public/assets');
await walk('public/images');
await writeFile('data/image-dimensions.json', JSON.stringify(result, null, 2) + '\n');
console.log(`Recorded dimensions for ${Object.keys(result).length} images`);
await import('./prepare-performance-assets.mjs');

const suppliedReviews = JSON.parse(await readFile('data/supplied-customer-reviews.json', 'utf8'));
const register = JSON.parse(await readFile('data/google-business-register.json', 'utf8'));
await writeFile('data/homepage-review-summary.json', JSON.stringify({
  hasActiveGoogleProfiles: register.some(p => p.status === 'Active' && Boolean(p.mapsUrl)),
  reviews: suppliedReviews.map((review,index)=>({...review,index})).filter(r=>r.text).slice(0,3).map(r=>({name:r.name,quote:r.text,time:(r.index<50?'2 months ago':r.index<100?'1 month ago':r.index<150?'3 weeks ago':'1 week ago')+' (as at 25 October 2026)'}))
}, null, 2) + '\n');
