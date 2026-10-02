# Performance and enquiry measurement — 2 October 2026

## Mobile lab baseline

Controlled single-run samples: Chromium at 375 × 812, device scale 2,
150 ms network latency, 200,000 bytes/s download and 4× CPU slowdown.
These are reproducible lab observations, not Lighthouse scores, CrUX results,
field Core Web Vitals percentiles or a guarantee of real-user performance.
INP was not measured by these navigation-only samples.

| Page | Observed LCP | Observed layout shift | Document width |
| --- | --- | --- | --- |
| Melbourne homepage | 1,524 ms | 0 | 375 px |
| Coburg homepage | 1,276 ms | 0 | 375 px |
| Ballarat homepage | 1,440 ms | 0 | 375 px |
| Melbourne blocked drains | 1,076 ms | 0 | 375 px |
| Hot water lifespan article | 1,920 ms | 0 | 375 px |

The article hero requested a 3,840-pixel image on the mobile viewport because
its responsive sizes were unspecified. It now has sizes matching the constrained
two-column desktop layout and mobile width. Existing system fonts, image lazy
loading and explicit dimensions are retained. Run `npm run seo:performance`
to repeat the representative live samples, or pass explicit URLs.

## First-party measurement

Public pages report call/email link clicks and LCP, CLS and INP observations
to the same-origin `/api/measurement/` endpoint. Only configured public page
categories, location slugs, known service/article identifiers, allowlisted link
placements and numeric performance values reach measurement logs. Query strings,
raw link destinations, form contents, referrers, visitor identifiers and IP
addresses are not included by this measurement code. It sets no tracking cookies
and loads no third-party analytics. DNT/GPC preferences suppress measurement.
Private pages, unknown hosts and previews are not logged. Bad origins, oversized
bodies, extra fields and invalid metrics are rejected. A per-instance log cap is
best-effort abuse protection, not a persistent distributed rate limiter.

Accepted quote events are emitted only by the existing quote API after the email
provider accepts the enquiry. Failed submissions and public client events cannot
claim accepted quotes. Provider acceptance does not prove inbox receipt, a booked
job or revenue. Link clicks do not prove calls connected or emails were sent.

View the connected Vercel project's runtime logs and filter `site_measurement`.
Retention/access depend on that project's hosting settings. This stage does not
create a persistent analytics dashboard, visitor counts, attribution sessions or
conversion rates. Provider infrastructure may separately log request metadata;
the privacy page distinguishes this from the application measurement payload.

Search Console and verified analytics account access remain unavailable. Existing
baseline null values remain honest until data is collected and accessed. Do not
present new instrumentation as historical traffic or ranking evidence.

References:
https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals
https://nextjs.org/docs/app/api-reference/components/image
