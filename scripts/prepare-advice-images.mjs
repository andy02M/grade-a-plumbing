import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';

const source = 'C:/Users/andys/.codex/generated_images/01a0bbfc-3443-7c40-8fa9-b8e44e261e0c';
const output = 'public/images/plumbing-advice/generated';
const files = [
  ['exec-63f61190-2a27-4012-a7c6-af68387f1109.png','heat-pump-garden-v1'],
  ['exec-cd06b028-73e3-4294-9f9c-d36a343b685e.png','laundry-connections-v1'],
  ['exec-490f496f-fe4d-43d9-a2c4-ffe4629a74e3.png','rainwater-garden-v1'],
  ['exec-1db86771-8aef-4d70-946d-52904d2c0eb4.png','bathroom-planning-v1'],
];
await mkdir(output,{recursive:true});
for (const [input,name] of files) {
  const result = await sharp(join(source,input)).resize({width:1440,withoutEnlargement:true}).webp({quality:82}).toFile(join(output,name+'.webp'));
  console.log(name, result.width, result.height, result.size);
}
