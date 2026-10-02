# Article workflow recovery — 2 October 2026

Run 36951168909 failed during Gemini generation, not the website build. The old model metadata lookup succeeded but did not establish generation access. Recovery run 36957285717 returned Google's actual explanation: gemini-2.5-flash is no longer available to new users and the recommended replacement is gemini-3.8-flash.

The publisher default now uses that replacement. GEMINI_MODEL remains an explicit override; models/ prefixes and surrounding whitespace are normalized. The preflight now performs a small JSON generation request through the same client used for editorial reviews and articles. Provider messages are retained in bounded, credential-redacted errors. Temporary 429/5xx failures receive at most three attempts with short backoff; permanent 404/auth failures are not blindly retried.

No billing or account settings were changed. Editorial holds, source checks, daily duplicate protections, article-only commits and live deployment verification remain in force. These safeguards improve diagnosis and recovery; they cannot guarantee that a third-party API will never fail or that every draft will meet the quality standard.

The replacement model subsequently returned 503 high-demand errors. The maintained default now has one bounded availability fallback to the supported gemini-3.7-flash model. Explicit GEMINI_MODEL overrides are respected; authentication, quota and billing failures never switch models. Both models pass through the same JSON, evidence and editorial gates. Exhausted provider availability still fails honestly and sends the existing notification.

Recovery run 36957567240 passed real JSON generation, then the longer article request exhausted availability on both models. The workflow now checks again at 02:00, 04:00, 06:00 and 08:00 UTC, during the Sydney afternoon/evening. Sydney-date locks prevent duplicate daily publication; verified and editorial-held days do not regenerate. Recovery is cloud-hosted and does not require the owner's PC. Today's article remains retry-required unless a later run verifies publication.

Provider reference: https://ai.google.dev/api/generate-content

Availability follow-up: after both full Flash models exhausted capacity, the
bounded fallback was changed to the stable gemini-3.1-flash-lite model. It supports
structured JSON outputs, but is lighter; the same draft validation, source checks
and editorial approval remain mandatory. This is not permission to lower the
publication standard. No billing or account settings are altered.
Reference: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite
