# GMB AutoPilot implementation prompt

Improve the existing Vercel application into a working Google Business Profile automation workspace.

Provide a clear menu for connected Google accounts, their actual business profiles, reusable post templates, the daily publishing queue, profile-creation drafts, and activity. Connect multiple Gmail accounts to the signed-in owner's workspace. Keep each owner's records and encrypted credentials separate.

Allow users to write and save templates with a Call now, Learn more, Book, or no button, an optional public image URL, and business-name, city, phone, and website variables. Select individual profiles, a Google account's profiles, or all eligible profiles. Preview the content, choose a date range and time zone, and save one post per day per unique business profile using template rotation.

Use persistent storage for templates, drafts, schedules, and per-profile results. Implement pause, resume, cancel, and explicit retry for failed posts. Run due posts from an authenticated server scheduler, record Google's post identifier and actual state, and avoid repeating uncertain publishing attempts. Never label sample content as scheduled or an unconfirmed Google response as published.

Provide business-profile creation on a selected connected Gmail account and selected Google Business Profile account. Save configurable name, category, contact information, description, address or service area, and hours in a draft. Validate settings before submission; use a stable request ID to prevent duplicate creation. Surface required verification and API approval accurately. Do not create fabricated locations or claim Google verification is automatic.

Keep the interface responsive, accessible, and useful when an account is not connected or Google access is blocked. Test account isolation, scheduler dates across daylight saving, template expansion, API validation, duplicate prevention, and persisted results using isolated fixtures. Deploy the upgrade to the existing gmb-autopilot Vercel project. Do not publish test posts or create test profiles on Google.

Report which features are implemented and deployed, and distinguish any external Google or hosting limitations from completed application functionality.
