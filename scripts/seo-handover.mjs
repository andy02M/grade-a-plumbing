import {readFile, writeFile} from 'node:fs/promises';
import {readSeoConfiguration, locationReadiness} from './location-readiness.mjs';

// Reproducible report from recorded HTTP evidence; no external writes or credentials.
const candidate = JSON.parse(await readFile('output/seo-20261021/candidate-all-hosts.json', 'utf8'));
const {locations} = readSeoConfiguration('lib/locations.ts');
const {serviceIdentity} = readSeoConfiguration('lib/page-seo.ts');
const services = ['blocked-drains','sewer-repairs','pipe-relining','hot-water','emergency-plumber','burst-pipe-repair','gas-plumbing','commercial-plumbing','toilet-repairs','kitchen-plumbing','bathroom-plumbing','leak-detection'];
const rows = locationReadiness().inventory;
const lines = ['# Location assessment and keyword-to-page map', '', 'Generated from configuration and the local production-mode candidate crawl. HTTP success is not Google indexing, ranking or verified premises evidence. No search volumes are asserted.', '', '## Configured network', '', '| Location | Homepage / primary booking intent | HTTP / H1 | Service indexing policy | Evidence gaps |', '| --- | --- | --- | --- | --- |'];
for (const location of locations) {
  const record = rows.find(r => r.slug === location.slug);
  const page = candidate.results.find(r => r.location === location.slug && r.kind === 'location');
  lines.push(`| ${location.location} | [plumber ${location.location}](${location.website}/) | ${page?.status ?? 'not checked'} / ${page?.headings?.filter(h=>h.level===1).length ?? 'unknown'} | ${record?.serviceIndexingCurrentlyEnabled ? 'Enabled under existing policy' : 'Retain current noindex safeguards'} | ${record?.issues.join(' ') ?? 'Premises and public profile need verification.'} |`);
}
lines.push('', '## Booking intent: existing service URLs per location', '', 'These mappings identify the intended owner of each query, not permission to index every URL. Only hosts meeting the existing service-indexing policy are included in the full service crawl. Do not remove noindex solely to increase page volume.', '');
for (const location of locations) {
  lines.push(`### ${location.location}`, '', '| Booking query | Existing destination |', '| --- | --- |');
  for (const slug of services) {
    const identity = serviceIdentity(slug, location.location);
    lines.push(`| ${identity.label} ${location.location} | ${location.website}/${slug}/ |`);
  }
  lines.push('');
}
lines.push('## Informational intent and gaps', '', '- General maintenance, comparison and preparation questions belong on https://melbourne.gradeaplumbing.store/blog/; link to the relevant service and genuinely relevant suburb, rather than creating suburb-swapped articles.', '- CCTV inspection, hydro-jetting and stormwater diagnosis should first be covered within the blocked-drains assessment journey. Dedicated booking pages require distinct service scope and evidence, not just a new keyword.', '- Hot-water pages need supported repair-versus-replacement, system suitability and rebate eligibility explanations. Do not imply universal grants or fixed prices.', '- Pipe-relining and sewer pages must distinguish diagnosis, suitability, access, alternatives and post-work checks. Avoid guaranteed outcomes.', '- Shared About, Reviews, Our Work and Service Areas pages need a deliberate corporate canonical strategy; do not rewrite them 82 times to disguise duplication.', '', '## Expansion targets: not approved new pages', '', '| Target | Supplied status | Missing evidence / action |', '| --- | --- | --- |');
for (const record of rows.filter(r=>!r.configured)) lines.push(`| ${record.slug} | ${record.suppliedProfiles.map(p=>p.status).join(', ')} | ${record.issues.join(' ')} |`);
await writeFile('docs/seo-20261025-location-map.md', lines.join('\n')+'\n');
await writeFile('docs/seo-20261025-url-inventory.json', JSON.stringify({scope:'Local production-mode candidate: all configured host contexts using x-forwarded-host; not live indexing verification', checkedAt:candidate.checkedAt, summary:candidate.summary, urls:candidate.results.map(r=>({url:r.url,kind:r.kind,status:r.status,title:r.title,canonical:r.canonical,robots:r.robots,h1:r.headings?.filter(h=>h.level===1).map(h=>h.text)}))},null,2)+'\n');
console.log(`Wrote ${locations.length} location assessments, ${locations.length*services.length} service intent mappings and ${candidate.results.length} checked URL records.`);
