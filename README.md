# Properfy

**Everything you need to move home. In one place.** Properfy is a property concierge for England and Wales. People tell us what they're trying to do, we call them, work out what they need and introduce the right professionals.

The site follows the **Properfy Website** design: a deep-navy Nocturne theme with neon accents, Inter type, Phosphor icons and the animated Properfy ↔ Property wordmark.

## Run it

The pages are plain HTML, so any static server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

It's deployed to GitHub Pages from `main` (custom domain in `CNAME`). `404.html` is picked up automatically.

## Editing content

Everything the site says is in **`assets/js/data.js`**: journeys and their steps, services, specialist transactions, Property Hub guides, checklists, the glossary, the quick-sale and repossession pages, and the settings. After editing it, rebuild the pages:

```bash
node tools/build.js
```

The builder (`tools/build.js`, no dependencies) writes every page, plus `sitemap.xml` and `robots.txt`. Each page is a folder with an `index.html` (e.g. `selling-a-property/index.html` is served at `/selling-a-property/`), so addresses have no `.html`. The builder also writes a small forwarding page at each old `.html` address, so earlier links keep working. Commit the regenerated files. Page layouts live in the builder; behaviour (the enquiry form, other forms, search, checklists, menus, the wordmark) is in `assets/js/site.js`.

## Pages

| Page | What it is |
| --- | --- |
| `/` | Home: "Where are you in your move?", quick-sale and repossession cards, the five journeys, services, how it works, specialist transactions and the Property Hub. |
| `/buying-a-property/`, `/selling-a-property/`, `/buying-and-selling/`, `/let-to-buy/`, `/transfer-of-equity/` | Step-by-step journeys. |
| `/conveyancing/`, `/mortgages/`, `/property-surveys/`, `/removals/`, `/moving-house/`, `/auction-conveyancing/`, `/transfer-of-equity-quote/`, `/new-build-conveyancing/`, `/shared-ownership-conveyancing/`, `/specialist-finance/` | Service pages, each with a quote form. |
| `/get-conveyancing-quote/`, `/mortgage-broker/`, `/property-survey/`, `/removal-quote/`, `/quick-house-sale/`, `/facing-repossession/` | Ad landing pages: copies of a main page that point search engines at it and mark enquiries as coming from an ad landing page. |
| `/sell-my-house-fast/` | Quick sale: options compared and a two-step form. Enquiries are marked high priority. |
| `/repossession-help/` | Where you are, what to do now, free advice and a confidential callback form. Court and eviction stages are marked urgent. |
| `/specialist-property-transactions/` | Routes for transactions that aren't straightforward. |
| `/property-hub/`, `/leasehold/`, `/exchange-and-completion/`, `/first-time-buyers/` | Property Hub with search and topics. `?q=` searches and `?cat=` picks a topic. |
| `/<topic>/<guide>/` | The 26 guides, for example `/conveyancing/how-long-does-conveyancing-take/`. |
| `/checklists/`, `/glossary/`, `/about/` | Checklists (ticks are saved in the browser; `#address` opens one directly), glossary and about. |
| `/privacy/`, `/complaints/`, `/partners/`, `404.html` (GitHub Pages shows it for any missing address) | Supporting pages. `/partners/` is the "Partner login" link: a register-interest form. |
| `/get-started/` | Client onboarding: choose a transaction, sign the Properfy Welcome & Payment Agreement and pay by card or bank transfer. Not in the menus or sitemap, and hidden from search engines: send clients the link. See below. |

## Leads

Every form is emailed to the inbox in `PFY.config.leadEndpoint` using FormSubmit (`https://formsubmit.co/ajax/<your email>`):

- **Tell us about my move** and **Request a callback** (the pop-up on every page)
- **Quote requests** on service pages
- **Quick sale** (subject starts "HIGH PRIORITY") and **repossession callbacks** (subject starts "URGENT" for court, possession order or eviction stages)
- **Checklist requests** and **partner enquiries**

Each email has a reference (e.g. `PFY-48213`, also shown to the customer), the page it was sent from, and how the person found the site (UTM source, medium and campaign, or the referring site) with the first page they saw. The customer's email address, when given, is the reply-to.

- The **first** submission after going live sends an "Activate Form" email to the inbox instead of the lead. Click it once (check Junk).
- Checklist requests also ask FormSubmit to email the checklist to the customer (its auto-response feature). Test this after activation.
- Set `leadEndpoint` to `null` for preview mode: nothing is sent and the site says so.
- Events are also pushed to `window.dataLayer`, ready for Google Tag Manager if you add it.

## Client onboarding (`/get-started/`)

One page where a client:

1. chooses Purchase (£595 initial payment), Sale, Remortgage or Transfer of Equity (£295 each)
2. gives their name, email and property postcode
3. reads and accepts the agreement, and can ask for work to begin during the 14-day cooling-off period
4. signs, by drawing or typing
5. pays by card (Stripe Checkout) or gets the Tide bank details, with the postcode as the reference

The page is built from `getStartedBody()` in the builder. Its behaviour is in `assets/js/get-started.js`. The agreement text and amounts come from **`onboarding-api/agreement.json`**, so the page and the signed PDF always match.

The page needs a server for payments, signed PDFs, emails and private storage, so those run in a small Cloudflare Worker in **`onboarding-api/`**. That folder's README covers how it works, how to test it (`npm test`) and how to set it up. Until `onboardingApi` is set in `data.js`, the page shows but can't be submitted.

## England and Wales only

- **Forms:** every form asks for a full postcode. Postcodes in Scotland, Northern Ireland, the Channel Islands and the Isle of Man are refused with a message saying why (TD12 and TD15 are in England and allowed). Phone numbers must be UK numbers. The areas are in `PFY.config.serviceArea`; the checks are `PF.checkPostcode` and `PF.validUkPhone` in `site.js`.
- **Limits:** these checks run in the visitor's browser. They stop genuine customers outside England and Wales from sending enquiries, but not a determined person or a bot posting straight to the form service, and not anyone calling or emailing the contact details in the footer.
- **Blocking visitors outright:** GitHub Pages can't block by location. To stop visitors outside the UK loading the site, put the domain behind Cloudflare (free plan) with a rule that blocks every country other than GB, exempting verified bots so search engines can still index the site.

## Before launch

- **Guide reviews.** The design shows "Reviewed by [Panel solicitor name]" on every guide. That line stays hidden until `PFY.config.reviewer` is set to a real reviewer. The About page says guides are reviewed by qualified professionals, so arrange that review.
- **Compliance.** Have the mortgage and specialist-finance wording, the introducer statement in the footer, the repossession page, `privacy.html` and `complaints.html` reviewed by a qualified adviser. Fill in the company details once Properfy Ltd is registered.
- **Figures** such as timescales, cash-buyer price ranges and lender rules of thumb are typical figures from the design. Confirm them with your partners.
- **Onboarding agreement.** `onboarding-api/agreement.json` holds the Properfy Welcome & Payment Agreement (version 2026-10-14) and its cancellation form. Have the agreement checked by a solicitor, then follow the steps in `onboarding-api/README.md`.

## Structure

```
<page>/index.html           generated pages (plus <page>.html forwarding pages)
sitemap.xml, robots.txt     generated
assets/
  css/site.css              Nocturne tokens and components, plus the site layer
  js/data.js                all content and settings
  js/site.js                behaviour and lead sending
  fonts/                    Inter and Sora (self-hosted)
  img/favicon.svg
  js/get-started.js         the onboarding page
tools/
  build.js                  page builder
  icons.js                  Phosphor icon paths used by the builder
onboarding-api/             backend for /get-started/ (Cloudflare Worker), with its own README
_config.yml                 keeps tools/, onboarding-api/ and this README off the website
```

## Credits

- **Inter** by the Inter Project Authors and **Sora** by the Sora Project Authors, both under the SIL Open Font License 1.1 (`assets/fonts/Inter-OFL.txt`, `assets/fonts/Sora-OFL.txt`).
- Icons from **Phosphor Icons**, MIT License (notice in `tools/icons.js`).
