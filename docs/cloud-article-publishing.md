# Cloud article publishing

GitHub Actions runs `.github/workflows/daily-article.yml`; no home PC is needed.
Add `GEMINI_API_KEY` under the repository Settings > Secrets and variables > Actions.
An optional repository variable `GEMINI_MODEL` overrides `gemini-2.5-flash`.
Keep API keys out of repository files. Provider quotas or billing may apply.

The two UTC schedules cover Sydney daylight saving, with a local 09:00 guard.
GitHub can delay scheduled runs; 09:00 is a target, not an exact guarantee.
Articles stop after 31 December 2026. Manual runs use today's calendar brief.
Published dates and generated slugs prevent repeated publication. Today's already
published article is skipped. A rerun can retry live verification after deployment.

The workflow writes an article, checks types, SEO tests and build, commits only
generated article data and calendar records, pushes main, then checks the live
Melbourne article. Vercel must remain connected to this GitHub repository.
Generation and end-to-end publication remain untested until a valid key is added.

Automated structural checks are not a guarantee of factual accuracy or rankings.
The generator avoids unsupported local facts and hazardous instructions; editorial
review remains advisable. Check GitHub Actions failures and enable GitHub email
notifications for failed workflows. Do not run the former local publisher in parallel.
