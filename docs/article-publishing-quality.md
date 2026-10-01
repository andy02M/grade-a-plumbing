# Cloud publishing quality and reliability

## Publication rules

The publisher aims for one useful article a day, not one regardless of quality.
Suburb booking keywords belong to the matching homepage/service page. General
guides retain their Melbourne editorial URLs. No existing published URL changes.

Before writing, the publisher loads the actual published catalogue rather than
hardcoded titles, checks configured/supplied-Active location eligibility, rejects
suburb-swapped duplicate titles and retrieves curated official source pages.
It checks HTTP status, content type, permitted redirect hosts and usable text.
Blocked sources are recorded; at least two usable supporting pages are required.
Pages are evidence, never instructions. Technical, safety and local claims outside
that evidence must be omitted or cause a hold. Sources for particular retailers
must not be generalised to every location.

A separate model request reviews proposed intent and evidence adequacy against
published and scheduled topics. The full draft then passes structure, length,
contacts, link, source-reference and repeated-wording checks followed by another
model review. Real published related-guide slugs are retained. Supporting source
links can be displayed by section as well as in further reading. Retrieved dates,
hashes and editorial decisions are recorded in the publication log.

These checks reduce risk; they cannot establish that an AI-generated statement is
true or replace a qualified review of complex technical advice. No fabricated
author qualifications, local jobs, storefronts, reviews, prices, attendance times
or ranking promises are permitted. An accessible government URL alone is not
proof that it supports every statement in a draft.

## Scheduling, holds and recovery

Sydney-local date and hour determine the publishing window, including daylight
saving. Two UTC schedule entries cover 09:00 across the seasonal offset. A third
entry at 02:00 UTC provides a later recovery opportunity; it is not another daily
article slot. GitHub scheduled runs can be delayed, so exactly 09:00 is not a
guaranteed delivery time. The current schedule continues until disabled, matching
the later request to continue until stopped rather than the original year-end cap.

Calendar and generated-article guards prevent a second publication on the same
Sydney date. Missed planned dates become `missed`, not backdated articles. An
incomplete deployment remains `awaiting-deployment` until verified. Retry-required
failures can retry on a later run. Editorial holds do not automatically repeat
paid generation during the same day; a deliberate manual run can retry the brief.

Holds and failures are persisted before the job fails so the reason remains in
GitHub and can trigger failure notifications. Prepared content is committed only
after project checks. Publication is marked verified only after live HTML passes
canonical, indexability, headline, schema, date and visible paragraph checks.
A manual verification-only workflow run tests sources and the existing article
without Gemini generation.

## Alerts and measurement limitations

The initial missing RESEND_API_KEY was resolved on 1 October 2026. GitHub's test
email workflow succeeded and the user confirmed receipt at andys1stalt@gmail.com.
Failure email delivery is configured and tested. Failures and holds also remain
recorded in Actions and the repository publication log.

`npm run seo:baseline` reports observable repository content and coverage only.
Search Console impressions, clicks, CTR, query/page positions and Google indexed
pages are unknown here. Verified enquiry attribution and field Core Web Vitals
are also unavailable. Once authorised access exists, compare 28-day periods by
hostname, landing page and booking/informational intent, and relate changes to
enquiries rather than article counts. Do not infer Google index counts from a
`site:` search or equate the application's indexable flag with Google indexing.

## Policy references

Google's [generative AI content guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
and [people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
inform the hold-before-volume approach. Generated pages without added customer
value can create scaled-content risks; automation and length are not ranking
advantages by themselves.
