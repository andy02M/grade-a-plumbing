# Search Console review - 29 October 2026

## Follow-up audit and scoped fix

- Search Console reports no manual action or security issue. The indexing report is still dated 23 October, so current counts are historical rather than a post-release measurement.
- The 16 Google-selected-canonical examples comprise five suburb homepages (Epping, Berwick, Bulleen, Burwood and Toorak) plus shared corporate/service pages. The corporate pages already use a Melbourne canonical; the five homepages need verifiable local business evidence and cannot be made distinct by a canonical tag alone.
- The 16 reported 404 examples include malformed `/$` and `/&` requests, unconfigured Sydney and Melbourne hosts, and some configured Melbourne hosts. Moonee Ponds now renders normally; Penrith still renders a noindex 404. Do not create unverified location pages or redirect junk URLs to the homepage merely to clear the report.
- The eight discovered-but-not-indexed examples include four Melbourne blog articles, two service pages, Altona contact and a noncanonical Altona service-areas page. The sitemap index reports Success but only one child sitemap read so far; the directly submitted Melbourne and Epping sitemaps report 55 and 16 URLs respectively. Recheck after Google processes the index rather than bulk submitting all hosts.
- The payment policy was a genuine duplicate across suburb hosts: each copy had a self canonical and was in its host's sitemap. The site change makes Melbourne the canonical payment page and leaves it only in Melbourne's sitemap; suburb visitors can still use the page or follow the Melbourne link.
- The earlier local Google-profile badge was removed at the owner's request. No profile-specific phone number or street address was published because routing and premises were not verified.

Property: `sc-domain:gradeaplumbing.store`. Read-only figures were observed in the owner's Search Console account on 29 October 2026. The attached 53-row business-profile list is owner-supplied, not independent verification of Google listing status, premises occupancy, or call routing.

## Current baseline

- Search performance, 27 July-26 October 2026: 756 web clicks, about 162,000 impressions, 0.5% CTR, average position 6.4. These are property-wide figures, not Melbourne-only figures.
- Page indexing report, last updated 23 October: 131 indexed and 263 not indexed. The latter includes 97 alternative canonical pages, 46 intentional or other `noindex` pages, 17 redirects, 16 404s, 63 crawled-but-not-indexed URLs, 16 Google-selected-canonical conflicts, and 8 discovered-but-not-indexed URLs. These categories must not be treated as 263 errors to fix.
- The 63 crawled-but-not-indexed examples include many versioned `_next` assets, a sitemap and query-string URLs. The customer pages in that group need separate review; asset URLs are not missing service pages.
- Epping homepage inspection: fetch successful, crawl and indexing allowed, user canonical `https://epping.gradeaplumbing.store/`, Google-selected canonical `https://ringwood.gradeaplumbing.store/`. This is a content/canonical-selection issue, not a robots or HTTP failure. Google's last crawl shown in inspection was 28 October 2026.
- The submitted Melbourne sitemap index was successful on 28 October but the report showed only the Altona child sitemap read (7 discovered URLs) at the time of review. The public index currently serves 96 child sitemap references. This may reflect processing lag; it does not prove a malformed XML index.

## Action completed in Search Console

Submitted `https://epping.gradeaplumbing.store/sitemap.xml` directly on 29 October. Search Console reported **Success** and **16 discovered URLs**. Submission helps discovery but does not guarantee indexing or change Google's canonical choice.

## Location and URL reconciliation

- The supplied list has 53 profile rows and 16 distinct numbers. Forty-nine corresponding suburb hosts are configured. East Melbourne, Seddon, Maribyrnong and Harkness are not configured and should not be linked as live location sites or added to sitemaps until genuine pages and hosts exist.
- All 49 configured matches currently use the shared website number `(02) 5837 5457`, not the owner-supplied profile-specific numbers. Confirm each tracking number reaches the intended receptionist before changing displayed numbers or structured data.
- Two supplied addresses overlap existing recorded storefronts. Brighton agrees. Narre Warren conflicts: the site records `Link Rd`, while the supplied list says `7 Magna Vista Rise`. Confirm the real public business address and whether customers may visit before changing visible content or schema.
- The 404 report contains stale entries: Noble Park and Macleod now return 200. Harkness and Penrith still return 404. The malformed `/$` and `/&` paths should remain 404 unless a real internal link to them is found.
- The HTTP apex currently redirects to HTTPS apex, then `www`, then Melbourne. This multi-hop chain merits a separate domain-routing change and regression test; no domain configuration was changed in this review.

## Priorities

1. Confirm tracking-number routing and actual public premises for the supplied list. Then make displayed phone numbers, contact links and business schema consistent per host, while preserving the receptionist routing.
2. For the five suburb homepages in the Google-selected-canonical group, inspect each selected URL and add genuinely distinct, verifiable local service evidence, rather than repeating suburb names or forcing canonicals. Epping is confirmed to cluster with Ringwood.
3. Recheck the sitemap index's child processing after Google has had time to read it. Directly submit only priority host sitemaps that remain absent; do not bulk-submit 96 hosts without a reason.
4. Review current 404 referrals and fix only broken internal links. Do not create thin pages for unconfigured hosts simply to clear Search Console counts.
5. Compare a complete 28-day period after the next content release with the preceding complete 28 days, separating brand and non-brand queries and reconciling accepted enquiries. Search Console numbers alone do not establish lead quality.

The initial read-only review made no website code, Google Business Profile, DNS, domain redirect, indexing request or production deployment change. The follow-up payment-page code change is described above.
