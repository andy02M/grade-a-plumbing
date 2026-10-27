import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

await mkdir('public/assets/performance', { recursive: true });
async function asset(label, extension, buffer) {
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 12);
  const url = `/assets/performance/${label}-${hash}.${extension}`;
  await writeFile(`public${url}`, buffer);
  return url;
}
const interFont = await asset('inter', 'woff2', await readFile('public/assets/fonts/inter-critical.woff2'));
const barlowFont = await asset('barlow', 'woff2', await readFile('public/assets/fonts/barlow-critical.woff2'));
const headerLogo = await asset('header-logo', 'webp', await readFile('public/assets/optimized/header-logo.webp'));
const logos=[];
for(const width of [128,192,256]){
  const palette=await sharp('public/assets/GradeAPlumberLogo-horizontal.png').resize({width}).png({palette:true,colours:32,dither:0}).toBuffer();
  logos.push({width,src:await asset(`header-logo-${width}`,'webp',await sharp(palette).webp({lossless:true,effort:6}).toBuffer())});
}
logos.push({width:384,src:headerLogo});
const hero = [];
for (const width of [480, 750, 1080, 1440]) {
  const buffer = await sharp('public/assets/sharp/01_Hero_Plumber_Under_Sink.jpg')
    .rotate().resize({width, withoutEnlargement:true}).avif({quality:45,effort:5}).toBuffer();
  hero.push({width,src:await asset(`hero-${width}`, 'avif', buffer),bytes:buffer.length});
}
const serviceImages={};
for(const file of await readdir('public/assets/sharp')){
  if(!/^(0[2-9]|1[0-3])_.*\.jpg$/i.test(file))continue;
  const variants=[];
  for(const width of [192,256,320,384,640]){
    const bytes=await sharp(`public/assets/sharp/${file}`).rotate().resize({width,withoutEnlargement:true}).avif({quality:40,effort:4}).toBuffer();
    variants.push({width,src:await asset(`${file.slice(0,2)}-service-${width}`,'avif',bytes)});
  }
  serviceImages[`/assets/sharp/${file}`]=variants.map(i=>`${i.src} ${i.width}w`).join(', ');
}
const galleryImages={};
for(const file of ['bathroom-shower.webp','bathroom-vanity.webp','built-in-bath.webp','double-vanity.webp','hot-water-system.webp','kitchen-cooktop.webp','kitchen-sink.webp','walk-in-shower.webp']){
  const variants=[];
  for(const width of [192,320,384,640]){
    const bytes=await sharp(`public/assets/project-photos/${file}`).rotate().resize({width,withoutEnlargement:true}).avif({quality:45,effort:4}).toBuffer();
    variants.push({width,src:await asset(`${file.replace('.webp','')}-${width}`,'avif',bytes)});
  }
  galleryImages[`/assets/project-photos/${file}`]=variants.map(i=>`${i.src} ${i.width}w`).join(', ');
}
await writeFile('data/performance-assets.json', JSON.stringify({interFont,barlowFont,headerLogo,headerLogoSrcSet:logos.map(i=>`${i.src} ${i.width}w`).join(', '),logos,serviceImages,galleryImages,heroSrcSet:hero.map(i=>`${i.src} ${i.width}w`).join(', '),hero},null,2)+'\n');
await writeFile('components/manus/critical-font.css', `/* Versioned, independently cached critical fonts. Original extended glyphs remain available. */
@font-face {font-family:"Barlow Critical";src:url("${barlowFont}") format("woff2");font-weight:800 900;font-style:normal;font-display:swap;unicode-range:U+0020-00FF,U+2000-2BFF;}
@font-face {font-family:"Inter Critical";src:url("${interFont}") format("woff2");font-weight:100 900;font-style:normal;font-display:swap;unicode-range:U+0020-00FF,U+2000-2BFF;}
@font-face {font-family:"Barlow Critical";src:url("/assets/fonts/barlow-condensed-800-latin.woff2") format("woff2");font-weight:800 900;font-style:normal;font-display:swap;unicode-range:U+0100-1FFF;}
`);
console.log('Prepared versioned fonts and AVIF hero:',hero.map(i=>`${i.width}px ${i.bytes} bytes`).join(', '));
