# Owner-approved location configuration — 25 October 2026

The owner supplied 94 rows / 93 unique names and explicitly approved configuring every missing location while ignoring omissions. Fourteen hosts have been added to application configuration:

Mordialloc, Huntingdale, Truganina, Doreen, Noble Park, Docklands, Macleod, Moonee Ponds, Pascoe Vale, Tullamarine, Aspendale, Kings Park, Keilor and Mernda.

The configured network is now **96 unique locations**. Existing Geelong, Deanside and Thomastown are unchanged. Melbourne's duplicate supplied row creates no duplicate host. Four older register targets remain unconfigured because they were not in this updated list.

## Behaviour

- New hosts use the existing host-aware Next.js routes, premium layout, metadata, sitemap and quote backend; no new application or backend is introduced.
- The existing searchable catalogue preserves its postcode, state, source identifiers and council data. Owner-listed entries are marked owner-confirmed for service coverage, and their local website links use the matching suburb host. This is not independent GBP verification or a service-by-service guarantee.
- Historical Google status/Maps records are unchanged. No addresses, opening hours or storefront evidence are invented.
- All fourteen lack recorded storefront addresses and retain the existing noindex policy on service pages; they are omitted from service-page sitemap entries under that policy.
- Nearby links reuse already recorded geographic relationships in reverse when no forward list exists. Mordialloc, Tullamarine and Aspendale have no such recorded relationships; no invented nearby list is displayed. These need sourced local coverage work, as do the other newly configured pages.
- The earlier SEO report and inventory are a dated **pre-expansion** snapshot, not a current 96-host crawl. Re-run `network-seo-audit.mjs` against the new candidate for an updated full inventory.

## Release limits

This is a local branch implementation, not a production deployment. Host resolution in local tests does not establish live DNS, Vercel domain association, Google indexing or verified premises. The existing wildcard/domain setup must be checked on an approved preview/release; no DNS or environment configuration was changed here.

## Verification

- 73 automated tests passed; TypeScript and production build passed.
- Updated full-network local crawl: **1,205 requests**, all completed with 200 responses; no missing titles/descriptions/canonicals, canonical mismatches, multiple/missing H1s or JSON-LD parsing errors.
- The fourteen directory entries resolve to their matching local website URLs, retain four-digit postcodes from the existing sourced catalogue and are marked owner-confirmed for coverage.
- Full local crawl evidence: `output/seo-20261025/expanded-candidate.json`. The existing 82-host audit remains preserved as a historical baseline.
