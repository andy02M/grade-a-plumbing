# Automation upgrade: operations

The dashboard now loads actual workspace records. The former sample profile list, sample activity entries, and hard-coded September queue are not imported as real campaigns. Existing Google/browser schedules remain outside this queue.

## Connected accounts and storage

Sign in with Google to open a private workspace, then use Add Google account to authorize each Gmail account that manages business profiles. Workspace cookies are signed, HttpOnly, and expire after seven days. Additional-account OAuth is bound to the currently signed-in owner. The original owner's verified Google identity retains the existing default workspace and legacy connected accounts.

Google refresh tokens are encrypted with AES-256-GCM and never included in API responses. The existing PostgreSQL account store remains supported; with the current deployment, account records and all new automation records use durable Redis. Templates, profiles, drafts, per-profile posts, and events have separate workspace keys. Storage errors fail the operation rather than pretending a write succeeded in process memory.

## Publishing

Create templates, sync profiles, select targets, and preview a daily campaign. Content is rendered and saved per profile when scheduling. Shared locations selected through multiple Gmail accounts are deduplicated. Existing non-cancelled slots with the same profile and timestamp are not scheduled again. Editing templates does not silently change scheduled posts.

The protected `/api/automation/run` worker checks due posts and Google processing statuses. `CRON_SECRET` authenticates the Vercel cron; dashboard-triggered runs require the workspace session and same-origin requests. The current Hobby deployment runs once per day at 23:00 UTC, with Vercel's within-hour timing. A selected time is the earliest publication time, not a promise of exact-minute execution. Melbourne daylight saving changes the local worker time from 09:00 to 10:00.

Each run uses a durable workspace lock and three concurrent publishing operations, with a bounded work window. Remaining work stays in the queue; the dashboard reports the remainder and provides Run due posts. For larger workloads and precise timing, configure a more frequent scheduler and appropriate hosting before onboarding customers. The implementation currently limits one scheduling request to 5,000 profile posts and a workspace to 20,000 saved posts.

Google LIVE becomes PUBLISHED. PROCESSING or other pending states remain SUBMITTED. A definitive failure can be retried explicitly. Timeouts after a Google write, or interrupted publishing attempts, become NEEDS_REVIEW and are not automatically resubmitted. Inspect Google before scheduling replacement content in those cases.

## Creating business profiles

Save a draft specifying the connected Gmail, Google Business account, real business name, category, phone, website, description, address or service-area places, and opening hours. The draft can be saved before Google API access is available. Category lookup, profile sync, validation, and submission require approved Google API access.

Validate saved settings with Google's `validateOnly` request, then submit the saved draft. Creation persists a request UUID before contacting Google. Ambiguous creation results are held for review. Reuse settings prepares another draft and clears the business name. Creating a profile does not verify it, and Google may require manual ownership verification. Service areas require region place IDs, with at most 20 areas.

## Verification performed

- `node scripts/test-automation.mjs`: isolated server tests covering date ranges, Melbourne daylight saving, content validation, account isolation, durable storage failure, scheduling deduplication, publication states, retry rules, and draft creation.
- `node scripts/test-automation-ui.mjs`: local browser tests of menus, template saving, campaign preview/saving, account-specific draft saving, mobile overflow, and the sign-in gate. Uses intercepted test data, never live accounts.
- `npm run build`: Next.js production compilation and type checking.

The tests do not publish public Google posts or create public business profiles. Google account connection and approved API access must be verified with a real authorized session separately. Billing, customer onboarding, commercial hosting, Google OAuth production verification, retention policies, and operational monitoring are still required before a public SaaS launch.
