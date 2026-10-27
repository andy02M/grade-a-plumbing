# Lighthouse follow-up — 27 October 2026

Inputs: owner reports 17:03:46 (desktop 98, LCP 0.794s, CLS 0.081) and 17:05:54 (mobile 84, LCP 4.078s, CLS 0). Accessibility, best practices and SEO were already 100; preserve them.

## Implemented

- Homepage static sections now render as server components. Suburb selection remains in HomeAreas, with the same enquiry context, Sydney cards, nearby links and local guidance.
- MarketingEntry separates service/review/contact routes from the homepage. Page/service CSS loads with those routes, retaining server-rendered content rather than a collapsed loading placeholder.
- The homepage imports only three review summaries and a derived active-profile boolean, rather than shipping the complete review/profile datasets. The complete reviews page remains intact and searchable.
- Hero image now explicitly requests high priority. Supporting optimised images use low fetch priority and quality 60; the hero uses 65. Original photo assets remain unchanged.
- Gallery images switch to eager loading near the viewport using IntersectionObserver. This avoids competing with first paint while retaining reliable gallery loading.
- Header logo has a dedicated smaller WebP derivative and eager loading.
- Condensed system fallback fonts reduce heading reflow. Smaller critical font assets preserve common Latin characters, punctuation and UI symbols; original extended-character faces remain available. Display fonts use nonblocking swap.
- Build preparation regenerates the logo, image metadata, critical-font CSS and slim homepage review summary. Critical WOFF2 assets are checked-in subsets of the original fonts, with variation axes and shaping retained; they cover U+0020–00FF and U+2000–2BFF. The original fonts supply U+0100–1FFF as needed, with system fallback for unsupported glyphs.

No quote API, email recipient, credential, publishing scheduler, canonical, redirect or business content change.

## Verification

- Default `npm run build` (Next 16.2.6 Turbopack) passed with 50 static outputs and TypeScript. Earlier Webpack builds were exploratory; final measurements use the default compiler.
- 79 existing tests passed. Source-location assertions follow the extracted HomeAreas component and retain nearby/Sydney coverage. Hero priority has an additional assertion.
- 32 viewport/page checks passed without overflow or page exceptions: homepage, blocked drains, advice and reviews at eight widths from 360 to 2560px.
- Gallery images all loaded after scrolling. Service and review headings remain visible with JavaScript disabled. Coburg host-context smoke test returned its local heading.
- Invalid local quote POST returned 400. No real customer quote/email was sent in this follow-up. Existing submission code is unchanged.

Final local Lighthouse 13.5.0: mobile performance 89, LCP 3.782s, CLS 0.0021; desktop performance 99, LCP 1.026s, CLS 0.0000. Accessibility, best practices and SEO 100 on both. These are separate local lab runs, not field results or a guarantee of deployed scores. Total measured transfer: approximately 617KB mobile / 846KB desktop, including differing responsive image selections.

## Remaining limitations

Mobile LCP remains above the 2.5-second target. Framework compatibility code and unused initial-load React/CSS warnings remain; unused during load does not establish safe removal because forms, dialogs and other interactions need some of it. Small residual image estimates must be balanced against visual quality. Do not report every Lighthouse diagnostic as eliminated or promise a constant score.

Experiments that did not improve results (an inline mobile photo and a duplicate inline font approach) were removed. Experimental global CSS inlining was not enabled because the framework documentation does not recommend it for production.

Lab evidence: output/performance-20261027/final-server-home-mobile.json, final-server-home-desktop.json, smoke.json and round2-tests.txt. Live verification follows publication. No field INP or Search Console Core Web Vitals pass is established by these tests.
