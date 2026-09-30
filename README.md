# Properfy

**Property. Properly sorted.** One place to buy, sell, remortgage, transfer or auction a home in England and Wales. Customers keep the people they already use, or Properfy introduces trusted ones, and every step is tracked in order.

The design is the **Properfy Platform** ("Nocturne"): a dark, calm interface with a single violet accent, Inter type and Phosphor icons.

## Run it

It's a static site with no build step and no dependencies.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

It's deployed to GitHub Pages from `main` (custom domain in `CNAME`). `404.html` is picked up automatically.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Homepage. Pick what you're doing (buying, selling, remortgaging, transfer of equity, auction) to see its steps, then start. Also shows an example tracker, the four services, how it works and the partner call to action. |
| `start.html` | Onboarding in four steps: what you're doing, the property (address, postcode and price), who's already helping you (keep your own agent, broker or solicitor, or ask for an introduction), and your details with consent. `?journey=buy` (or `sell`, `remo`, `toe`, `auc`) skips to step 2. |
| `move.html` | "My move": the customer's tracker. It shows each step, who handles it and an "Arrange … with Properfy" button where Properfy can help, plus the team, updates and the move reference. It's saved on the customer's device. |
| `partners.html` | For estate agents, brokers and solicitors: a preview of the partner portal (sample data) and a register-interest form. |
| `privacy.html`, `complaints.html`, `404.html` | Supporting pages. Privacy and complaints are drafts. |

## Editing content

Journeys, their steps, the partner roles and the service cards are in **`assets/js/data.js`**:

- `PF.journeys`: each journey's label, icon, the wording on the property step, and its steps. Each step has a title (`t`), a description (`d`), a typical timescale, who owns it (`you`, `agent`, `broker` or `solicitor`) and, optionally, the `service` Properfy can arrange for it.
- `PF.roles`: the three roles a customer can keep or ask to be introduced.
- `PF.services`: the service cards.
- `PF.config`: the lead inbox, contact details and service area.

The homepage's first view of the **Buying** steps is written into `index.html` so it shows before scripts run. If you change the buying steps in `data.js`, update that list too.

The shared header and footer are repeated in each page. Change them in every page.

## Leads

New moves, "Arrange … with Properfy" requests and partner enquiries are emailed to the inbox in `PF.config.leadEndpoint` using FormSubmit (`https://formsubmit.co/ajax/<your email>`).

- The **first** submission after going live sends an "Activate Form" email to that inbox instead of the lead. Click it once (check Junk). After that every lead arrives as a formatted email, with the customer's email address as the reply-to.
- Each move has a reference (e.g. `PRF-7K2QXD`) that appears in the email and on the customer's tracker.
- Set `leadEndpoint` to `null` for preview mode: nothing is sent and the site says so.

## England and Wales only

Properfy only serves homes in England and Wales.

- **Forms:** onboarding and the partner form require a full postcode. Postcodes in Scotland, Northern Ireland, the Channel Islands and the Isle of Man are refused with a message saying why (TD12 and TD15 are in England and allowed). Phone numbers must be UK numbers. The areas are in `PF.config.serviceArea` in `data.js`; the checks are `PF.checkPostcode` and `PF.validUkPhone` in `core.js`.
- **Limits:** these checks run in the visitor's browser. They stop genuine customers outside England and Wales from sending enquiries, but not a determined person or a bot posting straight to the form service, and not anyone calling or emailing the contact details on the site.
- **Blocking visitors outright:** GitHub Pages can't block by location. To stop visitors outside the UK loading the site at all, put the domain behind Cloudflare (free plan) with a rule that blocks every country other than GB, exempting verified bots so search engines can still index the site. IP location can't reliably separate England and Wales from Scotland or Northern Ireland, so the postcode check stays the England-and-Wales gate.

## Before launch

- **What's built and what isn't.** The site collects moves and requests by email. The customer's tracker is saved on their own device only. It isn't shared with their agent, broker or solicitor, and it doesn't update by itself. The homepage copy "Four services. One login." and the shared-tracker wording describe the full platform, so build that or soften the copy before promoting it. The partner portal is a static preview with sample data.
- **Compliance.** Have the mortgage wording, the introducer statement and repossession warning in the footer, `privacy.html` and `complaints.html` reviewed by a qualified adviser. Fill in the company details once Properfy Ltd is registered.
- **Timescales** on each step are typical figures. Confirm them with your partners.

## Structure

```
index.html  start.html  move.html  partners.html
privacy.html  complaints.html  404.html
assets/
  css/site.css      Nocturne design tokens, components and page layouts
  js/icons.js       Phosphor icons as inline SVG (PF.icon)
  js/data.js        config, journeys, roles and services
  js/core.js        helpers, postcode and phone checks, lead emails, nav
  js/home.js        homepage journey picker
  js/start.js       onboarding
  js/move.js        "My move" tracker
  js/partners.js    partner enquiry form
  fonts/            Inter (self-hosted)
  img/favicon.svg
```

## Credits

- **Inter** by Rasmus Andersson, licensed under the SIL Open Font License 1.1 (`assets/fonts/Inter-OFL.txt`).
- Icons from **Phosphor Icons**, licensed under the MIT License (notice in `assets/js/icons.js`).
