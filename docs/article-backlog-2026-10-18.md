# Article queue refill — 18 October 2026

Five complete original articles added to the existing reviewed queue. No Gemini/API generation calls were used. Existing release history and generated articles remain unchanged.

1. Drain Camera Reports: Questions to Ask Before Approving Repairs
2. Heat Pump Hot Water: Prepare for a Site Assessment
3. Repair or Replace a Toilet? Questions Before Buying a New Suite
4. Outdoor Tap Repairs: Plan the Assessment Before Changing Garden Connections
5. Apartment Plumbing Work: Coordinate Access and Water Interruptions

Each article has six distinct sections, FAQs, metadata, existing business contact information, source records and supported service/related-article references. Existing rendering supplies the Melbourne location link, canonical and Article metadata on publication.

Official pages reviewed on 18 October: Consumer Affairs Victoria (quotes), Building and Plumbing Commission (engaging a plumber), Greater Western Water and South East Water (blockages), Australian Government energy.gov.au (hot water), and YourHome (hot water and water use). Review is AI editorial review, not practitioner certification. General checklists are original editorial suggestions; technical, regulatory and ownership decisions remain for the appropriate professional or authority.

These general guides are not suburb case studies. No jobs, credentials, prices, availability, addresses or response times have been invented. They target the existing Melbourne editorial host, not fabricated local evidence.

The existing daily publisher selects one eligible ready entry per Sydney date, assigns the actual publication date and verifies the deployed article. This refill does not bulk-publish drafts or alter the scheduler, backend, credentials, styling or unrelated local work.

The queue regression test now validates reviewed entries against the current date instead of the original starter batch's 10 October date; its review-date guard remains intact for later batches.

Publishing prerequisite repair: latest main had deleted ArticlesSection, LocalGuidanceSection and their homepage rendering/FAQ schema, leaving three pre-existing SEO regression tests failing. Restored these existing sections from the approved migration commit 1a197eb; no test assertions were removed. The Manus hero, navigation and other current design components are unchanged.

Verification: 63 automated tests pass; TypeScript and production build pass. New body word counts: 1,314 / 1,261 / 1,241 / 1,248 / 1,225. Eight entries are ready in total; original three remain ahead of the refill. No new article was marked published or given a fabricated publication date. Dependency installation reported 17 audit findings in the existing lockfile; no unrelated dependency upgrades were attempted.
