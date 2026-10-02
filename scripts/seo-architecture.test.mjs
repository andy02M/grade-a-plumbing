import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { runInNewContext } from "node:vm";
import { locationReadiness, unconfiguredHost, readSeoConfiguration } from "./location-readiness.mjs";
test("homepage article selection excludes unrelated suburb guides and drafts", () => {
 const source = readFileSync(new URL("../lib/article-selection.ts", import.meta.url), "utf8");
 const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
 const context = { exports: {} }; runInNewContext(output, context);
 const select = context.exports.selectLocationArticles;
 const make = (slug, date, locations, status = "published") => ({slug, publishedDate:date, locationSlugs:locations, status});
 const catalog = [make("coburg", "2026-10-02", ["melbourne", "coburg"]), make("general", "2026-10-01", ["melbourne"]), make("richmond", "2026-09-20", ["richmond"]), make("unscoped", "2026-09-10", undefined), make("draft", "2026-10-03", ["richmond"], "draft")];
 assert.equal(JSON.stringify(select(catalog, "richmond").map(a => a.slug)), JSON.stringify(["richmond", "general", "unscoped"]));
 assert.equal(JSON.stringify(select(catalog, "altona").map(a => a.slug)), JSON.stringify(["general", "unscoped"]));
 assert.equal(select(catalog, "coburg")[0].slug, "coburg");
 assert.equal(select(catalog, "melbourne")[0].slug, "coburg");
 assert.equal(select([...catalog, catalog[1]], "altona").length, 2);
 assert.equal(select(catalog, "richmond", 1).length, 1);
 assert.equal(select(catalog, "richmond", 0).length, 0);
 assert.equal(catalog[0].slug, "coburg");
 const component = readFileSync(new URL("../components/ArticlesSection.tsx", import.meta.url), "utf8");
 assert.match(component, /selectLocationArticles\(publishedArticles, locationSlug\)/);
 assert.match(component, /href=\{`\$\{site\.baseUrl\}\/blog\/\$\{article\.slug\}\//);
});
test("unknown wildcard hosts cannot silently resolve to Melbourne", () => {
 for (const item of locationReadiness().inventory) {
  assert.equal(unconfiguredHost(new URL(item.targetUrl).hostname), !item.configured);
 }
 for (const host of ["www.gradeaplumbing.store", "gradeaplumbing.store", "localhost:3000", "preview.vercel.app", "COBURG.GRADEAPLUMBING.STORE:443"]) assert.equal(unconfiguredHost(host), false);
 assert.equal(unconfiguredHost("not-a-location.gradeaplumbing.store"), true);
 assert.match(readFileSync(new URL("../lib/location-request.ts", import.meta.url), "utf8"), /if \(isUnconfiguredLocationHost\(host\)\) notFound\(\)/);
});
test("service guides use both service relevance and location eligibility", () => {
 const page = readFileSync(new URL("../app/[service]/page.tsx", import.meta.url), "utf8");
 assert.match(page, /selectLocationArticles\(/);
 assert.match(page, /publishedArticles.filter\(article => article.relatedServices.includes\(slug\)\)/);
 assert.doesNotMatch(page, /\.sort\(\(a, b\) => Number\(Boolean/);
});
test("sitemap dates reflect recorded homepage and editorial changes, not request time", () => {
 const source = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
 assert.match(source, /localGuidance\[location.slug\]\?\.checkedDate/);
 assert.match(source, /Math.max\(locationContentUpdated.getTime\(\)/);
 assert.match(source, /article.updatedDate \?\? article.publishedDate/);
 assert.doesNotMatch(source, /new Date\(\)|Date.now\(/);
});
test("location readiness accounts for every target without silently expanding hosts", () => {
 const report = locationReadiness();
 assert.equal(report.summary.targets, 100);
 assert.equal(report.summary.configured, 82);
 assert.equal(report.summary.expansionTargets, 18);
 assert.equal(report.summary.sourceLinkedLocalGuidance, 82);
 assert.equal(report.summary.incompleteRecordedAddresses, 2);
 assert.ok(report.inventory.every(item => item.expansionApproved === false));
 assert.ok(report.inventory.filter(item => !item.configured).every(item => !item.serviceIndexingCurrentlyEnabled));
 assert.equal(report.inventory.find(item => item.slug === "melbourne").suppliedProfiles.length, 2);
});
test("local guidance is distinct, sourced and limited to configured locations", () => {
 const guidance = readSeoConfiguration("lib/local-guidance.ts").localGuidance;
 const configured = new Set(locationReadiness().inventory.filter(item => item.configured).map(item => item.slug));
 const headings = new Set();
 for (const [slug, entry] of Object.entries(guidance)) {
  assert.ok(configured.has(slug));
  assert.ok(!headings.has(entry.heading)); headings.add(entry.heading);
  assert.match(entry.checkedDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Date(`${entry.checkedDate}T00:00:00Z`).toISOString().slice(0, 10), entry.checkedDate);
  assert.ok(entry.paragraphs.length >= 2 && entry.faqs.length >= 2);
  assert.ok(entry.relatedServices.length && entry.sources.length);
  for (const source of entry.sources) {
   const url = new URL(source.url);
   assert.equal(url.protocol, "https:");
   assert.ok(url.hostname.endsWith(".vic.gov.au") || ["www.gww.com.au", "ablis.business.gov.au", "yoursay.geelongaustralia.com.au"].includes(url.hostname));
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
test("second location batch has distinct introductions and meta descriptions", () => {
 const guidance = readSeoConfiguration("lib/local-guidance.ts").localGuidance;
 const descriptions = new Set();
 for (const slug of ["fitzroy", "williamstown", "blackburn", "thornbury", "craigieburn", "moorabbin"]) {
  const entry = guidance[slug];
  assert.ok(entry.introduction && entry.metaDescription);
  assert.ok(!descriptions.has(entry.metaDescription)); descriptions.add(entry.metaDescription);
  assert.ok(entry.metaDescription.length <= 190);
 }
 const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
 assert.match(home, /localGuidance\[location.slug\]\?\.metaDescription/);
 assert.match(home, /localGuidance\[location.slug\]\?\.introduction/);
});
test("all location batches have distinct customer-facing content and valid service links", () => {
 const guidance = readSeoConfiguration("lib/local-guidance.ts").localGuidance;
 const descriptions = new Set();
 const paragraphs = new Set();
 const questions = new Set();
 const validServices = new Set(readSeoConfiguration("lib/seo-services.ts").services.map(service => service.slug));
 for (const [slug, entry] of Object.entries(guidance)) {
  if (entry.metaDescription) {
   assert.ok(!descriptions.has(entry.metaDescription), slug);
   descriptions.add(entry.metaDescription);
   assert.ok(entry.metaDescription.length <= 190, slug);
  }
  for (const paragraph of entry.paragraphs) {
   assert.ok(!paragraphs.has(paragraph), slug); paragraphs.add(paragraph);
  }
  for (const faq of entry.faqs) {
   assert.ok(!questions.has(faq.question), slug); questions.add(faq.question);
  }
  for (const service of entry.relatedServices) {
   assert.ok(validServices.has(service), `${slug}: ${service}`);
  }
 }
 for (const slug of ["richmond", "altona", "boxhill", "berwick", "doncaster", "portmelbourne", "sunshine", "glenwaverley", "southmorang"]) {
  assert.ok(guidance[slug].introduction && guidance[slug].metaDescription);
 }
});
test("remaining batch covers exactly the previously missing configured locations", () => {
 const previous = JSON.parse(readFileSync(new URL("../data/local-guidance.json", import.meta.url), "utf8"));
 const rows = JSON.parse(readFileSync(new URL("../data/remaining-local-guidance.json", import.meta.url), "utf8"));
 const guidance = readSeoConfiguration("lib/local-guidance.ts").localGuidance;
 const expected = locationReadiness().inventory.filter(item => item.configured && !previous[item.slug]).map(item => item.slug).sort();
 assert.equal(rows.length, 61);
 assert.deepEqual(rows.map(row => row[0]).sort(), expected);
 for (const row of rows) {
  assert.equal(row.length, 8);
  assert.ok(row.every(value => typeof value === "string" && value.trim()));
  const entry = guidance[row[0]];
  assert.equal(entry.checkedDate, "2026-10-02");
  assert.ok(entry.introduction && entry.metaDescription);
  assert.ok(entry.metaDescription.length <= 190);
 }
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
  assert.match(route, /to: \[site\.email, "zenn@gradeaplumbing\.store"\]/);
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
