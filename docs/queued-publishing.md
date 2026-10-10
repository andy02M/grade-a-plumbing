# Reviewed queue publishing

The daily GitHub workflow consumes `data/article-queue.json`. It does not call an AI provider or download source pages at release time. The existing Melbourne editorial host, suburb subdomains and URLs are unchanged.

Only entries with completed source-checked editorial approval and `status: ready` can release. Source reviews in this starter batch are AI editorial reviews performed in the chat, not certification by a plumber. Technical information was checked against linked official sources. Content needs a new review if facts or the intended release window change.

Each entry needs a complete original article, keyword, earliest release date, reviewed sources, section citations, valid service/article links and at least one configured Active location. Structural validation retains the 1,200–2,200-word gate and originality/contact checks. It does not prove factual accuracy; editorial approval remains necessary before adding entries. A title change or changing an approval flag is not a substitute for review.

At or after 9 AM Sydney time (or manual dispatch), one ready entry can be prepared per Sydney date. Its actual release date is assigned then, never backdated. Prior pending deployments must verify before another entry is consumed. Missed days are not published in a batch. GitHub scheduling can be delayed; 9 AM is the target, not a guaranteed timestamp.

The workflow runs tests and build checks before pushing. The production Git integration deploys to the existing website. A separate live check requires the article text, canonical, headline, publication date and Article schema to match before recording publication. Released entries remain in the queue as an audit trail. A retry verifies a pending article rather than writing it again.

Failure alerts use the existing Resend setup. A separate deduplicated email alerts `andys1stalt@gmail.com` when fewer than seven entries remain, and again at zero. No new articles are generated indefinitely: the queue must be replenished with reviewed content. Provider acceptance is not proof of inbox delivery.

The old AI generation script remains available for development, but is no longer used for daily generation. Do not re-enable it silently as an empty-queue fallback.
