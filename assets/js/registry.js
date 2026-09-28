/*
  Properfy — registry
  ─────────────────────────────────────────────────────────────────────────────
  The single source of truth for services, customer goals, journey questions
  and recommendations. The homepage, the guided flow (start.html), the menu
  and every service page (service.html?s=<id>) are rendered from this file.

  To launch a new service:
    1. Find it in SERVICES (e.g. 'insurance') or add a new entry.
    2. Set status: 'live' and fill in the detail fields (copy 'conveyancing'
       as a template — every field there is used somewhere on the site).
    3. Add it to the relevant journeys in recommend() below.
  That's it — it appears on the homepage, in the menu, in plans and gets its
  own page automatically.

  Prices below are GUIDE figures for UK consumers, shown to set expectations.
  Review them with partners before launch.
*/
(function (w) {
  'use strict';

  var PF = (w.PF = w.PF || {});

  /* ── Config ─────────────────────────────────────────────────────────────── */

  PF.config = {
    brand: 'Properfy',
    // Where plans and enquiries are POSTed as JSON. Leave null to run in
    // preview mode (data stays on the device and a notice is shown).
    leadEndpoint: null,
    storageKey: 'properfy.plan.v1',
    notifyKey: 'properfy.notify.v1',
    // Reviews on the homepage are illustrative until real, verified reviews
    // are connected. Keep this true until then.
    sampleReviews: true,
    contact: {
      email: 'hello@properfy.co.uk',
      phone: '0808 157 0192',
      phoneHref: '+448081570192',
      hours: 'Mon–Fri 8am–8pm · Sat 9am–5pm'
    }
  };

  /* ── Services ───────────────────────────────────────────────────────────── */

  var SERVICES = [
    {
      id: 'conveyancing',
      status: 'live',
      name: 'Conveyancing',
      icon: 'conveyancing',
      tagline: 'Legal work, handled.',
      noun: 'conveyancing',
      whatIs: 'What is conveyancing?',
      short: 'The legal side of buying or selling',
      blurb: 'Buying or selling a property? Get your legal work handled by a specialist conveyancing team.',
      cta: 'Get a conveyancing quote',
      plain:
        'Conveyancing is the legal work that moves a property from one owner to another. Your conveyancer checks the paperwork, runs the searches, handles the money and registers the new owner with HM Land Registry.',
      price: {
        label: 'From £850 + VAT',
        long: 'Guide legal fee from £850 + VAT',
        note: 'Your legal fee is fixed and quoted upfront. Searches and Land Registry fees are listed separately, at cost — no mark-ups.'
      },
      duration: '12–20 weeks',
      credential: 'SRA or CLC regulated',
      steps: [
        { title: 'Tell us about the move', text: 'Buying, selling or both, the price, and whether it’s freehold or leasehold. Two minutes.', time: 'Today' },
        { title: 'Compare fixed-fee quotes', text: 'Quotes from regulated conveyancers with every fee itemised. No hidden extras.', time: 'Within 1 working day' },
        { title: 'Instruct and track', text: 'ID checks, searches and enquiries — with progress updates as things happen, not when you chase.', time: 'Weeks 1–10' },
        { title: 'Exchange and complete', text: 'Contracts exchange, money moves and the property is legally yours.', time: 'Typically 12–20 weeks' }
      ],
      included: [
        'Fixed legal fee, agreed before you start',
        'Searches ordered and reviewed for you',
        'Enquiries raised and chased',
        'Registration with HM Land Registry',
        'A named case handler'
      ],
      excluded: [
        'Stamp Duty Land Tax (paid to HMRC)',
        'Search and Land Registry fees (charged at cost)',
        'Leasehold management pack fees, where applicable'
      ],
      standards: [
        'Regulated by the SRA or the CLC',
        'Professional indemnity insurance in place',
        'Itemised, fixed-fee quotes',
        'A named person handling your case'
      ],
      faqs: [
        { q: 'How long does conveyancing take?', a: 'Most purchases take 12–20 weeks from offer to completion. Chains, leasehold properties and slow searches add time — which is why instructing early helps.' },
        { q: 'Solicitor or licensed conveyancer — what’s the difference?', a: 'Both are qualified and regulated to handle property transactions. Solicitors are regulated by the SRA; licensed conveyancers specialise in property and are regulated by the CLC.' },
        { q: 'What are disbursements?', a: 'Costs your conveyancer pays to third parties for you, like search fees and Land Registry fees. We show them separately so you can see exactly where your money goes.' }
      ],
      next: 'You’ll get fixed-fee quotes by email, usually within 1 working day.',
      related: ['survey', 'mortgage', 'removals'],
      partners: [],
      preview: {
        title: 'Your conveyancing',
        meta: 'Purchase · Leasehold flat',
        chip: 'On track',
        progress: 0.46,
        rows: [
          { state: 'done', label: 'Quote accepted', value: '£1,150 + VAT' },
          { state: 'done', label: 'ID & source of funds' },
          { state: 'active', label: 'Searches ordered', value: '~10 days' },
          { state: 'todo', label: 'Exchange of contracts' },
          { state: 'todo', label: 'Completion' }
        ],
        foot: 'Named case handler · Updates as they happen'
      }
    },

    {
      id: 'mortgage',
      status: 'live',
      name: 'Mortgages',
      single: 'Mortgage',
      icon: 'mortgage',
      tagline: 'The right mortgage, explained.',
      noun: 'a mortgage',
      whatIs: 'What does a mortgage adviser do?',
      short: 'Advice for buying, remortgaging or investing',
      blurb: 'Buying, remortgaging or investing? Connect with a mortgage adviser to explore your options.',
      cta: 'Explore mortgage options',
      plain:
        'A mortgage adviser (sometimes called a broker) compares lenders for you, explains your options in plain English and handles the application. Advisers can often reach deals and lenders you can’t go to directly.',
      price: {
        label: 'Free to get started',
        long: 'Free to get started',
        note: 'Many advisers are paid by the lender. If a broker fee applies, you’ll see it in writing before you commit.'
      },
      duration: 'Offer in 2–4 weeks',
      credential: 'FCA-authorised advisers',
      risk: 'Your home may be repossessed if you do not keep up repayments on your mortgage.',
      steps: [
        { title: 'Share a few details', text: 'What you’re buying or remortgaging, your income and deposit. It won’t affect your credit score.', time: 'Today' },
        { title: 'Talk to an adviser', text: 'A qualified adviser compares lenders and explains the options — no jargon, no pressure.', time: 'Usually within 1 working day' },
        { title: 'Agreement in principle', text: 'Show sellers and agents you’re ready to buy, with a lender’s estimate of what you can borrow.', time: 'Often within 24 hours' },
        { title: 'Apply and get your offer', text: 'Your adviser handles the application and chases the lender for you.', time: 'Typically 2–4 weeks' }
      ],
      included: [
        'A search across lenders (you’ll be told if it’s whole of market)',
        'Help getting an agreement in principle',
        'Your application handled end to end',
        'Clear illustrations of every cost'
      ],
      excluded: [
        'Lender arrangement fees (shown in your illustration)',
        'Valuation fees some lenders charge'
      ],
      standards: [
        'Authorised and regulated by the FCA',
        'Qualified advisers (CeMAP or equivalent)',
        'Any fee disclosed in writing upfront',
        'Clear on whole of market vs. panel'
      ],
      faqs: [
        { q: 'Will this affect my credit score?', a: 'Sharing your details with Properfy doesn’t. An agreement in principle usually uses a soft search that other lenders can’t see. A full application uses a hard search — your adviser will tell you before that happens.' },
        { q: 'Do I have to pay for mortgage advice?', a: 'Many advisers are paid a commission by the lender, and some also charge a fee. Either way, you’ll see any fee in writing before you go ahead.' },
        { q: 'When should I remortgage?', a: 'Most lenders let you secure a new deal up to six months before your current one ends, so you don’t slip onto a higher standard variable rate.' }
      ],
      next: 'An FCA-authorised adviser will be in touch to talk through your options, usually within 1 working day.',
      related: ['conveyancing', 'survey', 'auctions'],
      partners: [],
      preview: {
        title: 'Your mortgage',
        meta: 'First-time buyer · 10% deposit',
        chip: 'Adviser matched',
        rows: [
          { state: 'done', label: 'Details shared', value: 'No credit impact' },
          { state: 'done', label: 'Adviser call booked', value: 'Tue 10:30' },
          { state: 'active', label: 'Agreement in principle', value: 'Today' },
          { state: 'todo', label: 'Full application' },
          { state: 'todo', label: 'Mortgage offer' }
        ],
        foot: 'FCA-authorised · Fees shown before you commit'
      }
    },

    {
      id: 'survey',
      status: 'live',
      name: 'Property Surveys',
      single: 'Survey',
      icon: 'survey',
      tagline: 'Know what you’re buying.',
      noun: 'a survey',
      whatIs: 'What is a property survey?',
      short: 'An independent check of the property’s condition',
      blurb: 'Know exactly what you’re buying before you commit.',
      cta: 'Arrange a survey',
      plain:
        'A survey is an independent inspection of a property’s condition. It flags problems — damp, movement, roof issues — before you’re legally committed, so you can renegotiate, plan repairs or walk away.',
      price: {
        label: 'Level 2 from £450',
        long: 'Level 2 surveys from £450',
        note: 'Guide prices depend on the property’s value, size and location. You’ll get a fixed quote before anything is booked.'
      },
      duration: 'Report in 5–7 days',
      credential: 'RICS-regulated surveyors',
      levels: [
        { name: 'Level 1', title: 'Condition report', fit: 'Newer, conventional homes in good condition.', price: 'From £350' },
        { name: 'Level 2', title: 'HomeBuyer report', fit: 'Most conventional homes. The one most buyers choose.', price: 'From £450', pick: true },
        { name: 'Level 3', title: 'Building survey', fit: 'Older, larger, unusual or altered homes — or major works planned.', price: 'From £700' }
      ],
      steps: [
        { title: 'Tell us about the property', text: 'Its age, type and price. We’ll recommend the right survey level — and explain why.', time: 'Today' },
        { title: 'Choose your surveyor', text: 'Fixed quotes from RICS-regulated surveyors, with inspection dates.', time: 'Within 1 working day' },
        { title: 'Inspection', text: 'The surveyor visits. The seller’s agent arranges access — you don’t need to be there.', time: 'Usually within 1–2 weeks' },
        { title: 'Your report', text: 'Clear traffic-light ratings, plus a call with the surveyor to talk it through.', time: '5–7 days after inspection' }
      ],
      included: [
        'A recommendation on which survey level you need',
        'Fixed quote before booking',
        'Inspection arranged with the agent',
        'A follow-up call with your surveyor'
      ],
      excluded: [
        'Specialist reports (e.g. structural engineer, drainage CCTV) if recommended',
        'Your lender’s mortgage valuation'
      ],
      standards: [
        'RICS-regulated firms and surveyors',
        'Professional indemnity insurance in place',
        'Reports to the RICS Home Survey Standard',
        'Local knowledge of your area'
      ],
      faqs: [
        { q: 'Isn’t the mortgage valuation enough?', a: 'No. A lender’s valuation is for the lender — it checks the property is worth the loan. It won’t tell you about damp, the roof or structural issues.' },
        { q: 'Which survey level do I need?', a: 'Level 2 suits most conventional homes. Choose Level 3 for older, larger or altered properties, or if you’re planning major work. We’ll recommend one based on what you tell us.' },
        { q: 'What if the survey finds problems?', a: 'Get quotes to fix them, renegotiate the price, ask the seller to do the work — or walk away before exchange. It’s far cheaper to find out now.' }
      ],
      next: 'We’ll recommend the right survey level and send fixed quotes from RICS-regulated surveyors.',
      related: ['conveyancing', 'mortgage', 'removals'],
      partners: [],
      preview: {
        title: 'Which survey?',
        meta: 'Victorian terrace · £340k',
        rows: [
          { state: 'todo', label: 'Level 1 · Condition', value: 'From £350' },
          { state: 'todo', label: 'Level 2 · HomeBuyer', value: 'From £450' },
          { state: 'pick', label: 'Level 3 · Building', badge: 'Best fit', value: 'From £700' }
        ],
        foot: 'Older home? A Level 3 looks deeper — here’s why.'
      }
    },

    {
      id: 'auctions',
      status: 'live',
      name: 'Property Auctions',
      single: 'Auction',
      icon: 'auctions',
      tagline: 'Auctions, without the guesswork.',
      noun: 'auction support',
      whatIs: 'How do property auctions work?',
      short: 'Specialist support for buying or selling at auction',
      blurb: 'Buying or selling through auction? Get the specialist support you need.',
      cta: 'Explore auction services',
      plain:
        'Auctions are fast. At a traditional auction, contracts exchange when the hammer falls and completion usually follows within 28 days. Preparation — legal pack, finance, survey — is everything.',
      price: {
        label: 'Fees shown upfront',
        long: 'Every fee shown upfront',
        note: 'Auction houses charge buyers’ fees and sellers’ entry fees that vary. You’ll see every fee before you commit — no surprises on the day.'
      },
      duration: 'Complete in 28–56 days',
      credential: 'Established auction partners',
      steps: [
        { title: 'Buying or selling?', text: 'Tell us which, and whether it’s a traditional or modern-method auction.', time: 'Today' },
        { title: 'Get prepared', text: 'Buyers: legal pack reviewed and finance lined up. Sellers: appraisal and legal pack ready to market.', time: 'Before auction day' },
        { title: 'Auction day', text: 'Bid in the room, by phone or online — with a clear limit and no surprises.', time: 'Auction day' },
        { title: 'Complete', text: 'Traditional auctions usually complete within 28 days; modern-method auctions often within 56.', time: '28–56 days' }
      ],
      included: [
        'Legal pack review by a regulated conveyancer',
        'Finance options lined up before you bid',
        'Appraisal and listing support for sellers',
        'Every auction fee shown in advance'
      ],
      excluded: [
        'Buyer’s premium or admin fee (set by the auction house)',
        'Deposit due on exchange (often 10%)'
      ],
      standards: [
        'Established, reputable auction houses',
        'Legal packs reviewed by regulated conveyancers',
        'Fees disclosed before you register to bid',
        'Clear terms on reservation fees'
      ],
      faqs: [
        { q: 'Traditional vs. modern method — what’s the difference?', a: 'At a traditional auction, contracts exchange when the hammer falls and completion follows within about 28 days. The modern method of auction usually involves a non-refundable reservation fee and a longer window to complete — often 56 days.' },
        { q: 'Do I need a survey for an auction property?', a: 'It’s strongly recommended. Once the hammer falls you’re committed, so arrange any survey before auction day.' },
        { q: 'Can I get a mortgage for an auction property?', a: 'Often, yes — but timescales are tight. Some buyers use short-term bridging finance and refinance later. Speak to an adviser before you bid.' }
      ],
      next: 'An auction specialist will be in touch to talk through timings, fees and the legal pack.',
      related: ['conveyancing', 'mortgage', 'survey'],
      partners: [],
      preview: {
        title: 'Lot 27 · Auction',
        meta: 'Two-bed flat · Traditional auction',
        countdown: true,
        rows: [
          { state: 'done', label: 'Legal pack reviewed', value: 'No red flags' },
          { state: 'done', label: 'Finance ready', value: 'In principle' },
          { state: 'active', label: 'Bidding limit set', value: '£182,000' }
        ],
        foot: 'Every fee shown before you register to bid'
      }
    },

    {
      id: 'removals',
      status: 'live',
      name: 'Removals',
      single: 'Removals',
      icon: 'removals',
      tagline: 'Moving day, organised.',
      noun: 'removals',
      whatIs: 'What does a removals firm do?',
      short: 'Packing, moving and everything in between',
      blurb: 'From packing to moving day, organise your move in one place.',
      cta: 'Get a removals quote',
      plain:
        'A removals firm packs, loads, transports and unloads your belongings. The most accurate quotes come from a quick survey of what you own — in person or by video — so there are no surprises on the day.',
      price: {
        label: 'From £400',
        long: '£600–£1,200 for a typical 2–3 bed local move',
        note: 'Depends on volume, distance, access and packing. Quotes are fixed — no hourly surprises.'
      },
      duration: 'Book 2–4 weeks ahead',
      credential: 'BAR members, fully insured',
      steps: [
        { title: 'Tell us what’s moving', text: 'Home size, dates, and anything bulky or fragile.', time: 'Today' },
        { title: 'Quick video survey', text: 'Removers see what you own, so your quote is accurate.', time: 'Within a few days' },
        { title: 'Compare fixed quotes', text: 'Add packing, dismantling or storage — all priced upfront.', time: 'Within 2–3 working days' },
        { title: 'Moving day', text: 'Your crew arrives on time, with everything insured in transit.', time: 'Completion day' }
      ],
      included: [
        'Fixed quotes based on a proper survey',
        'Goods-in-transit insurance',
        'Optional packing, dismantling and storage',
        'Help moving your date if completion changes'
      ],
      excluded: [
        'Parking permits or suspensions, if needed',
        'Specialist items (e.g. pianos, safes) unless quoted'
      ],
      standards: [
        'Members of the British Association of Removers (BAR)',
        'Goods-in-transit and public liability insurance',
        'Written, fixed quotes',
        'Clear date-change policy'
      ],
      faqs: [
        { q: 'What if my completion date changes?', a: 'It happens a lot. Tell us as early as possible and we’ll work with your remover to move the date — check their date-change policy when you book.' },
        { q: 'Should I pay for packing?', a: 'If you’re short on time, it’s worth it. Professional packing is faster and your things are usually better protected under the remover’s insurance.' },
        { q: 'How far ahead should I book?', a: 'Two to four weeks is typical. Fridays and the end of the month are busiest, so book those as early as you can.' }
      ],
      next: 'Removers will arrange a quick video survey so your fixed quote is accurate.',
      related: ['conveyancing', 'survey', 'mortgage'],
      partners: [],
      preview: {
        title: 'Moving day',
        meta: '{moveDate}',
        chip: 'Booked',
        rows: [
          { state: 'done', label: 'Fixed quote', value: '£780' },
          { state: 'done', label: 'Packing service added', value: '+£220' },
          { state: 'active', label: 'Linked to completion', value: 'Auto-adjusts' },
          { state: 'todo', label: 'Crew arrives', value: '8:00am' }
        ],
        foot: 'Completion moves? We’ll help move your date.'
      }
    },

    /* ── Coming soon ── set status: 'live' and add detail fields to launch ── */
    { id: 'insurance', status: 'soon', name: 'Home insurance', icon: 'insurance', short: 'Buildings and contents cover, ready for exchange day.' },
    { id: 'utilities', status: 'soon', name: 'Utilities & broadband', icon: 'utilities', short: 'Energy, water, council tax and broadband — switched in one go.' },
    { id: 'valuations', status: 'soon', name: 'Valuations', icon: 'valuations', short: 'Know what your home is worth, from a qualified valuer.' },
    { id: 'epc', status: 'soon', name: 'EPCs', icon: 'epc', short: 'The Energy Performance Certificate you need before you market your home.' },
    { id: 'brokers', status: 'soon', name: 'Specialist brokers', icon: 'brokers', short: 'Protection, commercial and specialist finance brokers.' },
    { id: 'bridging', status: 'soon', name: 'Bridging finance', icon: 'bridging', short: 'Short-term finance for auctions, chains and renovations.' },
    { id: 'improvements', status: 'soon', name: 'Home improvements', icon: 'improvements', short: 'Kitchens, extensions and energy upgrades, properly managed.' },
    { id: 'storage', status: 'soon', name: 'Storage', icon: 'storage', short: 'Secure short or long-term storage between homes.' },
    { id: 'cleaning', status: 'soon', name: 'Cleaning', icon: 'cleaning', short: 'End-of-tenancy and move-in cleans, booked around your move.' },
    { id: 'trades', status: 'soon', name: 'Tradespeople', icon: 'trades', short: 'Vetted electricians, plumbers and builders.' }
  ];

  /* ── Goals: what the customer is trying to do ───────────────────────────── */

  var GOALS = [
    { id: 'buy', label: 'Buy a property', short: 'Buying a property', icon: 'pin', hint: 'Finance, legal work, survey and the move' },
    { id: 'sell', label: 'Sell a property', short: 'Selling a property', icon: 'tag', hint: 'Legal work, auction options and the move' },
    { id: 'move', label: 'Move home', short: 'Moving home', icon: 'move', hint: 'Selling, buying or renting — organised' },
    { id: 'remortgage', label: 'Remortgage', short: 'Remortgaging', icon: 'refresh', hint: 'A better deal before yours ends' },
    { id: 'invest', label: 'Invest', short: 'Investing in property', icon: 'trend', hint: 'Buy-to-let, auctions and refurbs' },
    { id: 'other', label: 'I need something else', short: 'Something else', icon: 'chat', hint: 'Tell us — we’ll point you the right way' }
  ];

  /* ── Questions: asked progressively, only when relevant ─────────────────── */

  var PRICE = [
    { value: 'u250', label: 'Under £250k' },
    { value: '250-500', label: '£250k–£500k' },
    { value: '500-1m', label: '£500k–£1m' },
    { value: '1m+', label: 'Over £1m' },
    { value: 'unsure', label: 'Not sure yet' }
  ];

  var FINANCE = [
    { value: 'yes', label: 'Yes' },
    { value: 'cash', label: 'No, I’m buying outright' },
    { value: 'unsure', label: 'Not sure yet', hint: 'That’s what advisers are for' }
  ];

  var QUESTIONS = {
    buy: [
      {
        id: 'stage', title: 'Where are you up to?', help: 'So we can sort things in the right order.',
        options: [
          { value: 'looking', label: 'Just starting to look', hint: 'Haven’t found a place yet' },
          { value: 'found', label: 'Found somewhere I like', hint: 'About to make an offer' },
          { value: 'accepted', label: 'My offer’s been accepted', hint: 'Time to get moving' }
        ]
      },
      {
        id: 'first', title: 'Is this your first home?', help: 'First-time buyers can access specific lenders and schemes.', layout: 'cols-2',
        options: [{ value: 'yes', label: 'Yes, first home' }, { value: 'no', label: 'No, I’ve bought before' }]
      },
      { id: 'finance', title: 'Will you need a mortgage?', help: 'It’s fine if you’re not sure yet.', options: FINANCE },
      { id: 'price', title: 'Roughly what price are you looking at?', help: 'A ballpark is fine — it helps us estimate fees.', layout: 'cols-2', options: PRICE },
      {
        id: 'auction', title: 'Is it being sold at auction?', help: 'Auctions move fast and need extra preparation.', layout: 'cols-3',
        showIf: function (a) { return a.stage && a.stage !== 'looking'; },
        options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }, { value: 'unsure', label: 'Not sure' }]
      }
    ],
    sell: [
      {
        id: 'stage', title: 'Where are you up to?', help: 'So we can sort things in the right order.',
        options: [
          { value: 'thinking', label: 'Thinking about selling' },
          { value: 'listed', label: 'It’s on the market' },
          { value: 'agreed', label: 'Sale agreed', hint: 'I’ve accepted an offer' }
        ]
      },
      {
        id: 'method', title: 'How would you like to sell?', help: 'Auction trades a longer marketing period for speed and certainty.',
        showIf: function (a) { return a.stage !== 'agreed'; },
        options: [
          { value: 'agent', label: 'With an estate agent' },
          { value: 'auction', label: 'At auction', hint: 'Fixed timescale, fast completion' },
          { value: 'unsure', label: 'Not sure yet' }
        ]
      },
      {
        id: 'alsoBuying', title: 'Are you buying another home too?', layout: 'cols-2',
        options: [{ value: 'yes', label: 'Yes, I’m buying too' }, { value: 'no', label: 'No, just selling' }]
      },
      { id: 'price', title: 'Roughly what’s it worth?', help: 'A ballpark is fine — it helps us estimate fees.', layout: 'cols-2', options: PRICE }
    ],
    move: [
      {
        id: 'type', title: 'Which best describes your move?',
        options: [
          { value: 'sellbuy', label: 'Selling and buying', hint: 'From one home I own to another' },
          { value: 'buy', label: 'Buying, not selling', hint: 'e.g. I’m renting at the moment' },
          { value: 'rent', label: 'Renting to renting', hint: 'No buying or selling involved' }
        ]
      },
      {
        id: 'when', title: 'When do you need to move?', layout: 'cols-2',
        options: [
          { value: '1m', label: 'Within a month' },
          { value: '3m', label: 'In 1–3 months' },
          { value: '6m', label: 'In 3–6 months' },
          { value: 'unsure', label: 'Not sure yet' }
        ]
      },
      {
        id: 'size', title: 'How big is the home you’re moving from?', help: 'So we can estimate your removals.',
        options: [{ value: 's', label: 'Studio or 1 bedroom' }, { value: 'm', label: '2–3 bedrooms' }, { value: 'l', label: '4+ bedrooms' }]
      },
      {
        id: 'finance', title: 'Will you need a mortgage for the new place?', help: 'It’s fine if you’re not sure yet.',
        showIf: function (a) { return a.type !== 'rent'; }, options: FINANCE
      },
      {
        id: 'price', title: 'Roughly what price is the new place?', help: 'A ballpark is fine — it helps us estimate fees.', layout: 'cols-2',
        showIf: function (a) { return a.type !== 'rent'; }, options: PRICE
      }
    ],
    remortgage: [
      {
        id: 'ends', title: 'When does your current deal end?', help: 'You can usually lock in a new rate up to six months ahead.', layout: 'cols-2',
        options: [
          { value: '3m', label: 'Within 3 months' },
          { value: '6m', label: 'In 3–6 months' },
          { value: 'later', label: 'More than 6 months away' },
          { value: 'ended', label: 'It’s already ended' }
        ]
      },
      {
        id: 'change', title: 'Is anything changing?',
        options: [
          { value: 'rate', label: 'No — I just want a better rate' },
          { value: 'borrow', label: 'I want to borrow more', hint: 'e.g. for home improvements' },
          { value: 'names', label: 'Adding or removing a name', hint: 'Known as a transfer of equity' }
        ]
      },
      {
        id: 'balance', title: 'Roughly how much is left to pay?', layout: 'cols-2',
        options: [
          { value: 'u150', label: 'Under £150k' },
          { value: '150-300', label: '£150k–£300k' },
          { value: '300-500', label: '£300k–£500k' },
          { value: '500+', label: 'Over £500k' }
        ]
      }
    ],
    invest: [
      {
        id: 'strategy', title: 'What’s the plan?',
        options: [
          { value: 'btl', label: 'Buy to let', hint: 'Long-term rental income' },
          { value: 'auction', label: 'Buy at auction', hint: 'Find value, move fast' },
          { value: 'flip', label: 'Refurbish and sell', hint: 'Add value, then sell on' },
          { value: 'unsure', label: 'Still exploring' }
        ]
      },
      {
        id: 'structure', title: 'Buying personally or through a company?', help: 'It changes which lenders and legal checks you’ll need.',
        options: [
          { value: 'personal', label: 'Personally' },
          { value: 'ltd', label: 'Through a limited company' },
          { value: 'unsure', label: 'Not sure yet' }
        ]
      },
      {
        id: 'experience', title: 'Have you invested in property before?',
        options: [
          { value: 'first', label: 'This is my first' },
          { value: 'some', label: 'I have one or two' },
          { value: 'portfolio', label: 'I have a portfolio' }
        ]
      }
    ],
    other: [
      {
        id: 'need', type: 'multi', title: 'What can we help with?', help: 'Pick as many as you like.',
        options: function () {
          return PF.liveServices().map(function (s) {
            return { value: s.id, label: s.name, hint: s.short, icon: s.icon };
          });
        }
      },
      {
        id: 'note', type: 'text', optional: true, title: 'Anything else we should know?',
        help: 'Optional — a sentence or two is plenty.',
        placeholder: 'e.g. I need an EPC before I can list my flat'
      }
    ]
  };

  /* ── Recommendations ────────────────────────────────────────────────────── */

  function item(id, when, why, optional) {
    return { id: id, when: when, why: why, optional: !!optional };
  }

  // Returns { items: [{id, when, why, optional}], soon: [ids] }, in journey order.
  function recommend(goal, a) {
    a = a || {};
    var items = [];
    var soon = [];
    var mortgageNeeded = a.finance !== 'cash';

    switch (goal) {
      case 'buy':
        if (mortgageNeeded) {
          items.push(item('mortgage',
            a.stage === 'accepted' ? 'Now — your lender needs time' : 'Now — before you make offers',
            a.finance === 'unsure'
              ? 'Find out what you could borrow. Free to start, and it won’t affect your credit score.'
              : a.first === 'yes'
                ? 'First home? An adviser can find first-time buyer lenders and schemes.'
                : 'An agreement in principle makes your offer stronger.'));
        }
        if (a.auction === 'yes' || a.auction === 'unsure') {
          items.push(item('auctions', 'Before auction day',
            a.auction === 'yes'
              ? 'Auctions move fast. Get the legal pack reviewed before you bid.'
              : 'If it’s at auction, you’ll need to be ready before the hammer falls.',
            a.auction !== 'yes'));
        }
        items.push(item('conveyancing',
          a.stage === 'accepted' ? 'Now' : 'When your offer’s accepted',
          a.stage === 'accepted'
            ? 'Your offer’s accepted — instruct a conveyancer now so nothing stalls.'
            : 'Line one up early and you can move the moment your offer’s accepted.'));
        items.push(item('survey', 'Straight after your offer',
          'Find problems before you’re committed — and renegotiate if you need to.'));
        items.push(item('removals', 'Once you have a completion date',
          'Book early for the best crews — dates can move if completion does.'));
        soon = ['insurance', 'utilities'];
        break;

      case 'sell':
        items.push(item('conveyancing',
          a.stage === 'agreed' ? 'Now' : 'Now — before you accept an offer',
          'Starting the legal work early is the best way to avoid delays later.'));
        if (!a.method || a.method === 'auction' || a.method === 'unsure') {
          items.push(item('auctions', a.method === 'auction' ? 'Before you list' : 'If you want speed and certainty',
            a.method === 'auction'
              ? 'Sell on a fixed timescale — traditional auctions usually complete within 28 days.'
              : 'Want a guaranteed timescale? Auction could suit you.',
            a.method !== 'auction'));
        }
        if (a.alsoBuying === 'yes') {
          items.push(item('mortgage', 'Now', 'Buying too? Know what you can borrow before you accept an offer.'));
          items.push(item('survey', 'When your purchase offer’s accepted', 'For the home you’re buying — know its condition before you commit.'));
        }
        items.push(item('removals', 'Once you have a completion date', 'One crew, one date, booked around completion.'));
        soon = ['epc', 'valuations'];
        break;

      case 'move':
        if (a.type === 'rent') {
          items.push(item('removals', a.when === '1m' ? 'Now — good crews book up' : 'A few weeks before you move',
            'Fixed quotes, with packing and storage if you need them.'));
          soon = ['cleaning', 'utilities', 'storage'];
          break;
        }
        if (mortgageNeeded) {
          items.push(item('mortgage', 'Now', a.type === 'sellbuy'
            ? 'Moving your mortgage or getting a new one — an adviser will compare both.'
            : 'Know what you can borrow before you make an offer.'));
        }
        items.push(item('conveyancing', a.type === 'sellbuy' ? 'As soon as you’re on the market' : 'When your offer’s accepted',
          a.type === 'sellbuy'
            ? 'One firm for your sale and purchase keeps the chain moving.'
            : 'Line one up early so you can move the moment your offer’s accepted.'));
        items.push(item('survey', 'After your offer’s accepted', 'Know the condition of your new home before you commit.'));
        items.push(item('removals', a.when === '1m' ? 'Now — good crews book up' : 'Once you have a completion date',
          'Fixed quotes, and help moving your date if completion changes.'));
        soon = ['utilities', 'insurance', 'cleaning'];
        break;

      case 'remortgage':
        items.push(item('mortgage',
          a.ends === 'ended' ? 'Now' : a.ends === 'later' ? 'Around 6 months before your deal ends' : 'Now',
          a.ends === 'ended'
            ? 'You’re likely on your lender’s standard rate — switching could lower your payments.'
            : a.ends === 'later'
              ? 'We’ll be ready when you are — most deals can be secured six months ahead.'
              : 'Your deal ends soon — lock in a new rate before it does.'));
        if (a.change === 'names') {
          items.push(item('conveyancing', 'Alongside your remortgage',
            'Changing whose name is on the mortgage needs a transfer of equity — a conveyancer handles it.'));
        } else {
          items.push(item('conveyancing', 'If your lender needs it',
            'Switching lender? Many include free legal work. If not, we’ll get you a fixed-fee quote.', true));
        }
        soon = ['valuations', 'insurance'];
        break;

      case 'invest':
        items.push(item('mortgage', 'Now',
          a.structure === 'ltd'
            ? 'Buying through a limited company needs specialist lenders — an adviser will find them.'
            : 'Buy-to-let mortgages work differently. A specialist adviser will compare the market.'));
        if (a.strategy !== 'btl') {
          items.push(item('auctions', 'Before auction day',
            'Auctions are where many investors find value — prepare properly before you bid.',
            a.strategy !== 'auction'));
        }
        items.push(item('survey', 'Before you commit',
          a.strategy === 'flip'
            ? 'Know what the works will really cost before you buy.'
            : 'Protect your investment — know its condition first.'));
        items.push(item('conveyancing', 'When your offer’s accepted',
          a.structure === 'ltd'
            ? 'Company purchases have extra checks — use a conveyancer who handles them daily.'
            : 'Investment purchases have extra checks — use a conveyancer who does them daily.'));
        soon = a.strategy === 'flip' ? ['bridging', 'trades', 'improvements'] : ['bridging', 'insurance'];
        break;

      default: // 'other'
        var picked = a.need && a.need.length ? a.need : null;
        PF.liveServices().forEach(function (s) {
          if (picked && picked.indexOf(s.id) === -1) return;
          items.push(item(s.id, 'Whenever you’re ready', s.blurb, !picked));
        });
        soon = PF.soonServices().map(function (s) { return s.id; });
    }

    return { items: items, soon: soon };
  }

  /* ── Guide prices, tailored to answers ──────────────────────────────────── */

  function guidePrice(id, goal, a) {
    a = a || {};
    var s = PF.service(id);
    switch (id) {
      case 'conveyancing':
        if (goal === 'remortgage') return a.change === 'names' ? 'From £450 + VAT' : 'Often free via lender';
        if ((goal === 'move' && a.type === 'sellbuy') || (goal === 'sell' && a.alsoBuying === 'yes')) return 'From £1,600 + VAT';
        return { '250-500': 'From £950 + VAT', '500-1m': 'From £1,200 + VAT', '1m+': 'From £1,800 + VAT' }[a.price] || s.price.label;
      case 'survey':
        return { '500-1m': 'From £600', '1m+': 'From £900' }[a.price] || s.price.label;
      case 'removals':
        return { s: '£300–£600', m: '£600–£1,200', l: '£1,200–£2,500' }[a.size] || s.price.label;
      default:
        return s ? s.price.label : '';
    }
  }

  /* ── Accessors ──────────────────────────────────────────────────────────── */

  PF.services = SERVICES;
  PF.goals = GOALS;
  PF.questions = QUESTIONS;
  PF.recommend = recommend;
  PF.guidePrice = guidePrice;

  PF.service = function (id) {
    for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].id === id) return SERVICES[i];
    return null;
  };
  PF.goal = function (id) {
    for (var i = 0; i < GOALS.length; i++) if (GOALS[i].id === id) return GOALS[i];
    return null;
  };
  PF.liveServices = function () {
    return SERVICES.filter(function (s) { return s.status === 'live'; });
  };
  PF.soonServices = function () {
    return SERVICES.filter(function (s) { return s.status === 'soon'; });
  };
  PF.questionsFor = function (goal, answers) {
    return (QUESTIONS[goal] || []).filter(function (q) {
      return !q.showIf || q.showIf(answers || {});
    });
  };
})(window);
