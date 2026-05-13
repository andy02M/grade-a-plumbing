# Grade A Plumbing Website

Premium, SEO optimised plumbing website for Grade A Plumbing in Melbourne, Victoria.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Server components by default
- Client component only for the placeholder quote form

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run typecheck
npm run build
```

## Deploy To Vercel

1. Push the `grade-a-plumbing` folder to a Git repository.
2. Import the project in Vercel.
3. Set the project root to `grade-a-plumbing` if this folder sits inside a larger repository.
4. Use the default Next.js build settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output: handled by Next.js

## Connect Your Purchased Domain

1. In Vercel, open the project settings.
2. Go to Domains.
3. Add your purchased domain.
4. Follow Vercel's DNS instructions from your domain store.
5. Wait for DNS propagation and SSL certificate activation.

## Update Contact Details

Edit [lib/site.ts](./lib/site.ts):

- `phone`
- `phoneHref`
- `email`
- `emailHref`
- `serviceArea`

The current contact email is:

```txt
support@gradeaplumbing.store
```

## Update The Domain Placeholder

The current placeholder base URL is:

```txt
https://gradeaplumbing.com.au
```

To change it, edit `baseUrl` in [lib/site.ts](./lib/site.ts). This updates canonical URLs, Open Graph URLs, sitemap URLs, robots.txt, and schema helpers.

## Quote Form

The quote form now submits to [app/api/quote/route.ts](./app/api/quote/route.ts).

Current behaviour:

- Accepts quote submissions during local development for testing
- Sends quote submissions by email with Resend when you configure environment variables
- In production, the route expects email delivery to be configured so quote requests are delivered reliably

Production email delivery environment variables:

```txt
RESEND_API_KEY=your_resend_api_key
QUOTE_FROM_EMAIL=Grade A Plumbing Quotes <quotes@your-verified-domain.com>
```

Without `RESEND_API_KEY`, local development still works for testing. Before going live, set `RESEND_API_KEY` and `QUOTE_FROM_EMAIL` in Vercel so every quote request is delivered reliably.

## Submit Sitemap In Google Search Console

After deployment and domain connection:

1. Open Google Search Console.
2. Add or select the verified domain property.
3. Go to Sitemaps.
4. Submit:

```txt
https://gradeaplumbing.com.au/sitemap.xml
```

If your live domain is different, use your live domain instead.

## Main Pages

- `/`
- `/emergency-plumbing-melbourne`
- `/blocked-drains-melbourne`
- `/hot-water-repairs-melbourne`
- `/commercial-plumbing-melbourne`
- `/service-areas`
- `/contact`
