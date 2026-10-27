import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const manifest=JSON.parse(await readFile(new URL('../data/performance-assets.json',import.meta.url),'utf8'));

test('immutable performance URLs fingerprint the bytes they serve',async()=>{
  const urls=[...new Set([manifest.interFont,manifest.barlowFont,manifest.headerLogo,...manifest.logos.map(i=>i.src),...manifest.hero.map(i=>i.src),...Object.values({...manifest.serviceImages,...manifest.galleryImages}).flatMap(srcset=>srcset.split(', ').map(item=>item.split(' ')[0]))])];
  for(const url of urls){
    assert.match(url,/^\/assets\/performance\/[a-z0-9-]+-[a-f0-9]{12}\.(woff2|webp|avif)$/);
    const bytes=await readFile(new URL('../public'+url,import.meta.url));
    const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
    assert.ok(url.includes('-'+hash+'.'),'cached URL must change when asset bytes change');
  }
});
test('responsive hero files decode at their advertised widths and logo stays small',async()=>{
  for(const variant of manifest.hero){
    const bytes=await readFile(new URL('../public'+variant.src,import.meta.url));
    const metadata=await sharp(bytes).metadata();
    assert.equal(metadata.width,variant.width);
    assert.ok(metadata.height>0);
    assert.equal(bytes.length,variant.bytes);
  }
  assert.ok((await readFile(new URL('../public'+manifest.headerLogo,import.meta.url))).length<8000);
});
