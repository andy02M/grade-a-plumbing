# Search Console indexing investigation — 2 October 2026

Source: two user-supplied Coverage Drilldown ZIP exports dated 2 October 2026,
Table.csv and Metadata.csv. These contain example URLs, not a complete network
indexing inventory. Live checks below were performed on 2 October 2026.

| Report | Exported URL | Live finding | Action |
| --- | --- | --- | --- |
| Crawled, currently not indexed | https://malvern.gradeaplumbing.store/ | 200; Malvern title and self-referencing canonical; no page noindex | No proven technical blocker. Review Google's indexed inspection and local evidence before changing content or indexing gates. |
| Crawled, currently not indexed | https://cliftonhill.gradeaplumbing.store/ | 200; Clifton Hill title and self-referencing canonical; no page noindex | Same as Malvern. The report's last crawl predates later local-guidance updates. |
| Crawled, currently not indexed | https://stalbans.gradeaplumbing.store/service-areas | 200 duplicate of the slash URL; canonical points to /service-areas/ | Add permanent redirect to the existing canonical URL, preserving query strings and hostname. |
| Crawled, currently not indexed | https://burwood.gradeaplumbing.store/contact | 200 duplicate of the slash URL; canonical points to /contact/ | Add permanent redirect to the existing canonical URL, preserving query strings and hostname. |
| Crawled, currently not indexed | https://altona.gradeaplumbing.store/_next/static/media/89232e6535d3b87e-s.p.0uy8evdve.ea3.woff2 | Obsolete font URL returns 404 | No recovery or index request needed. Fonts are not customer landing pages. |
| Crawled, currently not indexed | https://hampton.gradeaplumbing.store/_next/static/media/d9b5d46d9a89ffe6-s.p.0agk34fg-1.z0.woff2 | Obsolete font URL returns 404 | Same as Altona. Do not block current rendering resources in robots.txt. |
| Crawled, currently not indexed | https://pointcook.gradeaplumbing.store/_next/static/media/d9b5d46d9a89ffe6-s.p.0agk34fg-1.z0.woff2 | Obsolete font URL returns 404 | Same as Altona. |
| Google chose different canonical | https://ballarat.gradeaplumbing.store/ | 200; Ballarat title and self-referencing canonical; no page noindex | The selected alternative is missing from the export. Need indexed URL Inspection's Google-selected canonical and last crawl. Do not redirect Ballarat to another suburb or fabricate business evidence. |

The two slash-path redirects apply across configured hosts. Canonical pages,
legacy service redirects, suburb hosts, API behavior and indexing gates remain
unchanged. A successful redirect test does not establish that Google has recrawled
or indexed the destination. No Search Console validation or indexing request was
submitted by this implementation.

Ownership and sitemap submission were confirmed by the user. Account browser/API
access is still unavailable. A user-provided Google live test successfully fetched
the sitemap index; the subsequent Sitemaps report result remains unconfirmed.

Google guidance:
https://support.google.com/webmasters/answer/7440203?hl=en
https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
