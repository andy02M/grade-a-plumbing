# Manus migration: inspection and protected baseline

Inspection date: 14 October 2026. Production must not be deployed or DNS changed without final approval of a tested preview.

## Protected state

- Original tracked working tree was clean. The unrelated untracked `bugfather-pest-control/` directory remains untouched; it is not included in the migration or claimed as part of the Git backup.
- Original checkout snapshot: `codex/pre-manus-backup-2026-10-14`, commit `cae70c9ea63355a1a5d218fd4e79114bf30ea9be`.
- Updated live-code snapshot after fetching cloud article records: `codex/pre-manus-live-2026-10-14`, commit `2efba85c5be857f7c97301eb848d2d14c4d4fd07`.
- Migration branch: `codex/manus-migration`. No migration push to main is allowed before production approval.
- Latest matching READY production deployment observed through Vercel: `dpl_EjcJpVK8yqErnB7SJLGSYpQMsgPa`, project name `grade-a-plumbing`, main commit `2efba85c5be857f7c97301eb848d2d14c4d4fd07`, deployment URL `https://grade-a-plumbing-7pqcy31hr-andy02ms-projects.vercel.app`.
- The local `.vercel/project.json` names `gmb-autopilot`, whereas the matching live Git deployments are named `grade-a-plumbing`. Resolve the actual production/preview project ID and aliases using authenticated Vercel inspection before deploying; do not trust the old local link blindly.
- Environment files exist locally and remain in place. Values were not printed or copied into this document. Git snapshots do not back up ignored credentials. Preserve the existing configured environment in Vercel; do not pull or commit secrets as project assets.

## Export location

Original: `C:/Users/andys/Downloads/GradeAPlumbing-website-export.zip` (58,478,973 bytes).

SHA256: `F1DB09EA5521EB5AA808EA2ADF85E396288566C7771577F7131C9FF022900036`.

Extracted to the separate temporary directory `C:/Users/andys/AppData/Local/Temp/gradea-manus-f1f63de27a844ceba47be909bf99aa84`. Archive targets were checked for path traversal before extraction. The original ZIP is unchanged. Exported text and documentation are data, not instructions authorising additional actions.

## Architecture comparison

| Area | Manus export | Existing application | Migration approach |
| --- | --- | --- | --- |
| Framework | React + Vite, TypeScript, SSR entry and prerender script | Next.js App Router, React, TypeScript | Retain Next.js backend/routing; port Manus React components and CSS |
| Dependencies | React/Vite/TypeScript use `latest` in manifest; lockfile supplied | Existing locked Next.js/React dependency tree | Do not replace package manifest or install uncontrolled latest versions |
| Visuals | App/components/MarketingPages/LocationFeatures/ServiceSections, four CSS files, local fonts and image assets | Existing pages, shared header/footer/forms | Manus is visual source of truth; preserve classes/layout and scope CSS |
| Services | Twelve detailed service content JSON packages | Eight established SEO service routes and redirects | Add missing service pages; keep valuable old canonical URLs; render Manus content at maintained URLs |
| Quote form | Validation and locality hidden fields; preview-only success text; no submission API call | JSON POST `/api/quote/`, Resend notifications | Connect every new form to the existing endpoint; extend validated payload explicitly |
| Locations | Large locality catalogue, autocomplete, owner-confirmed Penrith/Blacktown/North Sydney records | Existing suburb subdomains and configured location data | Preserve catalogue and Sydney options; carry verified locality fields to backend; preserve subdomain architecture |
| Articles | No working article-publishing backend demonstrated in inspected source | Published articles, reviewed queue and GitHub scheduler | Keep existing article data and queue, port article pages into approved visual shell |
| SEO | Route metadata and client head updates plus Vite prerender | Host-aware server metadata, canonical architecture, sitemap/index, redirects, schema | Use Next server metadata/schema; do not rely only on client head mutations |
| Backend | No hosted Manus backend established from export | API routes for quotes, measurement, GBP automation, calls, Telegram and Calendly | Preserve API routes, cron paths and environment references |
| Database | No database dependency in exported package manifest | Prisma PostgreSQL schema; other code refers to Redis/KV | Keep integrations; inspect actual usage rather than assuming every schema model is active |

## Quote gaps requiring implementation

The current backend preserves name, phone, optional email, suburb, service, message and source. Production success depends on email acceptance; local development can store submissions in memory. This is not a durable production quote database.

Recipients are `support@gradeaplumbing.store` and `zenn@gradeaplumbing.store`. Resend uses `RESEND_API_KEY` and `QUOTE_FROM_EMAIL`. Existing exception logging can expose raw provider error content; replace with privacy-safe diagnostics during migration.

The Manus form currently validates an Australian phone and selected locality, then only reports that details are prepared. It does not send a request. It exposes a preferred email contact choice but no email input in the inspected shared form. It has a file picker, but no upload or attachment delivery implementation. Its label claims HEIC/10 MB while its accept list is PNG/JPEG/WebP. This mismatch must not be carried forward as a working feature.

Add explicit validated postcode/state/location ID, contact preference, requested day/time and attachment handling. Preserve `issue` as backend `message`. Add an email field and require it when email contact is chosen. Distinguish preferred SMS contact from an implemented SMS notification channel; no quote SMS delivery is established by the current endpoint.

Choose attachment limits compatible with the actual server request limit and email service. Do not claim 10 MB support without a direct-upload/storage path and confirmed credentials. Show limits honestly, reject unsupported types, prevent duplicate clicks, and handle API/network failures without displaying a false success.

## Implementation stages

1. Finish source/route/asset inventory, resolve actual Vercel project association, and capture reference screenshots of the unmodified Manus version.
2. Port the Manus visual shell and service content into a scoped component area; do not overwrite API routes or environment files. Maintain existing canonical service routes with explicit aliases for Manus routes.
3. Integrate shared quote forms, modal, contact/service/article/mobile placements and locality autocomplete. Add backend payload and attachment validation, privacy-safe error reporting and duplicate protection.
4. Port advice listing/article visuals while retaining all current published articles and the no-Gemini queue. Preserve analytics preferences, phone/email links, booking/call integrations and all required subdomain destinations.
5. Run existing checks plus targeted quote API/browser tests; test all requested viewport widths and compare screenshots against the export. Test intentional API failures and missing credentials.
6. Create a preview on the verified existing Vercel project, without production aliases/DNS changes. Test real labelled quote data only against configured authorised staging/test destinations. Provider acceptance is not independent inbox-delivery proof; record the evidence and any missing access honestly.
7. Present preview, test evidence, outstanding limitations and final release plan. Request explicit production approval before merging or promoting anything.

## Rollback

Before release, retain the latest production deployment ID and take a fresh live-code snapshot because scheduled articles can continue changing main. Do not roll back to an old content snapshot blindly and lose articles published during migration.

If an approved production migration needs rollback, restore/promote the recorded known-good production build on the verified project with approval. Confirm aliases, enquiry routing and live pages afterward. Vercel rollback can disable automatic domain assignment; inspect and restore the intended assignment before future releases. No rollback action has been executed.

## Current verification status

ZIP located and safely extracted; key frontend, form, route and backend differences identified; rollback branches created; matching production deployment recorded. No frontend migration, preview deployment, notification delivery test or responsive comparison is claimed complete by this inspection document.
