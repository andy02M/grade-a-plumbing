# Manus migration implementation and verification

Date: 14 October 2026. Branch: `codex/manus-migration`. Production and main have not been deployed or merged by this migration.

## Implemented

- Imported the approved Manus React components, twelve detailed service content packages, typography, CSS, locality catalogue, fonts and photography into the existing Next.js application.
- Replaced homepage, public shell, contact page, services, service-area directory, advice listing and article presentation. Added the shared quote popup. Existing service URLs remain canonical; Manus naming variants permanently redirect to the established emergency, hot-water and burst-pipe routes.
- Preserved existing backend API routes, booking section, call/Telegram/GBP/Calendly code, article data, no-Gemini publishing workflow, measurement component, robots and sitemap index. The sitemap includes the four additional service pages.
- Preserved 82 location homepages, local guidance, recorded storefront addresses and FAQ schema. Added service and FAQ schema for the Manus service content.
- Preserved the 619-record locality catalogue, including Penrith, Blacktown and North Sydney, and the existing location website links.
- Replaced unverifiable Manus sample reviews (Michael T., Sarah L., David R.) with the existing supplied review records. Relative dates are labelled as supplied dates, not asserted as current. No aggregate rating was fabricated.
- Connected the shared quote form to `/api/quote/`. Name, phone, email, location ID, suburb, postcode/state, service, description, contact preference, requested day/date/time and an optional photo are preserved.
- Added a single JPG/PNG/WebP email attachment up to 2 MB, with server size/type-signature validation. No HEIC or 10 MB capability is claimed. No external photo-storage service is required.
- Added validation, bounded request fields, provider timeout, privacy-safe failure logging, a submission lock and Resend idempotency. A changed retry payload gets a new request ID. UI success requires backend `ok: true`; appointment preferences are not presented as confirmed bookings.
- Existing recipients remain `support@gradeaplumbing.store` and `zenn@gradeaplumbing.store`.

## Evidence

| Check | Result |
| --- | --- |
| TypeScript | Passed |
| Automated tests | 65 passed |
| Next.js production build | Passed |
| Main public routes | 21 routes returned HTTP 200 with rendered H1 and canonical in the browser |
| Responsive layout | 160 checks: 20 primary pages × 8 requested widths; no horizontal overflow after fixing directory alphabet wrapping |
| Location homepage host simulation | All 82 returned HTTP 200 with matching root canonical; bare-host and slash root URLs were normalised as equivalent |
| Published articles | All 8 matched canonical, headline, dates, Article schema and visible text using the existing live verifier |
| Visual comparison | Original export and migrated homepage screenshots compared at 1440×900; core typography, hero, photography and layout match closely; advice navigation and functional form additions are intentional |
| Melbourne autocomplete | Coburg VIC 3058 selected; location fields captured in the request |
| Sydney autocomplete | Penrith NSW 2750 option displayed; all three Sydney records present in catalogue |
| Form failure UX | Mock HTTP 503 produced the error message and left retry enabled |
| Form success UX | Mock HTTP 200 with `ok: true` showed receipt and disabled duplicate clicks |
| API/provider boundary | Mock provider acceptance required for HTTP 200; failed provider returned HTTP 503; repeated request sent one mocked notification |
| Photo request | PNG test file included in browser payload and recipient payload validated by tests |
| Real notification test | Attempted once with clearly labelled data and a PNG; HTTP 503 because the local Resend configuration was absent. No delivery claimed |

Screenshots are in ignored `output/playwright/`; browser artifacts are ignored and excluded from Vercel upload. No real customer was contacted. No automated test created a real appointment.

## Verified Vercel project

CLI inspection confirmed `andy02ms-projects/grade-a-plumbing`, project ID `prj_RtjSBjxFIhjx7VLKmyEk9b3LeibS`, team `team_MlGF618TLyQZmZJpLhpn9OiV`. Both `gradeaplumbing.store` and `melbourne.gradeaplumbing.store` resolved to production deployment `dpl_EjcJpVK8yqErnB7SJLGSYpQMsgPa`, commit `2efba85c5be857f7c97301eb848d2d14c4d4fd07`.

Local `.vercel/project.json` now points to the confirmed project, not `gmb-autopilot`. The authenticated Vercel connector returned 403; CLI inspection succeeded using its own credentials. The initial preview deployment was READY at `https://grade-a-plumbing-hjrxqlavd-andy02ms-projects.vercel.app`; later source corrections require the refreshed branch preview. Preview protection remains enabled. Authenticated CLI fetch confirmed the initial preview homepage content and canonical. This is not a production release.

## Unresolved configuration and verification

1. `RESEND_API_KEY` and `QUOTE_FROM_EMAIL` are absent from the local and inspected Preview environment. Add a test-capable key and verified sender directly in Vercel, scoped to Preview or the migration branch, then redeploy and repeat the labelled end-to-end test. Inbox delivery and actual attachment delivery are not verified.
2. **Local environment incident:** Vercel CLI 50.4.5 `link --yes` unexpectedly refreshed `.env.local` and removed `GOOGLE_GBP_CLIENT_ID`, `GOOGLE_GBP_CLIENT_SECRET` and `GOOGLE_GBP_REFRESH_TOKEN`. The refreshed file was then saved as ignored `.env.manus-development.snapshot`. The available old-project Development pull and existing local production snapshot did not contain those three keys. Their previous local values must be restored through OneDrive Version History or secure reconfiguration. No production credential or DNS was changed. Do not claim original local configuration preservation complete until this recovery is resolved.
3. Existing Redis/call/booking credentials are scoped to Preview as well as Production in Vercel. The migration did not exercise production call/webhook/GBP automation or write to those services. Their code remains preserved; they are not claimed end-to-end retested. Preview credentials should be scoped to appropriate test resources before exercising such flows.
4. The application has no new durable production quote database. Acceptance means the email provider accepts the notification. This preserves the established email-based quote workflow; it does not imply database storage or inbox delivery.
5. No field Core Web Vitals measurement or independent accessibility certification is claimed. The requested widths, labels, keyboard-native dialog and browser rendering were checked; follow-up audits can assess broader performance/accessibility.

## Release and rollback

Do not merge into main or promote the preview yet. Complete the unresolved quote notification test and local configuration recovery first. Reconcile any articles published on main during the migration before final release. Take a fresh production deployment record and obtain explicit production approval.

Protected branches remain `codex/pre-manus-backup-2026-10-14` and `codex/pre-manus-live-2026-10-14`. The latter records the live source baseline at inspection. If an approved release must roll back, use the verified known-good deployment on this project; confirm production aliases afterward and account for Vercel rollback disabling automatic assignment. No rollback has been executed.
