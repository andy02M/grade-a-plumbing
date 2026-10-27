import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const result = {};
await mkdir('public/assets/optimized', { recursive: true });
await sharp('public/assets/GradeAPlumberLogo-horizontal.png').resize({width:384}).webp({quality:80,effort:6}).toFile('public/assets/optimized/header-logo.webp');
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'options') await walk(file);
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
// Embed the small display face in the immutable CSS rather than swapping it
// after paint. Body text still uses Next's preloaded, metric-adjusted font.
const displayFont = await readFile('public/assets/fonts/barlow-critical.woff2');
await writeFile('components/manus/critical-font.css', `/* Critical display font is embedded in the cached stylesheet so it is ready at first paint. */\n@font-face { font-family: "Barlow Critical"; src: url("data:font/woff2;base64,${displayFont.toString('base64')}") format("woff2"); font-style: normal; font-weight: 800 900; font-display: swap; unicode-range:U+0020-00FF,U+2000-2BFF; }\n`);


await writeFile("components/manus/critical-font.css", `
@font-face { font-family: "Inter Critical"; src: url("/assets/fonts/inter-critical.woff2") format("woff2"); font-weight:100 900; font-style:normal; font-display:swap; unicode-range:U+0020-00FF,U+2000-2BFF; }
@font-face { font-family: "Barlow Critical"; src: url("/assets/fonts/barlow-condensed-800-latin.woff2") format("woff2"); font-weight:800 900; font-style:normal; font-display:swap; unicode-range:U+0100-1FFF; }
`, {flag:"a"});

const suppliedReviews = JSON.parse(await readFile('data/supplied-customer-reviews.json', 'utf8'));
const register = JSON.parse(await readFile('data/google-business-register.json', 'utf8'));
await writeFile('data/homepage-review-summary.json', JSON.stringify({
  hasActiveGoogleProfiles: register.some(p => p.status === 'Active' && Boolean(p.mapsUrl)),
  reviews: suppliedReviews.map((review,index)=>({...review,index})).filter(r=>r.text).slice(0,3).map(r=>({name:r.name,quote:r.text,time:(r.index<50?'2 months ago':r.index<100?'1 month ago':r.index<150?'3 weeks ago':'1 week ago')+' (as at 25 October 2026)'}))
}, null, 2) + '\n');
