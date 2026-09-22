# SEO architecture audit

## Existing architecture discovered

The repository is a Next.js 16 App Router application deployed with Vercel configuration. It contained a GMB automation homepage/dashboard alongside four older Grade A Plumbing service pages. Plumbing metadata and schema were static and Melbourne-only. The same application also contains Prisma-backed automation APIs, Google OAuth and Telegram integrations; these were preserved.

## Problems found before implementation

- Public homepage, layout metadata, navigation and footer described GMB AutoPilot while plumbing service routes described Grade A Plumbing.
- Canonicals and schema were bound to one Vercel/Melbourne URL rather than the requesting location hostname.
- Only four service routes existed and used location-suffixed URLs.
- Sitemap was static, incomplete and included utility/legal pages while omitting the requested service and article architecture.
- Robots allowed dashboard and API routes.
- LocalBusiness schema included an unverified locality address and a price range; neither is needed for a service-area business.
- No review-gated article model, tiered location registry, related-service graph, completeness dashboard, citation tracker, backlink tracker or duplication report existed.
- Site-wide client navigation and CSS remain relatively lightweight. Existing hero images use fixed intrinsic dimensions, but the legacy CSS/background-image hero remains a performance follow-up.

## Implementation notes

Coburg is the Tier 1 reference and contains verified-from-brief nearby suburbs plus non-claim local copy. Other profiles are registered but default to Tier 3 until genuine local content is added. No reviews, licences, addresses, response times, job histories or postcodes were invented.

Legacy Melbourne service URLs redirect permanently to clean service paths. Draft articles are excluded from routes and sitemaps. The internal `/seo-dashboard/` is noindex and blocked in robots.

## Remaining inputs

Supply verified opening hours, public contact details per profile, postcodes, licensing/warranty/payment details, genuine reviews, genuine local job notes and location-specific photos. These fields should only be rendered after validation.
