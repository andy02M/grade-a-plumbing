# SEO implementation — 27 October 2026

Local staged changes following the live audit. Nothing in this batch is deployed yet.

## Implemented

1. Fourteen new location-guidance records with distinct customer preparation guidance and authority-source links. Sources include Kingston, Monash, Whittlesea, Wyndham, Greater Dandenong, Banyule, Brimbank, Hume and Melbourne Water. Where a suburb/address may involve different authorities, the text requires checking the exact property's council rather than asserting universal jurisdiction. Wyndham's page was available through search extraction but a direct research fetch returned a transient 502; recheck its availability before release.
2. Visible, compact local introduction and expandable property guidance inside the existing service-area section for configured locations. The previously removed standalone sections remain removed. Existing 82 records retain their original source-check dates; fourteen new records are dated 27 October. General guidance is not a job diagnosis or verified storefront evidence.
3. Shared corporate canonicals for About, Our Work, Reviews and Service Areas now point to the Melbourne editorial host. Existing suburb URLs remain accessible. Corresponding social/WebPage/breadcrumb metadata and sitemaps align; service pages and suburb homepages retain their own canonicals. Primary links, homepage review links and footer Explore links use the preferred corporate destination.
4. A narrowly scoped permanent redirect for apex/www **homepage only** to its already-declared Melbourne canonical. Other routes, APIs and suburb hosts are unchanged. An existing platform-level apex→www redirect may still add a hop; no DNS or platform domain settings were modified.
5. Quote wrapper now resolves the chosen catalogue record, forwards suburb/state/postcode into the existing suburb field, and selects the relevant service. The existing JSON submission endpoint, validation and email routing remain intact. Customer edits take priority over asynchronously loaded defaults. A synchronous submission lock prevents duplicate requests. No uploads, appointment booking or unsupported backend fields were added.
6. Sixteen crawlable, server-rendered review pages cover all 191 supplied reviews, with individual canonical URLs and sitemap entries on Melbourne. Existing search and incremental Show more remain. This improves discovery, not eligibility for self-serving review stars.
7. A per-location storefront reconciliation report preserves known addresses/profile records and identifies missing evidence without inventing replacements.

## Not safely completed from available evidence

- Seventy locations still lack recorded addresses; occupancy, signage, hours and current Google status cannot be proved from names and old register records. No pretend addresses or ratings were created. Existing service noindex eligibility remains in force on 69 locations.
- Search Console, current analytics/enquiry exports and field CWV are not available. No indexing, rankings, lead uplift or Core Web Vitals pass is claimed. The existing local telemetry 400 remains outside this batch; analytics was not silently replaced.
- Real inbox delivery cannot be established in an isolated build without notification credentials. The successful browser submission test is a mocked local acceptance response, explicitly not a delivered email. A production-mode endpoint rejection can be tested locally without notifying customers.

## Verification so far

- 79 regression tests passed, including every location/service metadata combination, corporate canonical policy, review pagination coverage and service-context mapping. TypeScript and the final production build passed.
- Local crawl: 1,207 responses, zero fetch errors/non-200 results, missing metadata, missing/multiple H1s or JSON-LD parse errors. The 380 cross-host canonicals are intentional shared-page consolidation; comparison against the canonical policy returned zero unexpected differences.
- All sixteen review pages returned 200, their expected canonicals and a combined 191 server-rendered cards. Non-Melbourne sitemaps omitted corporate duplicates.
- Browser catalogue→form→mocked response retained `Mordialloc VIC 3195` and `Blocked drain`, showing success only after the simulated acceptance response. A service-page visit preselected Blocked drain. At 390px its document width was 390px.
- A second browser check retained `Penrith NSW 2750`. Raw HTTP requests with the apex and www Host headers each returned the expected 308 redirect to Melbourne. Empty quote payload returned 400. An initial Node fetch Host-override probe did not send the intended Host; raw HTTP verified the actual route correctly.
- Final local evidence is `output/seo-20261027/final-staged-candidate.json`; the desktop service-area screenshot is `output/playwright/seo-local-guidance-desktop.png`.

## Release and measurement

Review locally, then separately approve production publication. After release verify the corporate canonicals, the root alias redirect, all new homepages, service noindex rules, sitemap URLs, all review pages and an authorised staging notification acceptance test. Preserve the previous production deployment for rollback.

Once current Search Console and enquiry data are available, compare 28-day page/query/location groups with the prior period. Separate brand/non-brand and informational/booking intent; reconcile accepted submissions and calls rather than counting article volume. Review locality evidence before changing any indexing safeguards.
