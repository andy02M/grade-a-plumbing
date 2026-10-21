# Grade A Plumbing SEO baseline — 21 October 2026

Baseline source: production commit d5fc397. No deployment is authorised for this project. Existing dirty primary checkout is not the release source; implementation uses branch codex/seo-improvements-20261021 in the isolated checkout.

## Measured scope

`node scripts/network-seo-audit.mjs` completed 1,079 public GET checks: 82 configured location homepages, six marketing paths per host, twelve services on the 27 hosts meeting existing service-indexing policy, twelve published articles, editorial index, robots/sitemaps and apex/www/HTTP entry checks. The evidence file is `output/seo-20261021/baseline.json` and contains every requested URL, response chain, title, description, canonical, robots directive, H1–H3, JSON-LD, links and image attributes. All 1,079 completed without fetch errors; final responses were 200. This is not a Google indexation count.

- 914 HTML responses including entry-point duplicates; each has a title, description, one canonical and one H1. JSON-LD parses successfully; this does not establish rich-result eligibility.
- 583 distinct sitemap URL values observed.
- Coburg blocked-drains title targets Coburg; visible H1 says Melbourne. The browser confirms this after hydration at 390px. Other suburb service pages repeat Melbourne headings.
- Four extra service types repeat Melbourne titles on 27 hosts each; service overview title repeats on 82 hosts.
- Shared About/Reviews/Our Work content also repeats across 82 hosts. This needs an explicit consolidation decision, not an unapproved domain migration.
- 84 literal canonical differences include equivalent origin URLs without `/` and apex/www variants. Origin spelling is not automatically a substantive canonical conflict; compare parsed URLs before categorising.
- About/Services/Our Work/Reviews are missing from host sitemaps despite indexable self-canonical pages.
- Browser mobile sample: 390px viewport and document both 390px; no horizontal overflow in sampled Coburg drain page. One console warning, zero errors in this visit.
- That sample transferred ~608KB for favicon, ~353KB for header logo, ~313KB for drain hero and ~274KB scripts. These are browser resource observations, not field CWV or a Lighthouse score.
- HTTP apex redirects 308 to HTTPS apex then 307 to www. Host changes require approval; not changed here.

## Business/account limits

Supplied register contains 101 profile records / 100 targets; 82 are configured and 18 are unconfigured expansion targets. Forty-two Active-profile locations lack the evidence currently required for indexable service pages; this is not permission to remove their safeguards. Two recorded storefront addresses lack premises numbers. Occupancy, signage, staffing, hours and current Google status are not independently established by repository records. The 500+ review display is owner-confirmed, not scraped verification; no aggregate review schema is added.

Search Console/GA enquiry and search performance data are unavailable to this audit. No invented volumes, difficulty, rankings, CTR, enquiry uplift or field LCP/INP/CLS. Historic exports from earlier chats are not current account access.

## Priority before editing

1. Align service titles, descriptions, visible hero and schema with the actual host, including extra services.
2. Preserve suburb host canonicals and URLs; keep general articles canonical on Melbourne.
3. Fill safe sitemap omissions, unify metadata/schema and add breadcrumbs matching existing navigation.
4. Improve image delivery without changing source photographs, colours, typography or layout.
5. Retain article sources and publishing gates; improve discoverability without restoring the removed homepage article block.
6. Record unsupported local evidence, shared-page consolidation and domain redirect strategy for approval.

## Current authoritative guidance

- Google JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Crawlable links: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Structured data content accuracy: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Local business schema: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Doorway/scaled-content policies: https://developers.google.com/search/docs/essentials/spam-policies
- GBP real-world representation: https://support.google.com/business/answer/3038177

Sources checked 21 October 2026. Recommendations derive from this implementation's evidence, not a claim that following a checklist guarantees ranking.
