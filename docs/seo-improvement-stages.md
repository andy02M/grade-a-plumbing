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

## Stage 4: publisher reliability and measurement

Require verified source material, related-article links, semantic intent review
and a skip gate for weak drafts. Add missed-run detection and stronger deployment
verification. Establish Search Console and enquiry baselines when access exists.
Unresolved email-secret configuration must not be reported as working delivery.
