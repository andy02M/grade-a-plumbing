# Staged SEO implementation

## Stage 1: register integrity and presentation

The supplied October 2026 register is retained as 101 records covering 100
location targets. Its statuses are supplied information, not live Google checks.
The original Melbourne profile remains primary; its second profile is retained
separately. No profiles are merged, deleted or modified on Google.

Existing 82 website locations receive updated names, statuses and public Maps
links. The additional 18 targets remain in the register, but are not automatically
published as thin location pages. No indexing gate is removed in this stage.
No missing addresses, hours or qualifications are generated.

Dashboard shell marked noindex; this is not a substitute for authentication.
Fallback reviews are explicitly labelled business-wide. Pages without a recorded
address no longer invite visitors to an unspecified storefront.

## Stage 2: service information and contextual navigation

Implemented: eight service types now include additional assessment, suitability
and booking explanations plus distinct service FAQs. Relevant published guides
are linked from service pages to the Melbourne editorial host. The existing
indexing gate is unchanged; additional text alone does not establish local readiness.
TypeScript, 17 regression tests and the production build passed.

Next: review indexing readiness per existing location
using explicit business evidence and editorial checks, not only address presence.
Prioritise Active-register locations whose services remain noindex.

## Stage 3: location evidence and measured expansion

Implemented first evidence-backed batch on 1 October 2026: distinct local guidance,
official source links and matching visible/schema FAQs for Mornington, Caroline
Springs, Sunbury, Northcote, Camberwell and Werribee. Advice uses council/retailer
information, not invented local jobs, fault prevalence or storefront claims.
Source URLs and check dates are retained in `data/local-guidance.json`.

All 100 targets now have a reproducible readiness inventory (`npm run seo:locations`).
It distinguishes supplied profile status from independent verification, recorded
addresses from verified premises, and content coverage from indexing readiness.
It identifies two street-only addresses (Epping and Narre Warren), 42 active-profile
locations with service noindex and 18 unconfigured expansion targets.

Read-only live probes of all 18 expansion hosts found HTTP 200 Melbourne fallback
pages with Melbourne canonicals, not genuine matching suburb pages. The request
resolver now returns not-found for unconfigured wildcard suburb hosts instead.
All 82 configured subdomains and existing paths, www/apex behaviour, development
and Vercel previews remain unchanged. New hosts require deliberate configuration;
they are not added to sitemaps. The project-gallery heading no longer attributes
shared photographs to every suburb without job-location evidence.

Remaining: local research for the other existing locations, independent storefront
verification and complete expansion content. No new premises, hours or qualification
details were invented. No service indexing gate was removed. Source-linked practical
advice does not by itself make a page or a new location ready for indexation.

Second batch completed on 1 October: Fitzroy, Williamstown, Blackburn, Thornbury,
Craigieburn and Moorabbin. Each has distinct introductions, meta descriptions,
source-linked property guidance and local FAQs. Twelve locations now have researched
guidance; 70 configured locations remain outside this dataset. No new host or
service indexing permission was added.

Third location batch completed on 1 October: Richmond, Altona and Box Hill.
Distinct introductions, descriptions, practical guidance and visible/schema FAQs
cover public-land excavation, private connections and easements respectively.
Official council sources are linked. Regression checks now reject repeated
paragraphs, questions and descriptions and invalid related-service slugs.
Fifteen configured locations have researched guidance; 67 remain. Recorded
addresses remain unverified; no indexing gate or expansion permission changed.

## Stage 4: publisher reliability and measurement

Implemented: curated official source retrieval with response/content checks and
source hashes, supporting citations, valid related guides, deterministic duplicate
and reuse checks, and separate model reviews before and after writing. Unsupported
drafts are held rather than padded or published. Reviews are automated checks,
not independent expert fact-checks or a guarantee of accuracy.

The publisher records missed dates without backdating a catch-up batch, supports
later same-day recovery and rechecks outstanding deployments. Live verification
requires the exact editorial canonical, visible headline and body, article schema,
publication/update dates, and no noindex directives. The workflow commits only
article data, calendar state and the publication log. Manual verification-only
runs can test sources and existing publication without generating another article.

Repository baseline collection is available with `npm run seo:baseline`. Search
Console, enquiries and field Core Web Vitals remain unknown until authorised
account data is available; they are never presented as zero or invented scores.
RESEND_API_KEY was subsequently saved in GitHub. The test email workflow passed
and the user confirmed receipt on 1 October 2026. Failure email delivery is now
configured and tested; the initial missing-secret limitation is resolved.
