import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { runInNewContext } from "node:vm";
import { locationReadiness, unconfiguredHost } from "./location-readiness.mjs";
test("unknown wildcard hosts cannot silently resolve to Melbourne", () => {
 for (const item of locationReadiness().inventory) {
  assert.equal(unconfiguredHost(new URL(item.targetUrl).hostname), !item.configured);
 }
 for (const host of ["www.gradeaplumbing.store", "gradeaplumbing.store", "localhost:3000", "preview.vercel.app", "COBURG.GRADEAPLUMBING.STORE:443"]) assert.equal(unconfiguredHost(host), false);
 assert.equal(unconfiguredHost("not-a-location.gradeaplumbing.store"), true);
 assert.match(readFileSync(new URL("../lib/location-request.ts", import.meta.url), "utf8"), /if \(isUnconfiguredLocationHost\(host\)\) notFound\(\)/);
});
test("location readiness accounts for every target without silently expanding hosts", () => {
 const report = locationReadiness();
 assert.equal(report.summary.targets, 100);
 assert.equal(report.summary.configured, 82);
 assert.equal(report.summary.expansionTargets, 18);
 assert.equal(report.summary.sourceLinkedLocalGuidance, 6);
 assert.equal(report.summary.incompleteRecordedAddresses, 2);
 assert.ok(report.inventory.every(item => item.expansionApproved === false));
 assert.ok(report.inventory.filter(item => !item.configured).every(item => !item.serviceIndexingCurrentlyEnabled));
 assert.equal(report.inventory.find(item => item.slug === "melbourne").suppliedProfiles.length, 2);
});
test("local guidance is distinct, sourced and limited to configured locations", () => {
 const guidance = JSON.parse(readFileSync(new URL("../data/local-guidance.json", import.meta.url), "utf8"));
 const configured = new Set(locationReadiness().inventory.filter(item => item.configured).map(item => item.slug));
 const headings = new Set();
 for (const [slug, entry] of Object.entries(guidance)) {
  assert.ok(configured.has(slug));
  assert.ok(!headings.has(entry.heading)); headings.add(entry.heading);
  assert.equal(entry.checkedDate, "2026-10-01");
  assert.ok(entry.paragraphs.length >= 2 && entry.faqs.length >= 2);
  assert.ok(entry.relatedServices.length && entry.sources.length);
  for (const source of entry.sources) {
   const url = new URL(source.url);
   assert.equal(url.protocol, "https:");
   assert.ok(url.hostname.endsWith(".vic.gov.au") || url.hostname === "www.gww.com.au");
  }
 }
});
test("local guidance FAQs are visible and included in homepage schema", () => {
 const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
 assert.match(home, /localGuidance\[location.slug\]\?\.faqs/);
 assert.match(home, /<LocalGuidanceSection/);
 assert.match(home, /mainEntity: faq.map/);
 assert.match(home, /<FAQ items=\{faq\}/);
 assert.doesNotMatch(home, /Recent plumbing work for homes and businesses near/);
});
test("complete supplied profile register preserves separate Melbourne profiles", () => {
 const records = JSON.parse(readFileSync(new URL("../data/google-business-register.json", import.meta.url), "utf8"));
 assert.equal(records.length, 101);
 assert.equal(new Set(records.map(record => record.locationSlug)).size, 100);
 assert.equal(records.filter(record => record.status === "Active").length, 78);
 const melbourne = records.filter(record => record.locationSlug === "melbourne");
 assert.equal(melbourne.length, 2);
 assert.notEqual(melbourne[0].mapsUrl, melbourne[1].mapsUrl);
 assert.equal(records.find(record => record.locationSlug === "thomastown").status, "Suspended");
 assert.equal(records.find(record => record.locationSlug === "mornington").status, "Active");
});
test("each service has distinct practical explanations and FAQs", () => {
 const source = readFileSync(new URL("../lib/service-editorial.ts", import.meta.url), "utf8");
 const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
 const context = { exports: {} }; runInNewContext(output, context);
 const entries = Object.values(context.exports.serviceEditorial);
 assert.equal(entries.length, 8);
 const questions = new Set();
 for (const entry of entries) {
  assert.ok(entry.sections.length >= 2 && entry.faqs.length >= 2);
  for (const faq of entry.faqs) { assert.ok(!questions.has(faq.question)); questions.add(faq.question); }
 }
});
test("dashboard shell is excluded from search and services link to editorial host", () => {
 assert.match(readFileSync(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8"), /index:\s*false/);
 assert.match(readFileSync(new URL("../app/[service]/page.tsx", import.meta.url), "utf8"), /site\.baseUrl.*\/blog\//);
});
test("upgraded public guides meet the long-form editorial baseline", () => {
 const slugs = new Set();
 for (const file of ["hot-water-guide", "blocked-drains-guide", "sewer-repair-guide", "coburg-booking-article"]) {
  const source = readFileSync(new URL(`../lib/${file}.ts`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {} }; runInNewContext(output, context);
  const article = Object.values(context.exports)[0];
  const body = article.sections.flatMap(section => section.paragraphs).join(" ");
  const count = body.split(/\s+/).length;
  assert.ok(count >= 1200 && count <= 2000, `${file}: ${count} words`);
  assert.equal(article.status, "published");
  assert.ok(article.updatedDate && article.sources.length >= 2);
  assert.ok(article.relatedServices.length && article.relatedArticles.length);
  assert.ok(!slugs.has(article.slug)); slugs.add(article.slug);
  assert.ok(body.includes("(02) 5837 5457") && body.includes("support@gradeaplumbing.store"));
  for (const source of article.sources) assert.equal(new URL(source.url).protocol, "https:");
 }
});
const locations = readFileSync(
  new URL("../lib/locations.ts", import.meta.url),
  "utf8",
);
const services = readFileSync(
  new URL("../lib/seo-services.ts", import.meta.url),
  "utf8",
);
const sitemap = readFileSync(
  new URL("../app/sitemap.ts", import.meta.url),
  "utf8",
);
const robots = readFileSync(
  new URL("../app/robots.ts", import.meta.url),
  "utf8",
);
const articles = readFileSync(
  new URL("../lib/articles.ts", import.meta.url),
  "utf8",
);
test("all location hostnames use the required domain", () =>
  assert.match(locations, /hostname: `\$\{slug\}\.gradeaplumbing\.store`/));
test("location slug strips spaces and punctuation", () =>
  assert.match(locations, /replace\(\/\[\^a-z0-9\]\/g, ""\)/));
test("all priority money routes exist", () => {
  for (const slug of [
    "blocked-drains",
    "sewer-repairs",
    "pipe-relining",
    "hot-water",
    "emergency-plumber",
    "burst-pipe-repair",
    "gas-plumbing",
    "commercial-plumbing",
  ])
    assert.match(services, new RegExp(`slug: "${slug}"`));
});
test("canonicals are self-referencing per hostname", () =>
  assert.match(services, /serviceUrl/));
test("drafts are filtered and sitemap uses only published articles", () => {
  assert.match(articles, /status==="published"/);
  assert.match(sitemap, /publishedArticles/);
});
test("private operational routes are disallowed", () => {
  assert.match(robots, /\/dashboard\//);
  assert.match(robots, /\/api\//);
});
test("schema omits private address and fake ratings", () => {
  assert.doesNotMatch(services, /aggregateRating|PostalAddress/);
});
test("every unique location has nearby suburb data", () => {
  const generated = readFileSync(
    new URL("../lib/generated-nearby-suburbs.ts", import.meta.url),
    "utf8",
  );
  const block = locations.slice(
    locations.indexOf("const profiles = ["),
    locations.indexOf("] as const;"),
  );
  const names = [...block.matchAll(/"Grade A Plumb(?:er|ing) ([^"]+)"/g)].map(
    (match) => match[1],
  );
  for (const name of new Set(names))
    assert.match(
      generated,
      new RegExp(`"${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}"\\s*:`),
      `missing nearby suburbs for ${name}`,
    );
});
test("phone and email actions use verified targets", () => {
  const site = readFileSync(new URL("../lib/site.ts", import.meta.url), "utf8");
  assert.match(site, /phoneHref: "tel:0258375457"/);
  assert.match(site, /email: "support@gradeaplumbing\.store"/);
  assert.match(site, /emailHref: "mailto:support@gradeaplumbing\.store"/);
});
test("quote form posts to validated email handler", () => {
  const form = readFileSync(
    new URL("../components/ContactForm.tsx", import.meta.url),
    "utf8",
  );
  const route = readFileSync(
    new URL("../app/api/quote/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(form, /fetch\("\/api\/quote"/);
  assert.match(route, /RESEND_API_KEY/);
  assert.match(route, /to: \[site\.email\]/);
  for (const field of ["name", "phone", "suburb", "service"])
    assert.match(route, new RegExp(`payload\\.${field}`));
});
test("duplicate editorial pages consolidate on the Melbourne host", () => {
  const blog = readFileSync(
    new URL("../app/blog/page.tsx", import.meta.url),
    "utf8",
  );
  const article = readFileSync(
    new URL("../app/blog/[slug]/page.tsx", import.meta.url),
    "utf8",
  );
  for (const source of [blog, article]) {
    assert.match(source, /site\.baseUrl/);
    assert.match(source, /permanentRedirect/);
    assert.match(source, /index: false/);
  }
});
test("the network has a sitemap index and crawlable storefront links", () => {
  const index = readFileSync(
    new URL("../app/sitemap-index.xml/route.ts", import.meta.url),
    "utf8",
  );
  const areas = readFileSync(
    new URL("../app/service-areas/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(index, /locations\.map/);
  assert.match(index, /sitemap\.xml/);
  assert.match(areas, /href=\{`\$\{item\.website\}\//);
});
test("known storefront addresses are structured and never generated", () => {
  const storefronts = readFileSync(
    new URL("../lib/storefronts.ts", import.meta.url),
    "utf8",
  );
  const home = readFileSync(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(storefronts, /streetAddress/);
  assert.match(storefronts, /addressCountry: "AU"/);
  assert.match(home, /PostalAddress/);
  assert.match(home, /location\.address/);
});
