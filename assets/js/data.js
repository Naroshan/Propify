/*
  Properfy — content and settings
  Journeys, steps, services and roles come from the Properfy platform
  design. Edit them here and every page that shows them updates.
*/
(function (w) {
  'use strict';

  var PF = (w.PF = w.PF || {});

  /* ── Settings ─────────────────────────────────────────────────────────── */

  PF.config = {
    // New moves, "arrange" requests and partner enquiries are emailed here by
    // FormSubmit (formsubmit.co). The very first submission sends an
    // "Activate Form" email instead: click it once and everything after
    // arrives. Set to null for preview mode (nothing is sent; the site says so).
    leadEndpoint: 'https://formsubmit.co/ajax/Mr.w.davey@hotmail.com',
    storageKey: 'properfy.move.v2',
    contact: {
      email: 'Mr.w.davey@hotmail.com',
      phone: '07746 448080',
      phoneHref: '+447746448080'
    },
    // Properfy only serves England and Wales. Postcodes in these areas are
    // refused (see PF.checkPostcode in core.js).
    serviceArea: {
      name: 'England and Wales',
      outside: {
        'Scotland': ['AB', 'DD', 'DG', 'EH', 'FK', 'G', 'HS', 'IV', 'KA', 'KW', 'KY', 'ML', 'PA', 'PH', 'TD', 'ZE'],
        'Northern Ireland': ['BT'],
        'the Channel Islands': ['GY', 'JE'],
        'the Isle of Man': ['IM']
      },
      // TD (Scottish Borders) districts that include English addresses,
      // e.g. Berwick-upon-Tweed and Cornhill-on-Tweed.
      allowDistricts: ['TD12', 'TD15']
    }
  };

  /* ── The people around a move ─────────────────────────────────────────── */

  PF.roles = {
    agent: { label: 'Estate agent', short: 'agent', icon: 'storefront', why: 'Handles viewings, offers and the sale.' },
    broker: { label: 'Mortgage broker', short: 'broker', icon: 'bank', why: 'Finds the right mortgage for you.' },
    solicitor: { label: 'Solicitor', short: 'solicitor', icon: 'scales', why: 'Does the legal work and moves the money.' }
  };

  /* ── Journeys ─────────────────────────────────────────────────────────── */

  PF.journeyKeys = ['buy', 'sell', 'remo', 'toe', 'auc'];

  PF.journeys = {
    buy: {
      label: 'Buying', icon: 'house-line', blurb: 'From mortgage in principle to getting the keys.',
      addr: 'Address of the home you’re buying', price: 'Agreed or asking price (£)', place: 'property',
      steps: [
        { t: 'Get a mortgage in principle', d: 'A quick check of how much a lender is likely to lend you. Agents take your offer more seriously with one.', time: '1 day', owner: 'broker', service: 'Mortgage' },
        { t: 'View homes', d: 'Book viewings with the agent. Take photos and ask about the bills, the neighbours and why they’re selling.', time: 'Your pace', owner: 'agent' },
        { t: 'Make an offer', d: 'Once it’s accepted, the agent tells everyone involved and the home should come off the market.', time: '1–3 days', owner: 'agent' },
        { t: 'Instruct a solicitor', d: 'They do the legal checks and move the money safely. This is also called conveyancing.', time: '8–12 weeks', owner: 'solicitor', service: 'Conveyancing' },
        { t: 'Get a survey', d: 'An expert checks the condition of the home, so you know about problems before you commit.', time: '1–2 weeks', owner: 'you', service: 'Survey' },
        { t: 'Renegotiate if needed', d: 'If the survey finds issues, you can ask for a lower price or for repairs. We’ll help you word it.', time: 'If needed', owner: 'agent' },
        { t: 'Exchange contracts', d: 'The deal becomes legally binding and you pay your deposit. The moving date is now fixed.', time: '1 day', owner: 'solicitor' },
        { t: 'Complete and get the keys', d: 'The money moves, the home is yours, and the agent hands over the keys.', time: 'Moving day', owner: 'solicitor' }
      ]
    },
    sell: {
      label: 'Selling', icon: 'sign-out', blurb: 'From valuation to handing over the keys.',
      addr: 'Address of the home you’re selling', price: 'Rough value (£)', place: 'property',
      steps: [
        { t: 'Get valuations', d: 'Agents visit and suggest a price. Getting two or three gives you a fair picture.', time: '1 week', owner: 'agent' },
        { t: 'Choose your agent and go live', d: 'Photos, floor plan and listing. Compare fees and contract length before you sign.', time: '1–2 weeks', owner: 'you' },
        { t: 'Instruct a solicitor early', d: 'Getting your paperwork ready now can save weeks once a buyer is found.', time: 'Same week', owner: 'you', service: 'Conveyancing' },
        { t: 'Accept an offer', d: 'The agent checks the buyer can afford it and shares the details with everyone.', time: 'Varies', owner: 'agent' },
        { t: 'Answer the buyer’s questions', d: 'The buyer’s solicitor will ask about the home. Yours will help you reply.', time: '3–6 weeks', owner: 'solicitor' },
        { t: 'Exchange contracts', d: 'The sale is now legally binding and the moving date is fixed.', time: '1 day', owner: 'solicitor' },
        { t: 'Complete', d: 'The money arrives, your mortgage is paid off and you hand over the keys.', time: 'Moving day', owner: 'solicitor' }
      ]
    },
    remo: {
      label: 'Remortgage', icon: 'arrows-clockwise', blurb: 'Switch to a better deal before yours ends.',
      addr: 'Address of your home', price: 'Roughly what’s left on your mortgage (£)', place: 'property',
      steps: [
        { t: 'Check when your deal ends', d: 'Start around six months before, so you don’t roll onto your lender’s higher standard rate.', time: '5 minutes', owner: 'you' },
        { t: 'Compare deals with a broker', d: 'A broker searches across lenders and explains the costs in plain numbers.', time: '1–3 days', owner: 'broker', service: 'Mortgage' },
        { t: 'Apply and get a valuation', d: 'The new lender checks your home’s value, often without anyone needing to visit.', time: '1–2 weeks', owner: 'broker' },
        { t: 'Receive your mortgage offer', d: 'The formal offer, usually valid for about six months.', time: '1–2 weeks', owner: 'broker' },
        { t: 'Legal work', d: 'A solicitor pays off the old lender and registers the new one. Often free with the deal.', time: '2–4 weeks', owner: 'solicitor', service: 'Conveyancing' },
        { t: 'Switch day', d: 'Your new deal starts. Nothing changes except your monthly payment.', time: '1 day', owner: 'solicitor' }
      ]
    },
    toe: {
      label: 'Transfer of equity', icon: 'users-three', blurb: 'Add or remove someone from the ownership.',
      addr: 'Address of the home', price: 'Rough value (£)', place: 'property',
      steps: [
        { t: 'Agree the change', d: 'Decide who’s being added or removed and whether any money is changing hands.', time: 'Your pace', owner: 'you' },
        { t: 'Get your lender’s agreement', d: 'If there’s a mortgage, the lender must approve. A broker can find a new deal if needed.', time: '1–3 weeks', owner: 'broker', service: 'Mortgage' },
        { t: 'Instruct a solicitor', d: 'They prepare the paperwork and check whether stamp duty applies.', time: '4–8 weeks', owner: 'you', service: 'Conveyancing' },
        { t: 'Sign the transfer deed', d: 'Everyone signs, with a witness. Your solicitor tells you exactly where.', time: '1 day', owner: 'solicitor' },
        { t: 'Land Registry update', d: 'The official record is updated with the new owners.', time: '2–6 weeks', owner: 'solicitor' }
      ]
    },
    auc: {
      label: 'Auction', icon: 'gavel', blurb: 'Buy or sell under the hammer, done safely.',
      addr: 'Address of the auction lot', price: 'Guide price (£)', place: 'lot',
      steps: [
        { t: 'Read the legal pack', d: 'Have a solicitor review it before auction day. Surprises here are hard to undo.', time: '2–5 days', owner: 'solicitor', service: 'Conveyancing' },
        { t: 'Line up your money', d: 'You’ll usually need to complete within 28 days, so arrange your mortgage or bridging loan first.', time: '1–3 weeks', owner: 'broker', service: 'Mortgage' },
        { t: 'Survey before you bid', d: 'Once the hammer falls you can’t renegotiate, so check the condition first.', time: '1 week', owner: 'you', service: 'Survey' },
        { t: 'Auction day', d: 'When the hammer falls, you’ve exchanged contracts. You pay a 10% deposit on the day.', time: '1 day', owner: 'you' },
        { t: 'Complete', d: 'Usually within 28 days. The balance is paid and the keys are yours.', time: '28 days', owner: 'solicitor' }
      ]
    }
  };

  /* ── Services ─────────────────────────────────────────────────────────── */

  PF.services = [
    { icon: 'bank', title: 'Mortgages', body: 'Mortgage in principle, purchase, remortgage and bridging, from an adviser who compares the market.', meta: 'Buying · Remortgage · Auction · Transfer' },
    { icon: 'scales', title: 'Conveyancing', body: 'Regulated solicitors with fixed quotes and updates posted straight to your tracker.', meta: 'All journeys' },
    { icon: 'magnifying-glass', title: 'Surveys', body: 'Level 1 to 3 surveys, with the findings explained. If they turn up problems, we help you renegotiate.', meta: 'Buying · Auction' },
    { icon: 'gavel', title: 'Auctions', body: 'Legal pack review, finance lined up in time and a plan for completing within 28 days.', meta: 'Buying or selling at auction' }
  ];
})(window);
