import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../lib/locations.ts", import.meta.url), "utf8");
const profilesBlock = source.match(/const profiles = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
const names = [...profilesBlock.matchAll(/"Grade A Plumb(?:er|ing) ([^"]+)"/g)].map((match) => match[1]);
const normalise = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const seen = new Map();
const duplicates = [];

for (const name of names) {
  const slug = normalise(name);
  if (seen.has(slug)) duplicates.push([seen.get(slug), name]);
  seen.set(slug, name);
}

const local = [...source.matchAll(/localIntroduction:\s*\n?\s*"([^"]+)"/g)].map((match) => match[1]);
const pairs = [];
const words = (value) => new Set(value.toLowerCase().match(/[a-z]{3,}/g) ?? []);

for (let first = 0; first < local.length; first += 1) {
  for (let second = first + 1; second < local.length; second += 1) {
    const a = words(local[first]);
    const b = words(local[second]);
    const score = [...a].filter((word) => b.has(word)).length / new Set([...a, ...b]).size;
    if (score >= 0.8) pairs.push({ first, second, similarity: score });
  }
}

console.log(JSON.stringify({
  locations: names.length,
  uniqueSlugs: seen.size,
  duplicateLocations: duplicates,
  highSimilarityPairs: pairs,
  threshold: 0.8,
}, null, 2));

if (duplicates.length) process.exitCode = 1;
