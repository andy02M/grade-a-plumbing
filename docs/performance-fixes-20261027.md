# Speed improvements — 27 October 2026

Implemented locally on codex/seo-improvements-20261021. Not committed or deployed. Existing quote APIs, credentials, recipients, article automation, URLs and SEO metadata remain unchanged.

## Changes

- Removed the lazy MarketingPage/null Suspense boundary that initially hid primary service/review content and exposed the footer.
- Added ResponsiveImage using Next Image, real intrinsic dimensions and responsive sizes. Converted the homepage, shared cards/gallery/footer, marketing pages and advice directory. Existing hero images already using Next Image remain intact.
- Deduplicated the identical Emergency Panel/Burst Pipe source URL. Optimised the tiny Google mark through a 20px sizes hint.
- Deferred larger offscreen images. Small gallery thumbnails remain eager because browser regression checks found two never selected a source with native lazy loading; all eight now load successfully.
- Preloaded the local Inter font with Next's adjusted fallback metrics. Embedded the 22 KB condensed heading font in cached CSS to prevent the large width/wrapping change observed even with a separate preloaded font. This trades a small increase in critical CSS for stable approved typography and eliminates that extra font request.
- Scoped advice and article styles to their own routes.
- Removed a redundant review badge aria-label that did not match the visible text.
- Added a build preparation script to keep image dimensions and the embedded display font in sync with future assets. No original photos or fonts were removed.

## Verification

- Next 16.2.6 production build: `npx next build --webpack` passed, including TypeScript and all 49 static outputs. The sandbox initially blocked generated folders; the successful build ran outside it. The default Turbopack attempt stalled locally; no application build command was changed to conceal that limitation.
- TypeScript passed; 79 existing tests passed; git diff whitespace checks passed.
- 32 browser layout checks passed: homepage, blocked drains, advice and reviews at 2560, 1920, 1440, 1366, 1024, 768, 390 and 360 pixels. No horizontal overflow or JavaScript page exceptions.
- Service and review H1s visible with JavaScript disabled. Coburg forwarded-host smoke test returned 200 and its local heading.
- Mobile menu and quote dialog opened. Intercepted 503 response retained form data and showed an error; intercepted 200 response showed success/reference. These are UI transport tests, not proof of email delivery. Invalid empty POST to the actual local quote handler returned 400. No valid enquiry or notification was sent.
- All eight gallery images loaded after the gallery correction. Desktop and mobile screenshots were inspected.

## Measured results

Same throttling profiles as the original audit: mobile 390×844, 4× CPU, 150 ms/1.6 Mbps; desktop 1440×900, normal CPU, 40 ms/10 Mbps. Fresh browser cache per run. After results are a local Webpack production build, while before results were the live Vercel build; server, CDN and compiler differences prevent treating timings as a deployment guarantee.

Final homepage: three runs per device after the gallery correction:

| Metric | Original live browser baseline | Final local build |
|---|---:|---:|
| Desktop initial transfer | approximately 12.18 MB | 1.045 MB |
| Mobile LCP | median 7.42 s | median 1.296 s, range 1.272–1.308 s |
| Desktop LCP | median 2.016 s | median 0.372 s, range 0.356–0.384 s |
| Mobile CLS | approximately 0.142 | below 0.001 |
| Desktop CLS | approximately 0.142 | approximately 0.041 |

Initial desktop transfer reduced by about 91%. This is initial-load transfer, not the full weight after scrolling every lazy image into view.

Six-template local check before the final gallery-only adjustment: all 12 mobile/desktop samples completed load, with no HTTP failures or page exceptions. Mobile LCP ranged from 1.172 to 2.384 seconds; CLS was below 0.001 mobile and 0.051 desktop. Blocked-drains desktop CLS fell from about 0.888 to 0.004. The final gallery change was retested with the six homepage runs and the responsive smoke checks.

These are browser lab observations, not fresh Lighthouse scores or field Core Web Vitals. Existing user-supplied Lighthouse scores remain the pre-change baseline. Field INP and 75th-percentile results are still unverified.

## Review and publication

Local review: http://localhost:3010/. Evidence: output/performance-20261027/final-home/results.json, local-after/results.json and smoke.json. Screenshots: output/playwright/speed-final-*.

Next step is deployment to the verified grade-a-plumbing project, followed by repeat live Lighthouse/browser tests. Retain the previous deployment for rollback. No DNS, environment or production association changes are needed.
