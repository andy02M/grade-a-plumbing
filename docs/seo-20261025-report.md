# Grade A Plumbing — SEO implementation handover

## Executive summary

The safe technical improvements are implemented on `codex/seo-improvements-20261021`, not deployed to production. The approved premium design, removed homepage sections, suburb hosts, public URLs, quote backend, recipients and article automation are preserved. Production changes through `897c2f1` (including four newer articles and the call-notification fix) were merged into the candidate before its final build.

The most important verified defect was location mismatch: suburb service pages displayed Melbourne headings. The candidate now renders host-specific headings, service metadata and structured data. This fixes relevance and consistency, but **does not make otherwise shared content genuinely locally differentiated**. Storefront evidence and useful location-specific information remain the largest strategic gap.

## Inventory and baseline

The 21 October production baseline covered 1,079 GET requests, plus 1,055 newly discovered first-party link destinations: 2,134 URL checks in total. The first group had no failed requests or non-200 final responses; the additional crawl found three Sydney host homepages returning 404. These are HTTP observations, not an indexing count. The baseline contained 12 articles; the refreshed candidate includes 16.

- [Baseline and methodology](seo-20261021-baseline.md)
- [Every configured location, keyword map and expansion assessment](seo-20261025-location-map.md)
- [Compact checked-URL inventory](seo-20261025-url-inventory.json)
- Full local evidence: `output/seo-20261021/baseline.json`, `linked-urls.json`, `candidate-all-hosts.json`.

Final local production-mode crawl: 1,079 requests across all 82 configured host contexts, including 324 service pages on the 27 eligible hosts. All completed with 200 responses; zero missing titles, descriptions or canonicals, zero canonical mismatches, exactly one H1 on every HTML response and no JSON-LD parse failures. Schema parsing is not a Google rich-result eligibility test. The candidate crawl uses forwarded host headers locally; live DNS/CDN equivalence still needs post-release checking.

## Prioritised issue register

| Priority / status | Affected URLs and evidence | Recommended action / effort | Verification |
| --- | --- | --- | --- |
| High — implemented | Coburg `/blocked-drains/` and other suburb service routes showed Melbourne H1s; four extra service types repeated Melbourne titles | Server-provided location and shared metadata helper; small–medium | 984 location/service combinations in automated checks; full candidate crawl |
| High — evidence required | 42 Active-profile targets lack current service-indexing evidence; addresses, occupancy, hours and signage are not independently verified | Collect genuine storefront evidence before expanding indexability; medium, owner-dependent | Compare each profile with documented premises and matching page |
| High — implemented link mitigation, hosting unresolved | Penrith, Blacktown, North Sydney host homepages returned 404 in discovered-link crawl | Preserve location cards but route enquiries to working contact page; new hosts require approval and genuine pages | Candidate links; live new-host checks only after approved setup |
| Medium — implemented | Indexable `/services/`, `/about/`, `/our-work/`, `/reviews/` absent from host sitemaps | Add existing URLs without new pages; small | Distinct sitemap URL values 583 baseline → 915 candidate, including four newer articles |
| Medium — approval required | About, Reviews, Our Work and Service Areas titles/content repeated across 82 hosts | Decide corporate canonical/consolidation strategy; medium | Review URL-level traffic/indexing before cross-host canonical changes |
| Medium — implemented | Oversized logo, favicon and service photographs | Responsive Next image delivery; same imagery and layout; medium | Build, loaded-image sampling and throttled resource comparison |
| Medium — unresolved measurement | Mobile lab layout shift approximately 0.103 in both live and candidate sample | Diagnose repeated cold/warm traces and field data; medium | Repeated lab runs plus Search Console/CrUX if available |
| Medium — approval required | HTTP apex → HTTPS apex → www redirect chain | Choose one permanent host policy without changing suburb architecture; small–medium | Redirect and canonical checks before/after approved release |
| Medium — follow-up | Quote wrapper accepts default location/service props but does not forward them into the existing form | Add and test supported prefill without inventing backend fields; small–medium | Directory → form → accepted payload end-to-end |
| Medium — account access required | No current Search Console, analytics or enquiry dataset | Establish page/query/location baseline; small | Export and reconcile indexed pages, clicks, impressions and accepted enquiries |
| Low — follow-up | Private/admin UI exposure cannot be assessed solely by robots/noindex | Review authentication and personal-data visibility; medium | Unauthenticated route tests; noindex is not access control |

## Implementation details and examples

New `lib/page-seo.ts` centralises local service identity, canonical/social metadata and breadcrumb schema. Homepage, service routes, editorial index and article metadata use the existing URL architecture. Article schema references the actual selected hero image and publisher. No aggregate rating or invented qualification is added. Postal-address schema was removed from the homepage after the owner removed its visible address section; address configuration remains intact.

Before: Coburg service title targeted Coburg while the visible hero targeted Melbourne. After: server-rendered hero and service schema target Coburg on the Coburg host. Before: extra-service titles used Melbourne on all eligible hosts. After: toilet, kitchen, bathroom and leak-detection titles/descriptions use the matching location.

Before: shared enquiry FAQ incorrectly said the form was not connected. After: it explains submission acceptance and direct-contact alternatives, without claiming delivery before acceptance. Before: Sydney cards linked to known 404 hosts. After: the cards retain those locations and offer a working enquiry path.

Images retain the same photographs, typography and premium layout. General articles remain canonical on the Melbourne editorial host. Existing publishing workflow, queue and quality gates remain in place; this audit did not trigger a publication or verify a future scheduled run.

## Content, articles and local authority

The crawl inventories every current article's metadata and links; automated quality checks pass. This is **not** an independent expert fact-check of every paragraph or a plagiarism-database scan. Do not claim that daily frequency itself improves ranking. Prefer updating a weak service page or skipping a queued topic when it overlaps an existing intent or lacks evidence. Review drafts for sources, safe advice, useful scope, original explanations and links before release; preserve accurate publication dates rather than repeatedly refreshing them.

Booking intent belongs to the matching suburb homepage/service route; informational intent belongs to Melbourne articles. The companion map lists 984 service-intent destinations and explicitly retains existing noindex safeguards. Do not manufacture 984 new pages. Local evidence should include verified access guidance, real assessment examples with permission, relevant property constraints and actual staffed-premises details—not a list of landmarks or suburb-name substitutions.

The owner-confirmed 500+ review display is not independently re-counted here. Keep per-profile attribution and genuine review requests; do not fabricate reviews or combine ratings into unsupported schema. Two recorded street addresses lack premises numbers. The supplied register's 101 records / 100 targets includes 18 unconfigured expansion targets; listing them is not approval to publish.

## Competitor observations and guidance

Research checked 21 October 2026. Accessible primary competitor pages were [Metropolitan Melbourne](https://metropolitanplumbing.com.au/locations/vic/plumber-melbourne/) and [Fix-It Right Melbourne](https://www.fixitrightplumbing.com.au/plumber-melbourne/). The former provides strong service/location navigation and prominent booking routes; the latter provides process explanations, team/credential verification links and case-study material. Their pricing, guarantees, response-time and job-count claims were not verified and must not be copied. These are information-design comparisons, not measured Google ranking positions or a complete local SERP study.

Recommendations follow Google's [JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [crawlable links guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [Local Business documentation](https://developers.google.com/search/docs/appearance/structured-data/local-business), [spam policies](https://developers.google.com/search/docs/essentials/spam-policies) and [Business Profile representation requirements](https://support.google.com/business/answer/3038177). Suburb-name swapping is not a remedy for doorway/scaled-content risks. No first-position guarantee is made.

## Verification and limitations

- 72 automated tests passed; TypeScript check and production build passed after integrating current production changes. No standalone lint command is configured.
- Browser sampled homepage, blocked drains, Advice index and Contact at 2560, 1920, 1440, 1366, 1024, 768, 390 and 360px: 32 combinations, each with one H1, no horizontal overflow and no broken already-loaded images. This does not establish every offscreen asset or every interaction at every width.
- Real local quote endpoint: empty payload rejected with 400; clearly labelled valid test rejected with 500 when no Resend credentials were present. No false success and no customer emails sent. Existing mock tests cover acceptance logic; **real inbox delivery and an authenticated staging success test remain unverified**. Backend and support/zenn recipient configuration were not replaced.
- Single throttled mobile blocked-drains comparison: transferred bytes 1,824,239 live → 768,152 local; observed LCP 9,556ms → 3,772ms; observed layout shift unchanged at 0.10288. CPU 4×, latency 150ms, download 200,000 bytes/sec, 375×812 viewport. Local hosting differs from production and this is one run, not field Core Web Vitals or a guaranteed uplift. INP and field CWV are unavailable.
- JSON-LD parsed; no current Google Rich Results or Search Console eligibility confirmation. No independent premises verification, current rankings, search volume, CTR or enquiry uplift is asserted.

## 30 / 60 / 90-day plan and measurement

**First 30 days:** review the local candidate, complete authorised staging notification testing, approve release separately, then verify live status/canonicals/sitemaps. Obtain Search Console and enquiry exports, validate genuine premises details, prioritise the 42 evidence-limited active locations. Record publication successes rather than assuming queue entries are live.

**Days 31–60:** improve the highest-impression weak service/location pages using real evidence; resolve approved corporate canonical and apex redirect decisions; test location-aware form prefill; replace repetitive articles with useful service/FAQ improvements; investigate layout shifts and field performance.

**Days 61–90:** compare 28-day and prior-period clicks, impressions, CTR and positions by query/page/location, accounting for seasonality and brand queries. Reconcile accepted quote submissions and phone enquiries without exposing personal data. Evaluate indexing by URL groups, not `site:` counts. Expand only verified storefronts with substantive useful pages and approved host configuration.

Baseline search/enquiry metrics are unavailable, not zero. Keep a dated log of releases, canonical changes, queue skips/publications and enquiry routing tests so outcomes can be attributed cautiously. Rankings alone are not the business outcome.

## Release and rollback

Local review: http://localhost:3006/ and http://localhost:3006/blog/ while the production-mode server is running. No Vercel deployment or production push was made for these SEO changes. No environment pull, DNS change or credential replacement was performed.

Before release, preserve the current production deployment identifier, build a preview on the verified Grade A Plumbing project and complete the outstanding staging acceptance test. Production approval is still required. Roll back by promoting the previously recorded production deployment or reverting the SEO commits through a normal reviewed commit; do not reset unrelated work. The isolated branch retains the baseline and recoverable commit history.
