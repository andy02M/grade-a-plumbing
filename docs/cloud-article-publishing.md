# Cloud article publishing

GitHub Actions runs `.github/workflows/daily-article.yml`; no home PC is needed.
Add `GEMINI_API_KEY` under the repository Settings > Secrets and variables > Actions.
An optional repository variable `GEMINI_MODEL` overrides `gemini-2.5-flash`.
Keep API keys out of repository files. Provider quotas or billing may apply.

The two UTC schedules cover Sydney daylight saving, with a local 09:00 guard.
GitHub can delay scheduled runs; 09:00 is a target, not an exact guarantee.
There is no end date. Disable the Daily plumbing article workflow in GitHub Actions
to stop it. Manual runs use today's calendar brief. Once the existing calendar
runs out, Gemini plans a new topic for a rotating existing suburb, checks duplicate
titles and slugs, then generates the article. Intent similarity still needs review.
Published dates and generated slugs prevent repeated publication. Today's already
published article is skipped. A rerun can retry live verification after deployment.

The workflow writes an article, checks types, SEO tests and build, commits only
generated article data and calendar records, pushes main, then checks the live
Melbourne article. Vercel must remain connected to this GitHub repository.
Key/model access and a no-op daily run have passed; fresh generation and
end-to-end deployment still need to be observed on a new publication day.

Automated structural checks are not a guarantee of factual accuracy or rankings.
The generator avoids unsupported local facts and hazardous instructions; editorial
review remains advisable. Do not run the former local publisher in parallel.

## Failure emails

Add a sending-capable `RESEND_API_KEY` GitHub Actions secret. The default sender
is support@gradeaplumbing.store; its domain must be verified in Resend. Override
using the `ALERT_FROM_EMAIL` repository variable if needed.
Article failure email is a separate workflow triggered by a failed, timed-out or
cancelled publisher run, including dependency install or checkout failures.
It sends to andys1stalt@gmail.com with the failed run link, not raw logs or secrets.
Run that workflow manually to send a test. Successful article runs are silent.
Email-provider failures appear in its own Actions log; no system can guarantee
delivery during provider outages or detect a schedule that GitHub never starts.
