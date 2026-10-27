import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const result = {};
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
const displayFont = await readFile('public/assets/fonts/barlow-condensed-800-latin.woff2');
await writeFile('components/manus/critical-font.css', `/* Critical display font is embedded in the cached stylesheet so it is ready at first paint. */\n@font-face { font-family: "Barlow Critical"; src: url("data:font/woff2;base64,${displayFont.toString('base64')}") format("woff2"); font-style: normal; font-weight: 800 900; font-display: block; }\n`);
