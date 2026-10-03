# Publishing recovery — 3 October 2026

Verified remote failures: 2 October draft failed the 1200–2200 word gate; 3 October
brief was rejected for booking intent, overlap and irrelevant stormwater evidence.
These are separate from earlier provider 503, token truncation and quota failures.

Changes: one replacement topic after a negative brief review, constrained to the
same Active configured location. Replacement evidence is fetched afresh and the
brief is reviewed again. Rejected intent remains in planning/review exclusions.
One draft revision may address validation or editorial feedback; the revised
draft must pass the complete validator and editorial review. Length errors now
record actual word count. No minimums, source checks or safety gates were relaxed.

Provider failures continue to use existing bounded retries and never trigger a
quota-bypassing model switch. A second quality failure stays held. Duplicate-day,
commit/build and live canonical/schema/content verification gates remain active.
Failed raw drafts are not published. Successful records indicate whether a
revision was used. No provider uptime, quota availability or daily publication is
guaranteed; genuinely unsuitable topics should still be skipped.
