# Critical asset delivery follow-up

Implemented after reviewing the 21:08–21:12 Lighthouse exports. Original photographs, artwork, fonts, page content, subdomains, forms, API endpoints, notification routing, automation and credentials are retained.

## Changes

- Removed the embedded font payload from blocking CSS. Critical fonts now preload independently and use content-fingerprinted immutable URLs.
- Pre-encoded responsive AVIF hero, service-card and homepage gallery variants at build time. Original Next Image/WebP/JPEG paths remain as native picture fallbacks and full-size gallery views retain the original images.
- Corrected service-card image sizing to match the actual responsive grid. Added small fallback image widths to Next's image configuration.
- Produced small palette/lossless logo variants without changing its shapes, and selected them according to actual displayed size.
- Deferred the decorative footer background until the footer approaches the viewport. Footer text, links and geometry stay present; visible footer images and background were verified after scrolling. Footer SVG images now use native lazy loading.
- Hoisted static icon artwork so every icon render no longer constructs the complete icon catalogue.
- Added build-time asset fingerprints and matching one-year immutable headers, scoped only to the new generated asset directory. Future byte changes generate new filenames; HTML and APIs keep their existing cache policies.
- Added two regression tests checking immutable URL fingerprints and responsive image dimensions/size budgets. Updated the hero source assertion to check eager/high-priority rendering.

## Verification

Default Next/Turbopack production build and TypeScript passed. All 81 tests passed. Browser smoke checks passed for 32 viewport/page combinations, without horizontal overflow or page exceptions. All gallery images loaded. Footer background was not requested initially and enabled after scrolling; visible footer images also loaded. Service/review headings remain visible without JavaScript. Invalid local quote POST returned 400. No real customer enquiry or notification was sent in these checks.

Final local Lighthouse release-candidate results (separate sequential runs):

| Device | Performance | Accessibility | Best practices | SEO | LCP | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mobile | 91 | 100 | 100 | 100 | 3.453s | 0 | 442,380 bytes |
| Desktop | 100 | 100 | 100 | 100 | 0.810s | 0 | 519,923 bytes |

Relative to the uploaded reports' payloads, these represent about 29% less mobile transfer and 39% less desktop transfer; different hosts/conditions mean score and timing comparisons are not a controlled field experiment. The unused-CSS warning disappeared in the new local reports. Estimated image opportunities fell to approximately 5–6KB. Render-blocking estimates fell to approximately 110ms mobile / 20ms desktop. Exact estimates vary between runs.

Some initial-load unused React code, compatibility JavaScript and small image diagnostics remain. These are not all safely removable code. Mobile simulated LCP remains above 2.5 seconds locally; no field Core Web Vitals pass or permanent score is claimed. Live measurement follows publication.

Evidence: output/performance-20261027/pass3-release-mobile.json, pass3-release-desktop.json, pass3-tests.txt and smoke.json. Generated assets are recreated by npm run prebuild; only the manifest-referenced files need tracking. No experimental global CSS inlining or inline-photo experiment is enabled.
