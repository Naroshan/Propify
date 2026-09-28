# Properfy

**Property. Properly sorted.** A B2C property-services website: one place to buy, sell, finance, move and manage a home.

Launch services are **Conveyancing, Mortgages, Property Surveys, Property Auctions and Removals**. The site is built so a new service can be added from one data file.

The page layout follows the supplied **Solid State** template from HTML5 UP: angular section edges, alternating spotlight rows, feature cards, the overlay menu and the "get in touch" footer. On top of that it has its own brand, typography and product UI.

## Run it

It's a static site with no build step and no dependencies.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

You can deploy it to any static host (GitHub Pages, Netlify, Vercel, S3/CloudFront). `404.html` is picked up automatically by most hosts.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Homepage. The hero includes an interactive concierge that asks *"What are you doing with your property?"* and shows a tailored plan straight away. Below it are service spotlights, coming-soon services, how it works, guide pricing, reviews, FAQs and a jargon buster. |
| `start.html` | The guided flow. You pick a goal, answer only the questions relevant to it, review your plan (switch services on or off), enter your details with consent, and get a saved plan with "what happens next". It supports `?goal=buy`, `?service=survey` and `?view=plan`. |
| `service.html?s=<id>` | One template renders every service page: a plain-English explanation, what's included, the journey step by step, guide price, partner standards, FAQs and related services. A coming-soon id shows a "notify me" page, and no id shows the service directory. |
| `privacy.html`, `404.html` | Supporting pages. |

## Adding a service

Everything service-related comes from **`assets/js/registry.js`**:

1. Find the service in `SERVICES` (e.g. `insurance`) or add a new entry.
2. Set `status: 'live'` and fill in the detail fields. Copy `conveyancing` as a template, since every field is used somewhere on the site.
3. Add it to the relevant journeys in `recommend()` (and to `guidePrice()` if its price depends on the customer's answers).

The service then appears in the homepage spotlights and pricing table, the menu, the concierge shortcuts, customer plans, and on its own page. Section edges and alternating layouts adjust to however many services there are.

`GOALS` and `QUESTIONS` in the same file control the journey. Questions can use `showIf(answers)`, so customers only see the ones that are relevant to them.

## Brand: the f → t

The wordmark is a custom monoline SVG. Its **f** is built from four strokes that animate using `stroke-dashoffset`. When the f's hook and foot retract, the t's top and hook draw in, so **properfy becomes property**.

- **Hover or focus** on any `.logo` morphs f → t.
- **`.is-t`** holds the t state. The first-visit intro uses it to animate *property → properfy*.
- **`.morph-loop`** loops the morph. It's used as the loading indicator in the flow.
- **`PF.mark()`** renders the standalone app-icon mark (also used for `assets/img/favicon.svg`).

Motion respects `prefers-reduced-motion`.

## Going live: checklist

- **Leads.** Set `PF.config.leadEndpoint` in `registry.js`. Plans, enquiries and notify-me requests are then POSTed there as JSON (`{ type, payload, sentAt }`). Until it's set, the site runs in *preview mode*: data stays on the device and the UI says so honestly.
- **Contact details.** The email and phone are placeholders (`0808 157 0192` is an Ofcom drama number). Update them in `PF.config.contact` and in the footer and menu markup of each page.
- **Reviews.** The homepage reviews are illustrative and labelled as such (`PF.config.sampleReviews`). Replace them with verified reviews (e.g. a Trustpilot or Feefo feed) before launch, and don't publish sample reviews as real ones.
- **Guide prices and timescales** in `registry.js` are typical UK figures. Confirm them with your partners.
- **Partners.** Add real partner firms to each service's `partners` array (name and regulator). They're then listed on the service page.
- **Compliance.** Have mortgage and financial-promotion wording, the introducer statement in the footer and `privacy.html` reviewed by a qualified adviser. The mortgage risk warning is shown wherever mortgages are promoted.

## Structure

```
index.html  start.html  service.html  privacy.html  404.html
assets/
  css/main.css          design tokens, Solid State layout system, components
  js/icons.js           line icons + the f/t brand mark
  js/registry.js        services, goals, questions, recommendations, config
  js/main.js            header, menu, reveals, intro, preview cards, forms
  js/home.js            homepage rendering + concierge
  js/flow.js            guided flow
  js/service.js         service pages
  fonts/                Plus Jakarta Sans (self-hosted)
  img/favicon.svg
```

## Credits

- Layout based on **Solid State** by [HTML5 UP](https://html5up.net), used under [CCA 3.0](https://html5up.net/license). Attribution is kept in the footer and the source.
- **Plus Jakarta Sans** by the Plus Jakarta Sans Project Authors, licensed under the SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
