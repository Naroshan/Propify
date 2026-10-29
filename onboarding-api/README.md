# Properfy onboarding API

The backend for **properfy.co.uk/get-started**. The page itself is part of the website (GitHub Pages, built by `tools/build.js`). This small Cloudflare Worker does the parts a static website can't:

- saves each signed agreement as a PDF in a **private** Cloudflare R2 bucket, and keeps the record in a Cloudflare D1 database: signature, UTC timestamp, IP address, browser, agreement version, a fingerprint of the exact wording signed, consent choices and payment status
- emails the PDF to the client and to info@properfy.co.uk (through Resend)
- opens Stripe Checkout for card payments, and marks them paid only when a **verified Stripe webhook** arrives
- keeps bank transfers **pending** until Properfy confirms them
- emails info@properfy.co.uk each morning when a client's cooling-off period has ended, if they didn't ask for an early start

Nothing is publicly readable. Clients get their PDF by email. The download and confirm links in Properfy's emails are signed with `ADMIN_SECRET`.

## How a sign-up works

1. The client picks a transaction and gives their name, email and property postcode (England and Wales only). They read the agreement, tick to accept it, optionally tick to ask for an early start, and sign by drawing or typing.
2. The page sends this to the Worker, which checks it all again. The Worker then builds the PDF, stores it, records the signature details, and emails the PDF to the client and to Properfy.
3. **Card:** the client goes to Stripe Checkout. When Stripe sends `checkout.session.completed`, the Worker checks the webhook signature, the amount and the currency, marks the record paid and emails both sides.
4. **Bank transfer:** the client sees the Tide details, with their property postcode as the reference. Properfy's email has a "Mark the bank transfer as received" link. It opens a page with a button rather than confirming straight away, so email link scanners can't mark a payment as received.
5. The page shows the thank-you message.

**Start date.** The 14-day cooling-off period ends 14 days after the UK date the client signs. Without an early-start request, work may begin the day after; the record holds this as `services_may_start`.

## Addresses

| Address | What it does |
| --- | --- |
| `POST /api/onboarding` | Sign the agreement and choose how to pay |
| `GET /api/onboarding/:id?token=` | Status for the thank-you screen (needs the client's private token) |
| `POST /api/onboarding/:id/checkout` | Start or restart card payment |
| `POST /api/onboarding/:id/bank` | Switch to bank transfer |
| `POST /api/stripe/webhook` | Stripe events (signature checked) |
| `GET /admin/agreement?id=&sig=` | Download a signed PDF (signed link from Properfy's email) |
| `GET`, `POST /admin/confirm-bank?id=&sig=` | Mark a bank transfer as received |
| `GET /api/health` | Shows the Worker is running and which agreement version it has |

## Test it locally

```bash
npm install
npm test
```

This starts three things: the website, the Worker (with its own local database and storage), and stand-ins for Stripe and Resend. It then tests the API and, if Playwright is available, the page in a real browser on desktop and phone sizes. Nothing is sent to Stripe or Resend. If Playwright isn't installed here, point `PLAYWRIGHT_PATH` at it. Copies of the PDFs and screenshots are saved in `.wrangler/test-output` (or in `TEST_OUT`).

## Going live

You'll need three accounts:

- **Cloudflare:** the free plan is enough. R2 asks for a payment method, but this use fits in the free allowance.
- **Stripe**
- **Resend:** the free plan sends 3,000 emails a month.

1. **Agreement.** It's in `agreement.json` (version `2026-10-14.2`), complete with its cancellation form. See "Changing the agreement" below if it needs changes.
2. **Bank details.** `BANK_ACCOUNT_NAME` is in `wrangler.toml`; check it matches the Tide account name exactly. The sort code and account number are set as secrets in step 6, so they stay out of this public repository.
3. **Database and storage**, both kept in the EU:
   ```bash
   npx wrangler login
   npx wrangler d1 create properfy-onboarding --jurisdiction eu   # copy the database_id into wrangler.toml
   npx wrangler d1 execute properfy-onboarding --remote --file schema.sql
   npx wrangler r2 bucket create properfy-agreements --jurisdiction eu
   ```
   Keep the bucket private: don't turn on public access or connect a domain to it.
4. **Email.** In Resend, add the domain `properfy.co.uk`, then add the DNS records it shows you in GoDaddy (Domain → DNS). Its records go on their own sub-names, so the existing info@ mailbox keeps working.
5. **Deploy:** run `npx wrangler deploy`. It prints the Worker's address, for example `https://properfy-onboarding.<name>.workers.dev`. It won't take sign-ups until the next steps are done.
6. **Secrets.** These are stored by Cloudflare, never in this repo:
   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY      # sk_test_… first, sk_live_… when going live
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put ADMIN_SECRET           # a long random string, e.g. from: openssl rand -hex 32
   npx wrangler secret put BANK_SORT_CODE         # the Tide sort code
   npx wrangler secret put BANK_ACCOUNT_NUMBER    # the Tide account number
   ```
7. **Stripe webhook.**
   - In Stripe, go to Developers → Webhooks and add the endpoint `https://<worker address>/api/stripe/webhook`.
   - Choose the events `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
   - Save its signing secret with `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.
8. **Website.** Set `onboardingApi` in `assets/js/data.js` to the Worker address, run `node tools/build.js`, then commit and publish.
9. **Try it in test mode.** Pay with Stripe's test card `4242 4242 4242 4242`, then check both emails, the PDF and the bank-transfer confirm link. When it all works, switch to live mode:
   - Put the live secret key in `STRIPE_SECRET_KEY`.
   - Add the same webhook in live mode and save its new signing secret in `STRIPE_WEBHOOK_SECRET`.

Sign-ups stay closed until every secret and bank detail is set. The Worker logs what's missing.

## Day to day

- **Every sign-up** sends an email to info@properfy.co.uk. It has the PDF attached and shows the details, whether an early start was asked for and when work may begin. For bank transfers it also has the confirm link.
- **When a bank transfer arrives in Tide**, open the link in that email, check the details and press "Yes, mark as paid". The client is emailed.
- **Card payments** confirm themselves through Stripe.
- **Each morning** (07:00 UTC, which is 08:00 in summer), you get "You can now start work for N clients" if anyone's cooling-off period has ended.
- **To look up records:**
  ```bash
  npx wrangler d1 execute properfy-onboarding --remote --command "SELECT id, client_name, transaction_label, payment_status, services_may_start FROM onboardings ORDER BY created_at DESC LIMIT 20"
  ```
  Every step is also logged in the `events` table.
- **Keeping records.** Records and PDFs are kept until you delete them. Decide how long to keep them and say so in the privacy policy.

## Changing the agreement

Everything the client signs is in `agreement.json`:

- **Text:** `intro`, the numbered `sections`, `closing` and `appendix` (the cancellation form, which gets its own page in the PDF). Each is a list of blocks. A block is either a paragraph (plain text) or one of these:
  - `{ "h": … }`: a subheading
  - `{ "list": [ … ] }`: bullet points
  - `{ "table": [ … ] }`: a table whose first row is the header
- **Tick boxes:** `acceptConsent` and `earlyStartConsent`.
- **Amounts:** `fees` holds the amounts charged, in pence. The table in section 1 must show the same amounts; the website build stops if they differ.

When anything changes:

1. Give it a new `version`, for example `"2026-11-01"`. Every PDF records the version and a fingerprint of the exact text.
2. Rebuild the website from the repo root with `node tools/build.js`.
3. Run `npm test`.
4. Publish the website and run `npx wrangler deploy` together. A client who signs while one is newer than the other is asked to reload the page.

Only an agreement with `"status": "final"` and no blanks can be signed. A blank is anything in square brackets, such as `[registered office address]`. The page shows a notice and the Worker logs the blanks until they're filled in. Set the status to `"draft"` to close sign-ups while you work on a new version.

## Security

- **Storage.** The PDFs and signature images are in a private bucket. Each client's private status token is stored only as a hash. On the page, it is kept in the browser tab's session rather than in the address bar or history.
- **Stripe webhooks** must carry a valid signature less than 5 minutes old. Each event is handled once, and the amount and currency must match the initial payment.
- **Limits.** Only the website's own address can call the API from a browser (`SITE_ORIGIN`, plus `EXTRA_ORIGINS` for a test copy). Each email address can sign up 5 times an hour and each connection 10 times.
- **UK only.** Connections from outside the UK are refused, using the country Cloudflare reports for each visitor (`ALLOWED_COUNTRIES` in `wrangler.toml`). This covers office links too, so mark bank transfers as received from the UK. Stripe's webhook is the one exception: Stripe calls it from abroad, and every call is signature-checked.
- **Checks on every sign-up:** postcodes outside England and Wales are refused, and there is a hidden spam-trap field.
