import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { runInNewContext } from "node:vm";
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
