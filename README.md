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

## Telegram Call Alerts

Customer call notifications are handled by [app/api/call-alert/route.ts](./app/api/call-alert/route.ts). Configure Vapi or Twilio to send call webhooks to:

```txt
https://your-live-domain.com/api/call-alert?secret=your_webhook_secret
```

Required Vercel environment variables:

```txt
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
CALL_WEBHOOK_SECRET=choose_a_long_random_secret
```

To send alerts to more than one Telegram chat or group, separate IDs with commas and no spaces:

```txt
TELEGRAM_CHAT_ID=1190815241,-5312911777
```

Optional but strongly recommended if you want reliable final recording alerts even when Vapi does not send a separate `recording-ready` webhook:

```txt
VAPI_PRIVATE_KEY=your_vapi_private_key
```

Optional recording link signing secret:

```txt
RECORDING_LINK_SECRET=choose_a_second_long_random_secret
```

If `RECORDING_LINK_SECRET` is not set, recording links are signed with `CALL_WEBHOOK_SECRET`. Raw `storage.vapi.ai` links can fail in a browser because Vapi recordings are fetched through the Vapi API. Telegram alerts now use a signed website URL like:

```txt
https://your-live-domain.com/api/call-recording/your_vapi_call_id?token=secure_token
```

To test Telegram delivery after deployment, open:

```txt
https://your-live-domain.com/api/call-alert?secret=your_webhook_secret
```

To check whether the live deployment has all required environment variables, open:

```txt
https://your-live-domain.com/api/call-alert?secret=your_webhook_secret&status=1
```

To check whether the live deployment can fetch a specific Vapi call and see its recording URL, add the Vapi call ID:

```txt
https://your-live-domain.com/api/call-alert?secret=your_webhook_secret&status=1&callId=your_vapi_call_id
```

Recommended Vapi setup:

- Add the webhook URL above as the assistant/server URL for call notifications.
- Enable call lifecycle events such as `call-started`, `call-ended`, `call-failed`, or server messages such as `status-update`, `end-of-call-report`, and `recording-ready`, depending on what your Vapi dashboard exposes.
- The initial ringing, in-progress, or ended alert will not include a recording because the customer may still be on the call or Vapi may still be processing the recording. The final completed-call alert is only sent when a recording URL is available, either from `recording-ready` or from a final payload that already contains a recording URL.
- If Vapi only sends `status-update` and does not later send `recording-ready`, the site can now poll the Vapi Call API after the call ends and send the Telegram recording alert once the recording becomes available. This requires `VAPI_PRIVATE_KEY` to be set in Vercel.
- Do not replace the Twilio voice routing URL if it is already connected to Vapi. Use Vapi call webhooks first so the AI assistant keeps answering calls.

## Vapi Calendly Booking Tools

Vapi can check Calendly availability and create bookings through [app/api/vapi/calendly-tools/route.ts](./app/api/vapi/calendly-tools/route.ts).

Endpoint:

```txt
https://your-live-domain.com/api/vapi/calendly-tools?secret=your_vapi_tool_secret
```

Required Vercel environment variables:

```txt
CALENDLY_ACCESS_TOKEN=your_calendly_personal_access_token
CALENDLY_EVENT_TYPE_URI=https://api.calendly.com/event_types/your_event_type_uuid
VAPI_TOOL_SECRET=choose_a_long_random_secret
CALENDLY_TIMEZONE=Australia/Melbourne
```

Optional, only if your Calendly event type requires a location payload:

```txt
CALENDLY_LOCATION_KIND=ask_invitee
CALENDLY_LOCATION_VALUE=
```

Create two Vapi custom tools that POST to the endpoint above:

1. `check_calendly_availability`
   - Inputs: `start_date`, `days`, `limit`, `timezone`
   - Returns available appointment slots.

2. `book_calendly_appointment`
   - Inputs: `start_time`, `customer_name`, `email`, `phone`, `property_address`, `suburb`, `service_needed`, `issue_summary`, `urgency`, `access_notes`, `timezone`
   - Creates the Calendly booking after payment has succeeded.

If Calendly fails, the assistant prompt should use the manual follow-up fallback instead of promising a Calendly-confirmed booking.

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
