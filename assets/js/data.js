/*
  Properfy — content and settings
  Everything the site says lives here: journeys, services, guides,
  checklists, the glossary, the quick-sale and repossession pages, and the
  settings for leads and the England and Wales limit. After editing, run
  `node tools/build.js` to regenerate the pages.
*/
window.PFY = {
svc: {
  conveyancing: { label: "Conveyancing", icon: "ph ph-scales", slug: "conveyancing" },
  mortgages: { label: "Mortgages", icon: "ph ph-bank", slug: "mortgages" },
  surveys: { label: "Surveys", icon: "ph ph-magnifying-glass", slug: "property-surveys" },
  removals: { label: "Removals", icon: "ph ph-truck", slug: "removals" },
  moving: { label: "Utilities, insurance & more", icon: "ph ph-plug", slug: "moving-house" },
  auction: { label: "Auctions", icon: "ph ph-gavel", slug: "auction-conveyancing" },
  toe: { label: "Transfer of equity", icon: "ph ph-users-three", slug: "transfer-of-equity-quote" },
  newbuild: { label: "New builds", icon: "ph ph-crane", slug: "new-build-conveyancing" },
  so: { label: "Shared ownership", icon: "ph ph-chart-pie-slice", slug: "shared-ownership-conveyancing" },
  finance: { label: "Specialist finance", icon: "ph ph-coins", slug: "specialist-finance" }
},
aliases: { "get-conveyancing-quote": "conveyancing", "mortgage-broker": "mortgages", "property-survey": "surveys", "removal-quote": "removals" },

situations: [
  { id: "buy", label: "I want to buy a home", journey: "buy", cta: "Get help buying a property", steps: ["Work out what you can afford", "Get a mortgage in principle", "Start viewing homes", "Make an offer", "Have a solicitor ready for when it’s accepted"] },
  { id: "offer", label: "My offer’s been accepted", journey: "buy", cta: "Need help with your next steps?", steps: ["Instruct your solicitor", "Confirm your mortgage", "Arrange your survey", "Searches begin", "Enquiries begin", "Work towards exchange"] },
  { id: "both", label: "I’m selling and buying", journey: "buysell", cta: "Tell us about my move", steps: ["Get your home valued", "Instruct a solicitor early for your sale", "Get a mortgage in principle for your next home", "Agree your sale and your purchase", "Line both up to exchange together", "Plan the move, with storage as a backup"] },
  { id: "exchanged", label: "I’ve exchanged contracts", journey: "buy", cta: "Get ready for completion", steps: ["Confirm completion arrangements", "Arrange removals", "Organise utilities", "Arrange insurance", "Prepare for moving day"] },
  { id: "moving", label: "I’m moving next month", journey: "buy", cta: "Get a removal quote", steps: ["Book removals now", "Tell people you’re moving", "Set up broadband early", "Plan packing and any storage", "Take meter readings on the day"] },
  { id: "unsure", label: "I’m not sure what happens next", journey: null, cta: "Tell us about my move", steps: ["Tell us what you’re trying to do", "We call you at a time that suits", "We explain your next steps in plain English", "We introduce the right professional if you need one"] }
],

journeys: {
  buy: { slug: "buying-a-property", icon: "ph ph-house-line", title: "Buying a property", h1: "Buying a property, step by step", blurb: "From working out what you can afford to getting the keys.", intro: "Every stage of buying a home in England and Wales, in the order it usually happens. Each step tells you what’s going on, what to think about and where we can help.", cta: "Get help buying a property", doing: "Buying", guides: ["offer-accepted", "how-buying-works", "buying-costs", "conv-time", "survey", "exchange", "completion"],
    stages: [
      { t: "Work out what you can afford", h: "Look at your deposit, income and outgoings, and the costs on top of the price.", k: ["Your deposit: many lenders need at least 5–10%", "Stamp Duty, legal fees, survey and removals", "Your monthly budget after you’ve moved"], s: ["mortgages"] },
      { t: "Get a mortgage in principle", h: "A lender gives an early indication of how much it may lend you. It isn’t a guaranteed mortgage.", k: ["Agents often ask for one before you offer", "Many lenders use a soft credit check, but ask first", "Have payslips and bank statements ready"], s: ["mortgages"] },
      { t: "Find a property", h: "View homes and ask the questions that matter before you fall in love with one.", k: ["Ask about the chain and why they’re selling", "For flats, ask how long is left on the lease", "Note anything a survey should look at"], s: ["surveys"] },
      { t: "Make an offer", h: "You offer through the estate agent, who’ll ask about your position: mortgage, deposit and whether you have a home to sell.", k: ["In England and Wales an accepted offer isn’t legally binding until exchange", "Be clear about your chain", "Agree what’s included, such as fixtures and fittings"], s: ["conveyancing"] },
      { t: "Offer accepted: instruct a solicitor", h: "Your solicitor or conveyancer handles the legal work: checks, searches, the contract and moving the money safely.", k: ["Ask for a full quote including disbursements", "Expect ID and source-of-funds checks", "Reply quickly: it’s the easiest way to avoid delays"], s: ["conveyancing", "mortgages", "surveys"], next: ["Instruct your solicitor", "Confirm your mortgage", "Arrange your survey", "Searches begin", "Enquiries begin", "Work towards exchange"], nextCta: "Need help with your next steps?" },
      { t: "Searches", h: "Your solicitor orders checks on the property and area, usually local authority, drainage and water, and environmental searches.", k: ["Some councils take longer than others", "Extra searches may be needed depending on location"], s: ["conveyancing"] },
      { t: "Survey", h: "An independent surveyor checks the condition of the home. This is different from your lender’s valuation.", k: ["Level 2 suits most homes in reasonable condition", "Level 3 for older, larger or altered homes", "Book early so results arrive well before exchange"], s: ["surveys"] },
      { t: "Mortgage application and valuation", h: "You make your full application. The lender values the property and, if all is well, issues a mortgage offer.", k: ["Avoid taking on new credit", "Check how long the offer lasts", "If the valuation is low, talk to your broker"], s: ["mortgages"] },
      { t: "Enquiries and report on title", h: "Your solicitor asks the seller’s solicitor questions, then reports back on what they’ve found.", k: ["Read your report on title carefully", "Ask about anything you don’t understand", "Leasehold information can take longer"], s: ["conveyancing"] },
      { t: "Exchange of contracts", h: "Signed contracts are swapped, your deposit is paid and the completion date is fixed. The deal is now legally binding.", k: ["Buildings insurance usually needs to start from exchange", "Have deposit funds ready in good time", "Confirm the date works for the whole chain"], s: ["conveyancing", "removals", "moving"], next: ["Confirm completion arrangements", "Arrange removals", "Organise utilities", "Arrange insurance", "Prepare for moving day"], nextCta: "Get ready for completion" },
      { t: "Completion and keys", h: "The money moves between solicitors. Once it arrives, the agent releases the keys.", k: ["Keys can arrive late morning to afternoon", "Plan removals with some flexibility", "Take meter readings and photos"], s: ["removals"] },
      { t: "Moving in", h: "Get the essentials sorted: utilities, broadband, insurance and telling people your new address.", k: ["Redirect your post", "Register for council tax", "Update your bank, employer, GP and DVLA"], s: ["moving"] }
    ] },
  sell: { slug: "selling-a-property", icon: "ph ph-sign-out", title: "Selling a property", h1: "Selling a property, step by step", blurb: "From deciding to sell to handing over the keys.", intro: "What happens when you sell a home in England and Wales, and how to keep your sale moving.", cta: "Get help selling my property", doing: "Selling", guides: ["how-sell", "offer-binding", "sell-mortgage", "conv-time", "chain", "completion"],
    stages: [
      { t: "Deciding to sell", h: "Think about timing, where you’re moving to and what you still owe on your mortgage.", k: ["Are you buying another home at the same time?", "Check for early repayment charges", "Think about your ideal moving date"], s: ["mortgages"] },
      { t: "Valuation and choosing an agent", h: "Estate agents visit and suggest an asking price. Two or three valuations give you a fair picture.", k: ["Compare fees and what’s included", "Check the contract length and notice period", "Be wary of a valuation far above the rest"], s: [] },
      { t: "Preparing your property and EPC", h: "You’ll need an Energy Performance Certificate before marketing. Then it’s photos, a floor plan and listing.", k: ["Gather guarantees, planning and building regs paperwork", "Small repairs and a clean help photos", "Book your EPC early"], s: ["moving"] },
      { t: "Find a solicitor early", h: "Instructing a solicitor before you have a buyer lets them prepare your forms and documents in advance.", k: ["You’ll fill in property information forms", "If leasehold, order the management pack early", "It can save weeks once a buyer is found"], s: ["conveyancing"] },
      { t: "Receiving and accepting offers", h: "The agent passes on offers and checks each buyer’s position.", k: ["Is the buyer chain-free or mortgage-ready?", "An accepted offer isn’t binding until exchange", "Watch out for gazundering near exchange"], s: [] },
      { t: "Sale agreed and conveyancing", h: "The agent sends a memorandum of sale. Your solicitor sends the draft contract to the buyer’s solicitor.", k: ["Reply to your solicitor quickly", "Keep the agent in the loop"], s: ["conveyancing"] },
      { t: "Answering enquiries", h: "The buyer’s solicitor asks questions about the property. Your solicitor helps you answer them.", k: ["Answer fully and honestly", "Missing paperwork is a common delay"], s: ["conveyancing"] },
      { t: "Mortgage redemption", h: "Your solicitor gets a redemption statement from your lender so the mortgage can be paid off on completion.", k: ["Check for early repayment charges", "Ask whether you can port your deal to your next home"], s: ["mortgages"] },
      { t: "Managing the chain", h: "Everyone in the chain needs to be ready before anyone can exchange.", k: ["Ask the agent where each link stands", "One slow link can hold up everyone"], s: ["conveyancing"] },
      { t: "Exchange of contracts", h: "Contracts are swapped and the completion date is fixed. The sale is now legally binding.", k: ["Book removals once the date is set", "Start packing and plan meter readings"], s: ["removals"], next: ["Confirm completion arrangements", "Arrange removals", "Organise utilities", "Prepare for moving day"], nextCta: "Get ready for completion" },
      { t: "Completion", h: "The buyer’s money arrives, your mortgage is paid off and the balance is sent to you. You hand over the keys.", k: ["Leave keys with the agent", "Your money usually arrives the same day"], s: ["removals"] },
      { t: "Moving out", h: "Take final meter readings, leave the property as agreed and tell people you’ve moved.", k: ["Leave manuals and spare keys", "Redirect your post"], s: ["moving"] }
    ] },
  buysell: { slug: "buying-and-selling", icon: "ph ph-arrows-left-right", title: "Buying and selling", h1: "Buying and selling at the same time", blurb: "Two transactions, one move. How to keep both on track.", intro: "Many movers sell one home and buy another on the same day. Here’s how the two sides fit together and where they usually get stuck.", cta: "Tell us about my move", doing: "Buying & selling", guides: ["chain", "dates-mismatch", "conv-time", "sell-mortgage", "exchange"],
    stages: [
      { t: "Sell first or buy first?", h: "Most people agree their sale before offering, which makes them a stronger buyer.", k: ["Sellers prefer buyers with a sale agreed", "Know what you can spend using your equity"], s: ["mortgages"] },
      { t: "Value your home and check your budget", h: "Combine your likely equity with a mortgage in principle to see what you can buy.", k: ["Include costs on both sides", "Allow for early repayment charges"], s: ["mortgages"] },
      { t: "Use one solicitor for both sides", h: "Having the same firm handle your sale and purchase can make coordinating them simpler.", k: ["Instruct them as early as you can", "Ask how they manage linked transactions"], s: ["conveyancing"] },
      { t: "Agree your sale and your purchase", h: "Once both are agreed you’re part of a chain: your buyer, you and your seller all depend on each other.", k: ["Find out how long the chain is", "Share realistic timings early"], s: [] },
      { t: "Mortgage timing", h: "You may port your current mortgage or take a new one. Either way, the offer has to line up with your dates.", k: ["Check how long your offer is valid", "Talk to a broker about porting versus a new deal"], s: ["mortgages"] },
      { t: "Moving your deposit", h: "The deposit for your purchase often comes from your sale, moved by your solicitor at exchange.", k: ["Confirm this with your solicitor early", "Some sellers ask for a set percentage"], s: ["conveyancing"] },
      { t: "Exchange both together", h: "Your sale and purchase normally exchange at the same moment, so you’re never committed to one without the other.", k: ["Every link in the chain must be ready", "Agree one completion date for all"], s: ["conveyancing"] },
      { t: "Completion day", h: "Your buyer’s money arrives, your mortgage is paid off and your purchase money is sent on, usually all on the same day.", k: ["Keys often arrive in the afternoon", "Plan your removal around both properties"], s: ["removals"] },
      { t: "If dates don’t line up", h: "Delays happen. Storage, temporary accommodation or bridging finance can cover the gap.", k: ["Get storage quotes as a backup", "Bridging is specialist: take advice"], s: ["moving", "finance"] },
      { t: "Removals and moving", h: "One-day moves need careful planning, especially with keys arriving late.", k: ["Book removers who handle chain moves", "Pack an essentials box"], s: ["removals"] }
    ] },
  ltb: { slug: "let-to-buy", icon: "ph ph-key", title: "Let to buy", h1: "Let to buy, step by step", blurb: "Keep your current home as a rental and buy your next one.", intro: "Let to buy means remortgaging your current home onto a buy-to-let mortgage, often releasing equity for a deposit, and then buying a new home to live in. Here’s how it fits together.", cta: "Get help with let to buy", doing: "Let to buy", guides: ["remortgage", "borrow", "broker", "buying-costs", "chain"],
    stages: [
      { t: "Is let to buy right for you?", h: "It suits people who want to keep their home as an investment, or can’t sell at the price they want. You become a landlord, with the responsibilities that come with it.", k: ["Could you cover two mortgages if the property were empty?", "Are you ready for landlord duties and costs?", "Think about your long-term plans for both homes"], s: ["mortgages"] },
      { t: "Check you can let your current home", h: "You’ll need your current lender’s permission to let, or to move to a buy-to-let mortgage. Leasehold flats may also need the freeholder’s consent.", k: ["Check for early repayment charges on your current deal", "Read your lease for any restrictions on letting", "Check whether your insurance needs to change"], s: ["mortgages", "conveyancing"] },
      { t: "Work out the rent and your equity", h: "Buy-to-let lenders base what they’ll lend on the expected rent, not your salary. Get a rental valuation from a letting agent.", k: ["Lenders often want rent to cover the mortgage by 125–145%", "Most lenders want at least 25% equity left in the property", "Work out how much equity you could release for your deposit"], s: ["mortgages"] },
      { t: "Remortgage to buy-to-let", h: "A broker finds a buy-to-let deal for your current home. Any equity released can go towards the deposit on your next home.", k: ["Rates and fees are usually higher than residential", "Your current home is valued again", "Timing matters: line it up with your purchase"], s: ["mortgages"] },
      { t: "Arrange your new residential mortgage", h: "At the same time, you apply for a mortgage on the home you’ll live in. The lender will count your buy-to-let mortgage in your affordability.", k: ["Get a mortgage in principle early", "Use one broker for both mortgages to keep them in step", "Have proof of the expected rental income ready"], s: ["mortgages"] },
      { t: "Stamp Duty and tax", h: "Because you’ll own two homes, you’ll usually pay the higher rates of Stamp Duty on your new home. Rental income is taxable too.", k: ["Higher-rate Stamp Duty usually applies on the purchase", "Capital Gains Tax may apply when you sell the rental later", "Speak to a tax adviser before committing"], s: ["conveyancing"] },
      { t: "Find and buy your new home", h: "From here it’s a normal purchase: offer, solicitor, searches, survey and exchange.", k: ["Your remortgage and purchase need to complete close together", "Tell your solicitor it’s a let-to-buy purchase"], s: ["conveyancing", "surveys"], next: ["Instruct your solicitor", "Confirm both mortgages", "Arrange your survey", "Searches and enquiries", "Work towards exchange"], nextCta: "Need help with your next steps?" },
      { t: "Get the rental ready", h: "Before tenants move in you’ll need safety certificates, a valid EPC, landlord insurance and a deposit protection scheme.", k: ["Gas safety certificate and electrical safety report", "An EPC rating of at least E", "Choose between self-managing or a letting agent"], s: ["moving"] },
      { t: "Exchange, complete and move", h: "You complete on your new home and move in. Your old home is now a rental, ready for tenants.", k: ["Take meter readings at both properties", "Set up landlord insurance from the day you move out", "Redirect your post and update your address"], s: ["removals", "moving"] }
    ] },
  toe: { slug: "transfer-of-equity", icon: "ph ph-users-three", title: "Transfer of equity", h1: "Transfer of equity, explained", blurb: "Adding or removing someone from the ownership of your home.", intro: "A transfer of equity changes who legally owns a property without selling it. Here’s how it works and what to check.", cta: "Get a transfer of equity quote", doing: "Transfer of equity", guides: ["sol-vs-conv", "conv-cost"],
    stages: [
      { t: "What transfer of equity means", h: "It changes the names on the legal title. Someone is added, removed, or ownership shares change.", k: ["The property isn’t sold", "The Land Registry record is updated at the end"], s: [] },
      { t: "Adding someone", h: "Common when a partner moves in or you want to share ownership with family.", k: ["Your lender must agree", "They may need to join the mortgage too"], s: ["mortgages"] },
      { t: "Removing someone", h: "Often part of a separation. The person staying usually needs to show they can afford the mortgage alone.", k: ["The lender decides whether to release them", "You may need a new mortgage"], s: ["mortgages"] },
      { t: "Family transfers", h: "Gifting a share to a child or relative can have tax consequences.", k: ["Get tax advice before you start", "Everyone should understand what they’re agreeing to"], s: ["conveyancing"] },
      { t: "Mortgage implications", h: "If there’s a mortgage, the lender has to approve the change. Sometimes a remortgage is the simplest route.", k: ["Talk to a broker early", "Check for early repayment charges"], s: ["mortgages"] },
      { t: "Stamp Duty considerations", h: "Stamp Duty can be due if someone takes on part of the mortgage or pays money. Some situations, such as certain separations, can be exempt.", k: ["Your solicitor will check this", "Rules differ in Scotland and Wales"], s: ["conveyancing"] },
      { t: "Legal work and ID", h: "Your solicitor prepares the transfer deed and checks ID for everyone involved.", k: ["Everyone on the deed needs ID checks", "Some people may need independent legal advice"], s: ["conveyancing"] },
      { t: "Land Registry", h: "Once signed, your solicitor registers the change and the title shows the new owners.", k: ["Registration can take several weeks", "You’ll get a copy of the updated title"], s: ["conveyancing"] }
    ] }
},

services: {
  conveyancing: { key: "conveyancing", slug: "conveyancing", h1: "Get a conveyancing quote", kicker: "Conveyancing", intro: "Tell us about your property and we’ll help you find the right conveyancing option for your transaction.", cta: "Get my quote", doing: "Buying",
    included: ["Introductions to conveyancing firms on our panel", "Quotes that show fees and disbursements separately", "Options for purchases, sales, remortgages and transfers", "Specialists for leasehold, new build, shared ownership and auctions", "Plain-English help from offer to completion"],
    explain: [
      { t: "What is conveyancing?", d: "The legal work of transferring ownership of a property from one person to another." },
      { t: "What a conveyancer does", d: "Checks the title, orders searches, raises enquiries, handles the contract and moves the money." },
      { t: "Fees and disbursements", d: "The firm’s legal fee, plus costs paid to others such as searches and Land Registry fees." },
      { t: "Searches", d: "Checks on the property and area: local authority, drainage and water, environmental and more." },
      { t: "Enquiries", d: "Questions your solicitor raises with the other side after reviewing the paperwork." },
      { t: "Title", d: "The legal record of who owns the property and any rights or restrictions on it." },
      { t: "Freehold and leasehold", d: "Whether you own the building and land outright, or a lease for a set number of years." },
      { t: "Exchange and completion", d: "Exchange makes it binding. Completion is when the money moves and you get the keys." },
      { t: "After completion", d: "Your solicitor pays Stamp Duty where due and registers you as the new owner." }
    ],
    faqs: [{ q: "How much does conveyancing cost?", a: "It depends on the price, tenure and complexity. Compare the total including disbursements, not just the legal fee.", g: "conv-cost" }, { q: "How long does it take?", a: "Many purchases take around 8 to 12 weeks, but there’s no fixed timeframe.", g: "conv-time" }, { q: "Do I need a local solicitor?", a: "Not usually. Most conveyancing is done remotely, so experience with your type of property matters more.", g: "sol-vs-conv" }] },
  mortgages: { key: "mortgages", slug: "mortgages", h1: "Check your mortgage options", kicker: "Mortgages & finance", intro: "Explore whether there may be more suitable options available through our broker network, whether you’re buying, remortgaging or your situation isn’t straightforward.", cta: "Check my mortgage options", doing: "Buying",
    included: ["Introductions to mortgage brokers in our network", "Purchases, remortgages and buy-to-let", "Rate reviews before your current deal ends", "Complex income and self-employed applicants", "Specialist finance: bridging and auction finance"],
    faqs: [{ q: "What is a mortgage in principle?", a: "A lender’s early indication of how much it may lend you. It isn’t a guarantee.", g: "mip" }, { q: "Should I use a broker?", a: "A broker can compare lenders and help with your application, which helps most when circumstances aren’t simple.", g: "broker" }, { q: "When should I remortgage?", a: "It’s usually worth reviewing around six months before your deal ends.", g: "remortgage" }],
    warning: "Your home may be repossessed if you do not keep up repayments on your mortgage. Properfy is not a lender or a mortgage adviser. Advice is given by the authorised broker you’re introduced to." },
  surveys: { key: "surveys", slug: "property-surveys", h1: "Find a surveyor", kicker: "Surveys", intro: "Find out about the condition of a home before you commit to buying it.", cta: "Find a surveyor", doing: "Buying",
    included: ["Introductions to RICS-regulated surveyors", "Level 1, Level 2 and Level 3 surveys", "Help choosing the right level for the property", "Guidance if the survey finds problems"],
    explain: [
      { t: "Mortgage valuation", d: "Done for your lender to check the property is worth what they’re lending. It isn’t a survey." },
      { t: "Level 1 survey", d: "A basic condition report, suited to newer, conventional homes in good condition." },
      { t: "Level 2 survey", d: "The most common choice. Flags visible defects and issues needing attention." },
      { t: "Level 3 building survey", d: "The most detailed. For older, larger, altered or unusual properties." },
      { t: "When a survey helps", d: "Almost always worth it, especially for older homes or anything that’s been extended." },
      { t: "If problems are found", d: "Get repair quotes, then ask for repairs or renegotiate the price before exchange." }
    ],
    faqs: [{ q: "Do I need a survey?", a: "It isn’t a legal requirement, but it tells you about the home’s condition before you’re committed.", g: "survey" }, { q: "Valuation or survey?", a: "A valuation is for the lender and checks value. A survey is for you and checks condition.", g: "survey" }, { q: "Can I renegotiate after a survey?", a: "Yes, up until exchange. Base it on real repair quotes.", g: "survey" }] },
  removals: { key: "removals", slug: "removals", h1: "Get a removal quote", kicker: "Removals", intro: "Tell us where you’re moving from and to, and we’ll help you find removals that fit your date and budget.", cta: "Get a removal quote", doing: "Moving home",
    included: ["Full removal services", "Packing and packing materials", "Storage, short or long term", "Man and van for smaller moves", "Specialist items such as pianos and antiques", "Moving-day planning for chain completions"],
    faqs: [{ q: "When should I book removals?", a: "As soon as your completion date is fixed, usually at exchange. Get quotes earlier for busy dates.", g: "removals-when" }, { q: "How much do removals cost?", a: "It depends on volume, distance, packing and access. Get a quote based on a survey of your belongings.", g: "removals-when" }, { q: "What if completion dates don’t match?", a: "Storage and temporary accommodation can bridge the gap.", g: "dates-mismatch" }] },
  moving: { key: "moving", slug: "moving-house", h1: "Moving home services", kicker: "Moving home", intro: "The jobs around moving day that are easy to forget, gathered in one place.", cta: "Tell us about my move", doing: "Moving home",
    included: ["Utilities set-up", "Buildings and contents insurance", "Change of address checklist", "Storage", "Cleaning and home services"],
    sections: [
      { t: "Utilities", i: "ph ph-plug", d: "Take meter readings on the day and set up accounts at your new home.", items: ["Gas and electricity", "Water", "Broadband: book early, installs can take weeks", "TV licence", "Other household services"] },
      { t: "Insurance", i: "ph ph-shield-check", d: "If you’re buying, buildings insurance usually needs to start from exchange, not completion.", items: ["Buildings insurance", "Contents insurance", "Cover during the move"] },
      { t: "Change of address", i: "ph ph-envelope-simple", d: "A checklist of everyone who needs to know.", items: ["Banks and credit providers", "DVLA and HMRC", "Employer, schools, GP and dentist", "Insurers, utilities and subscriptions", "Your local council"], link: "checklists" },
      { t: "Storage", i: "ph ph-package", d: "When you might need it.", items: ["Completion dates don’t match", "Chain problems", "Temporary accommodation", "Downsizing or renovating", "Moving overseas"] },
      { t: "Cleaning & home services", i: "ph ph-sparkle", d: "Services we’re adding as our partner network grows.", items: ["Pre-move, post-move and end-of-tenancy cleaning", "Handyman and locksmith", "Electrician and plumber", "Decorator and gardener"] }
    ],
    faqs: [{ q: "Who needs to know I’ve moved?", a: "Banks, employer, HMRC, DVLA, GP, insurers, utilities and your council, at least.", g: "who-to-tell" }, { q: "When should I arrange broadband?", a: "As soon as you know your date. Installs can take a few weeks.", g: "who-to-tell" }] },
  auction: { key: "auction", slug: "auction-conveyancing", h1: "Buying or selling at auction", kicker: "Auctions", intro: "Traditional auctions move fast: contracts exchange when the hammer falls. Get the legal and finance side ready first.", cta: "Get help with an auction", doing: "Auction",
    included: ["Legal pack review before you bid", "Auction finance and bridging introductions", "Completing within the deadline, often 28 days", "Surveys before auction day", "For sellers: preparing a complete legal pack"],
    faqs: [{ q: "What happens after winning an auction?", a: "You’ve exchanged. You pay the deposit (often 10%) on the day and must complete by the deadline, often 28 days." }, { q: "Do I need a solicitor before the auction?", a: "It’s strongly advised. The legal pack can contain issues that are hard to undo after the hammer falls." }, { q: "Can I get a mortgage for an auction?", a: "Sometimes, but the deadline is tight. Bridging finance is often used." }] },
  toe: { key: "toe", slug: "transfer-of-equity-quote", h1: "Get a transfer of equity quote", kicker: "Transfer of equity", intro: "Adding or removing someone from your home’s ownership? Tell us what’s changing and we’ll help you find the right solicitor.", cta: "Get my quote", doing: "Transfer of equity",
    included: ["Adding or removing an owner", "Separation and family transfers", "Lender consent and remortgage introductions", "Stamp Duty checks", "Land Registry registration"],
    faqs: [{ q: "How long does a transfer of equity take?", a: "Often a few weeks to a couple of months, mostly depending on lender approval." }, { q: "Do I pay Stamp Duty?", a: "Sometimes, if someone takes on mortgage debt or pays money. Some situations are exempt." }, { q: "Does my lender need to agree?", a: "Yes, if there’s a mortgage on the property." }] },
  newbuild: { key: "newbuild", slug: "new-build-conveyancing", h1: "New build conveyancing", kicker: "New builds", intro: "New builds come with reservation deadlines, warranties and long-stop dates. Get a solicitor who deals with them regularly.", cta: "Get my quote", doing: "New build",
    included: ["Reservation and exchange deadlines", "Warranty checks", "Long-stop dates and build delays", "Snagging surveys", "New build mortgages"],
    faqs: [{ q: "Why are new build exchange deadlines so short?", a: "Developers often ask for exchange within about 28 days of reservation. Instruct a solicitor straight away." }, { q: "What is a long-stop date?", a: "The latest date by which the developer must finish the home, after which you may be able to pull out." }, { q: "Do I need a survey on a new build?", a: "A snagging survey can spot defects for the developer to fix." }] },
  so: { key: "so", slug: "shared-ownership-conveyancing", h1: "Shared ownership conveyancing", kicker: "Shared ownership", intro: "Buying, selling, staircasing or remortgaging a shared ownership home involves a lease and a housing provider as well as the usual steps.", cta: "Get my quote", doing: "Shared ownership",
    included: ["Buying and selling shared ownership", "Staircasing to a bigger share", "Lease, rent and service charge review", "Shared ownership mortgages and remortgages"],
    faqs: [{ q: "What is staircasing?", a: "Buying more shares in your home, sometimes up to 100%." }, { q: "Do I pay rent?", a: "Yes, on the share you don’t own, plus any service charge." }, { q: "Can I sell?", a: "Yes, but the housing provider usually has a period to find a buyer first." }] },
  finance: { key: "finance", slug: "specialist-finance", h1: "Specialist property finance", kicker: "Specialist finance", intro: "Bridging, auction finance, refurbishment and complex income. Explore whether there may be more suitable options available through our broker network.", cta: "Check my finance options", doing: "Specialist finance",
    included: ["Bridging finance", "Auction finance", "Development and refurbishment finance", "Buy-to-let", "Complex income and self-employed"],
    faqs: [{ q: "What is bridging finance?", a: "Short-term borrowing, often used to buy before you sell or to meet an auction deadline." }, { q: "Is specialist finance more expensive?", a: "Often, yes. It’s important to understand the full costs and exit plan." }],
    warning: "Personalised financial advice must come from an appropriately authorised professional. Properfy introduces you to brokers and does not give advice. Your property may be repossessed if you do not keep up repayments." }
},

specialist: [
  { g: "Auctions", i: "ph ph-gavel", items: [{ t: "Auction purchases", d: "Legal pack, finance and a tight completion deadline.", to: "svc:auction" }, { t: "Auction sales", d: "Preparing a complete legal pack before the auction.", to: "svc:auction" }] },
  { g: "Finance that needs a specialist", i: "ph ph-coins", items: [{ t: "Bridging finance", d: "Short-term borrowing to buy before you sell.", to: "svc:finance" }, { t: "Complex income", d: "Self-employed, contractors, multiple incomes.", to: "svc:finance" }, { t: "Buy-to-let", d: "Mortgages and conveyancing for landlords.", to: "svc:finance" }, { t: "Let to buy", d: "Keep your home as a rental and buy your next one.", to: "journey:ltb" }, { t: "Cash purchases", d: "Faster, but still needs checks and source of funds.", to: "svc:conveyancing" }] },
  { g: "Types of property", i: "ph ph-buildings", items: [{ t: "New builds", d: "Reservation deadlines, warranties, snagging.", to: "svc:newbuild" }, { t: "Shared ownership", d: "Leases, rent and staircasing.", to: "svc:so" }, { t: "Leasehold", d: "Lease length, service charge and management packs.", to: "guide:leasehold" }, { t: "Listed buildings", d: "Consent for works and specialist surveys.", to: "svc:surveys" }, { t: "Conservation areas", d: "Extra planning checks on changes.", to: "svc:conveyancing" }, { t: "Flood-risk property", d: "Searches, insurance and lender questions.", to: "svc:conveyancing" }, { t: "Unregistered property", d: "Older title deeds, more legal work.", to: "svc:conveyancing" }, { t: "Property with tenants", d: "Buying or selling with a tenancy in place.", to: "svc:conveyancing" }, { t: "High-value property", d: "More complex checks and finance.", to: "svc:conveyancing" }] },
  { g: "Your circumstances", i: "ph ph-user-circle", items: [{ t: "First-time buyers", d: "Every step explained, no jargon.", to: "hub:ftb" }, { t: "Probate and inherited property", d: "Selling or transferring an estate’s property.", to: "svc:conveyancing" }, { t: "Complex chains", d: "Long chains, linked sales, tight dates.", to: "journey:buysell" }, { t: "Transfer of equity", d: "Adding or removing an owner.", to: "journey:toe" }, { t: "Something else", d: "Tell us and we’ll work out the route.", to: "lead" }] }
],

cats: [
  { id: "buying", label: "Buying", icon: "ph ph-house-line", root: "buying-a-property", guides: ["offer-accepted", "how-buying-works", "buying-costs", "chain"] },
  { id: "selling", label: "Selling", icon: "ph ph-sign-out", root: "selling-a-property", guides: ["how-sell", "offer-binding", "sell-mortgage"] },
  { id: "conveyancing", label: "Conveyancing", icon: "ph ph-scales", root: "conveyancing", guides: ["conv-time", "conv-cost", "searches", "enquiries", "sol-vs-conv"] },
  { id: "mortgages", label: "Mortgages", icon: "ph ph-bank", root: "mortgages", guides: ["mip", "borrow", "broker", "offer-expiry", "remortgage"] },
  { id: "surveys", label: "Surveys", icon: "ph ph-magnifying-glass", root: "property-surveys", guides: ["survey"] },
  { id: "leasehold", label: "Leasehold", icon: "ph ph-buildings", root: "leasehold", guides: ["leasehold", "lease-length", "lpe1"] },
  { id: "exchange", label: "Exchange & completion", icon: "ph ph-key", root: "exchange-and-completion", guides: ["exchange", "completion"] },
  { id: "moving", label: "Moving house", icon: "ph ph-truck", root: "moving-house", guides: ["removals-when", "who-to-tell", "dates-mismatch"] },
  { id: "ftb", label: "First-time buyers", icon: "ph ph-star", root: "first-time-buyers", guides: ["how-buying-works", "buying-costs", "mip", "borrow", "offer-accepted", "survey", "exchange", "completion"] }
],

guides: {
  "offer-accepted": { cat: "buying", slug: "what-happens-after-an-offer-is-accepted", title: "What happens after my offer is accepted?", mins: 5,
    answer: "Once your offer is accepted, the agent sends a memorandum of sale to both sides, you instruct a solicitor, and your mortgage application and survey get underway. In England and Wales the purchase isn’t legally binding until contracts are exchanged, usually several weeks later.",
    qs: ["What happens after my offer is accepted?", "What happens after searches?", "What happens before exchange?"],
    why: "An accepted offer is an agreement in principle. Before anyone commits, your solicitor checks the legal title and searches, your lender values the property, and you find out about its condition. These run side by side, so starting them quickly saves time.",
    problems: ["Waiting too long to instruct a solicitor", "Slow replies to ID and source-of-funds requests", "A mortgage application stalling on missing documents", "Someone else in the chain not being ready", "Leasehold information packs taking weeks"],
    todo: ["Instruct your solicitor the same week", "Send ID and proof of funds as soon as you’re asked", "Submit your full mortgage application", "Book a survey", "Tell the agent who your solicitor is", "Avoid taking on new credit"],
    next: ["Instruct your solicitor", "Confirm your mortgage", "Arrange your survey", "Searches begin", "Enquiries begin", "Work towards exchange"],
    help: ["conveyancing", "mortgages", "surveys"],
    follow: [{ q: "How long until exchange?", a: "Often around 8 to 12 weeks from instructing a solicitor, depending on searches, the mortgage, the property and the chain.", g: "conv-time" }, { q: "Can the seller still accept another offer?", a: "Yes. Until exchange, a seller can accept a higher offer. This is gazumping. Moving quickly reduces the risk.", g: "offer-binding" }, { q: "Do I need a survey?", a: "It isn’t a legal requirement, but it tells you about the home’s condition before you commit.", g: "survey" }] },
  "how-buying-works": { cat: "buying", slug: "how-does-buying-a-house-work", title: "How does buying a house work?", mins: 3, answer: "You usually get a mortgage in principle, find a home and make an offer, then instruct a solicitor. Searches, a survey and your mortgage application run side by side until contracts are exchanged and the sale completes.", qs: ["How does buying a house work?", "Do I need a solicitor?", "How long does it take to buy a house?"], help: ["mortgages", "conveyancing"] },
  "buying-costs": { cat: "buying", slug: "how-much-does-it-cost-to-buy-a-house", title: "How much does it cost to buy a house?", mins: 3, answer: "On top of the price, budget for your deposit, Stamp Duty (depending on the price and where you buy), legal fees and disbursements, a survey, any mortgage fees, and removals. Many lenders need a deposit of at least 5–10%.", qs: ["How much does it cost to buy a house?", "How much deposit do I need?"], help: ["mortgages", "conveyancing", "surveys"] },
  "chain": { cat: "buying", slug: "what-is-a-property-chain", title: "What happens if I’m in a property chain?", mins: 3, answer: "A chain is a line of linked sales and purchases that depend on each other. Everyone has to be ready to exchange and complete together, so a delay at one link can hold up the rest.", qs: ["What happens if I’m in a property chain?", "What happens if someone in the chain is delayed?", "What happens if my buyer is delayed?"], help: ["conveyancing"] },
  "how-sell": { cat: "selling", slug: "how-do-i-sell-my-house", title: "How do I sell my house?", mins: 3, answer: "Get your home valued, choose an agent, get your EPC and instruct a solicitor early. Once you accept an offer, conveyancing runs until exchange and completion, often a few months in total.", qs: ["How do I sell my house?", "How long does selling a house take?", "How much does it cost to sell a house?", "What paperwork do I need?"], help: ["conveyancing"] },
  "offer-binding": { cat: "selling", slug: "is-an-accepted-offer-legally-binding", title: "Is an accepted offer legally binding?", mins: 2, answer: "No. In England and Wales an accepted offer isn’t legally binding until contracts are exchanged. Until then a seller could accept a higher offer (gazumping) or a buyer could lower theirs (gazundering).", qs: ["Is an accepted offer legally binding?", "What is gazumping?", "What is gazundering?", "What happens after accepting an offer?"], help: ["conveyancing"] },
  "sell-mortgage": { cat: "selling", slug: "what-happens-to-my-mortgage-when-i-sell", title: "What happens to my mortgage when I sell?", mins: 2, answer: "Your solicitor gets a redemption statement from your lender and pays off the mortgage from the sale money on completion. The balance is sent to you, usually the same day. Check for early repayment charges, or whether you can move (port) your deal.", qs: ["What happens to my mortgage when I sell?", "How do I redeem my mortgage?", "When do I receive my money?"], help: ["mortgages", "conveyancing"] },
  "conv-time": { cat: "conveyancing", slug: "how-long-does-conveyancing-take", title: "How long does conveyancing take?", mins: 5,
    answer: "A straightforward transaction can sometimes complete within several weeks, but there’s no fixed timeframe. Many purchases take around 8 to 12 weeks from instructing a solicitor, depending on searches, enquiries, the mortgage, the property type and whether there’s a chain.",
    qs: ["How long does conveyancing take?", "Why is my conveyancing taking so long?", "How long does it take to buy a house?", "How long does selling a house take?"],
    why: "Conveyancing is a sequence of checks, and several steps depend on other people: the council for searches, the lender for the mortgage offer, the freeholder or managing agent for leasehold information, and everyone else in the chain.",
    problems: ["Local authority searches in slower council areas", "Leasehold management packs", "Missing documents such as planning or building regulations sign-off", "Mortgage valuations and offers", "A long or incomplete chain", "Slow replies to enquiries"],
    todo: ["Instruct a solicitor as soon as your offer is accepted, or before if you’re selling", "Return forms, ID and payments quickly", "Order leasehold packs early", "Check with your broker that your application is complete", "Ask your solicitor what’s outstanding and who it’s waiting on"],
    next: ["Instruction and ID checks", "Searches and draft contract", "Enquiries and replies", "Mortgage offer and report on title", "Exchange", "Completion"],
    help: ["conveyancing"],
    follow: [{ q: "Why is my conveyancing taking longer?", a: "Usually it’s waiting on a third party: a search, a leasehold pack, a lender or someone in the chain. Ask your solicitor exactly what’s outstanding." }, { q: "Can I speed it up?", a: "You can’t control everyone, but replying quickly, ordering packs early and keeping your mortgage on track removes the delays that sit with you." }, { q: "When should I be concerned?", a: "If nothing has moved for two or three weeks and nobody can tell you what’s outstanding, ask for a clear written update." }, { q: "Can Properfy help?", a: "Yes. We can introduce conveyancers from our panel and help you understand where a stuck transaction may be held up." }] },
  "conv-cost": { cat: "conveyancing", slug: "how-much-does-conveyancing-cost", title: "How much does conveyancing cost?", mins: 3, answer: "Conveyancing costs are the firm’s legal fee plus disbursements: costs paid to others, such as searches and Land Registry fees. Quotes vary with the price, tenure and complexity, so compare the full total.", qs: ["How much does conveyancing cost?", "Why do conveyancing quotes vary?", "What are conveyancing disbursements?"], help: ["conveyancing"] },
  "searches": { cat: "conveyancing", slug: "what-are-property-searches", title: "What are property searches?", explains: "What are property searches?", mins: 4, answer: "Searches are checks your solicitor orders on the property and its area. The usual ones are the local authority search, the drainage and water search and an environmental search; others depend on location. They often take a few weeks, depending on the council.", qs: ["What are property searches?", "What searches do I need?", "How long do searches take?", "What is a local authority search?", "What is a drainage search?", "What is an environmental search?"], help: ["conveyancing"] },
  "enquiries": { cat: "conveyancing", slug: "what-are-conveyancing-enquiries", title: "What are conveyancing enquiries?", mins: 3, answer: "Enquiries are questions your solicitor asks the seller’s solicitor after reviewing the contract, searches and forms. They’re normal, and answering quickly is one of the best ways to avoid delays.", qs: ["What are conveyancing enquiries?", "Why is my solicitor asking so many questions?", "What happens after searches?"], help: ["conveyancing"] },
  "sol-vs-conv": { cat: "conveyancing", slug: "solicitor-or-conveyancer", title: "Solicitor or conveyancer: what’s the difference?", explains: "What does a conveyancer do?", mins: 3, answer: "Both can handle your move. Solicitors are regulated by the SRA and can do wider legal work; licensed conveyancers are regulated by the CLC and specialise in property. Experience with your type of transaction matters most.", qs: ["What is conveyancing?", "What does a conveyancer do?", "What’s the difference between a solicitor and conveyancer?", "Can I change solicitor?", "Do I need a local solicitor?"], help: ["conveyancing"] },
  "mip": { cat: "mortgages", slug: "what-is-a-mortgage-in-principle", title: "What is a mortgage in principle?", explains: "What is a mortgage in principle?", mins: 2, answer: "A mortgage in principle is a lender’s early indication of how much it may lend you. It isn’t a guarantee: the full application, credit checks and valuation come later. Many lenders use a soft credit check, but ask first.", qs: ["What is a mortgage in principle?", "Does a mortgage in principle guarantee a mortgage?", "Does a mortgage in principle affect my credit score?"], help: ["mortgages"] },
  "borrow": { cat: "mortgages", slug: "how-much-can-i-borrow", title: "How much can I borrow?", mins: 3, answer: "Lenders look at your income, outgoings, debts, deposit and credit history, and check you could still afford payments if rates rose. Many lend around four to four-and-a-half times income, but it varies by lender and circumstance.", qs: ["How much can I borrow?", "How do lenders assess affordability?", "Can self-employed people get mortgages?", "What documents do I need?"], help: ["mortgages"] },
  "broker": { cat: "mortgages", slug: "should-i-use-a-mortgage-broker", title: "Should I use a mortgage broker?", mins: 2, answer: "A broker can compare deals across many lenders and help with your application, which is especially useful if your circumstances aren’t straightforward. They can’t guarantee a better rate, but may find options you wouldn’t find on your own.", qs: ["Should I use a mortgage broker?", "Can a broker get better rates?"], help: ["mortgages"] },
  "offer-expiry": { cat: "mortgages", slug: "how-long-does-a-mortgage-offer-last", title: "How long does a mortgage offer last?", mins: 2, answer: "Mortgage offers commonly last around three to six months. If yours is close to expiring, speak to your broker early: some lenders will extend, otherwise you may need to reapply.", qs: ["How long does a mortgage offer last?", "What happens if my mortgage offer expires?", "What happens after mortgage application?"], help: ["mortgages"] },
  "remortgage": { cat: "mortgages", slug: "when-should-i-remortgage", title: "When should I remortgage?", mins: 2, answer: "It’s usually worth reviewing your options around six months before your current deal ends, so you don’t move onto your lender’s standard variable rate.", qs: ["When should I remortgage?", "What happens if mortgage rates change?"], help: ["mortgages"] },
  "survey": { cat: "surveys", slug: "do-i-need-a-survey", title: "Do I need a house survey?", mins: 5,
    answer: "A survey isn’t a legal requirement, but it’s usually worth having. Your lender’s valuation only checks the property is worth what they’re lending. A survey tells you about its condition before you’re committed.",
    qs: ["Do I need a house survey?", "Which survey should I get?", "What is a Level 2 survey?", "What is a Level 3 survey?", "What is a building survey?", "What is the difference between a valuation and survey?", "What happens if a survey finds problems?", "Can I renegotiate after a survey?"],
    why: "Repairs you didn’t know about can be expensive. A survey before exchange gives you time to get quotes, ask questions or renegotiate.",
    problems: ["Relying on the mortgage valuation alone", "Choosing a survey too basic for an older or altered home", "Booking late, so results arrive close to exchange", "Not following up on recommendations, such as damp or electrics checks"],
    todo: ["Level 1 for newer, conventional homes in good condition", "Level 2 for most homes in reasonable condition", "Level 3 for older, larger, altered or unusual homes", "Book once your offer is accepted", "Ask the surveyor to explain anything concerning"],
    next: ["Surveyor inspects the property", "You receive the report", "Get quotes for any issues", "Renegotiate if needed", "Carry on towards exchange"],
    help: ["surveys"],
    follow: [{ q: "What’s the difference between a valuation and a survey?", a: "A valuation is for the lender and checks value. A survey is for you and checks condition." }, { q: "What if the survey finds problems?", a: "Get repair quotes, ask the seller to fix things, renegotiate the price, or in serious cases decide not to go ahead." }, { q: "Can I renegotiate after a survey?", a: "Yes, until exchange. Base it on real repair quotes rather than a round number." }] },
  "leasehold": { cat: "leasehold", slug: "leasehold-vs-freehold", title: "Leasehold vs freehold: what’s the difference?", mins: 3, answer: "Freehold means you own the building and the land it stands on. Leasehold means you own the right to live in the property for a set number of years under a lease, while a freeholder owns the building. Most flats are leasehold.", qs: ["What is leasehold?", "What is freehold?", "What is the difference?", "What is a share of freehold?", "What is ground rent?", "What is service charge?", "Can I sell a leasehold property?"], help: ["conveyancing"] },
  "lease-length": { cat: "leasehold", slug: "how-long-should-a-lease-be", title: "How long should a lease be?", mins: 2, answer: "Many lenders prefer at least 80 years left on a lease, and some want more. Below around 80 years, extending usually gets more expensive, and a short lease can make a property harder to mortgage or sell.", qs: ["How long should a lease be?", "What happens if a lease is short?", "What is a lease extension?"], help: ["conveyancing"] },
  "lpe1": { cat: "leasehold", slug: "what-is-an-lpe1", title: "What is an LPE1 and a management pack?", explains: "Why are leasehold purchases different?", mins: 3, answer: "An LPE1 is a standard form of leasehold information, usually part of a management pack from the managing agent or freeholder. It covers service charges, ground rent, insurance and planned works. Waiting for it is a common cause of leasehold delays.", qs: ["What is an LPE1?", "What is a management pack?", "Why is my leasehold purchase taking so long?"], help: ["conveyancing"] },
  "exchange": { cat: "exchange", slug: "what-happens-at-exchange", title: "What happens at exchange of contracts?", explains: "What is exchange?", mins: 5,
    answer: "At exchange, both solicitors swap signed contracts and fix the completion date. From that moment the deal is legally binding, and the buyer pays their deposit, often 10% of the price, though a lower amount is sometimes agreed.",
    qs: ["What is exchange of contracts?", "What happens at exchange?", "Is exchange legally binding?", "Can I pull out after exchange?", "How much deposit is paid?", "How long between exchange and completion?", "Can exchange and completion happen on the same day?"],
    why: "Before exchange, either side can walk away. Exchange is the point of commitment, so everything (mortgage offer, searches, enquiries and deposit) needs to be in place first.",
    problems: ["Deposit funds not ready or not cleared", "Mortgage offer conditions still outstanding", "Someone in the chain not ready", "Disagreement over the completion date"],
    todo: ["Sign your contract and transfer deed when asked", "Send deposit funds in good time", "Agree a completion date that works for the chain", "If buying, arrange buildings insurance from exchange", "Book removals once the date is fixed"],
    next: ["Confirm completion arrangements", "Arrange removals", "Organise utilities", "Arrange insurance", "Prepare for moving day"],
    help: ["conveyancing", "removals", "moving"],
    follow: [{ q: "Can I pull out after exchange?", a: "Only at real cost. You’d normally lose your deposit and could be liable for further losses." }, { q: "How long between exchange and completion?", a: "Commonly one to four weeks, but it’s whatever both sides agree." }, { q: "Can exchange and completion happen on the same day?", a: "Yes, sometimes, but it leaves no room for problems and makes booking removals harder." }] },
  "completion": { cat: "exchange", slug: "what-happens-on-completion-day", title: "What happens on completion day?", explains: "What happens on completion day?", mins: 4,
    answer: "On completion day, the buyer’s solicitor sends the money to the seller’s solicitor. Once it arrives, the seller’s solicitor confirms and the estate agent releases the keys. In a chain this happens in sequence, so keys can arrive anywhere from late morning to the afternoon.",
    qs: ["What happens at completion?", "When do I get the keys?", "What happens if completion is delayed?", "What happens if money has not arrived?", "What do I need to do before completion?"],
    why: "Completion is the day ownership changes hands. Money moves through each solicitor in the chain, so a delay at one point holds up everyone after it.",
    problems: ["Funds sent late or held by bank checks", "A delay further down the chain", "The seller not having moved out", "Removals booked too early in the day"],
    todo: ["Check funds are with your solicitor before the day", "Book removals with a flexible start", "Take meter readings and photos", "Collect keys once the agent confirms", "Keep your phone on for your solicitor"],
    next: ["Funds are sent", "Seller’s solicitor confirms receipt", "Keys are released", "You move in", "Your solicitor pays Stamp Duty where due and registers you"],
    help: ["removals", "moving"],
    follow: [{ q: "When do I get the keys?", a: "Once the seller’s solicitor confirms the money has arrived. The agent will let you know." }, { q: "What if completion is delayed?", a: "The contract sets out what happens. Usually interest is charged and a new time is agreed. Your solicitor will guide you." }, { q: "What if the money hasn’t arrived?", a: "Your solicitor can trace the payment. Keys aren’t released until it arrives." }] },
  "removals-when": { cat: "moving", slug: "when-should-i-book-removals", title: "When should I book removals?", mins: 2, answer: "Book as soon as you have a completion date, which is usually set at exchange. For busy days like Fridays and month-ends, get quotes before exchange so you’re ready to confirm.", qs: ["When should I book removals?", "How much do removals cost?", "What should I do before moving day?", "What should I clean before moving?"], help: ["removals"] },
  "who-to-tell": { cat: "moving", slug: "who-needs-to-know-i-have-moved", title: "Who needs to know I’ve moved?", mins: 2, answer: "Tell your bank, credit providers, employer, HMRC, DVLA, GP, dentist, insurers, utilities, your council and subscriptions. Set up Royal Mail redirection to catch anything you miss.", qs: ["Who needs to know I’ve moved?", "How do I redirect my post?", "When should I change utilities?", "When should I arrange broadband?", "What should I do with meter readings?", "When should I arrange insurance?"], help: ["moving"] },
  "dates-mismatch": { cat: "moving", slug: "what-if-completion-dates-dont-match", title: "What if completion dates don’t match?", mins: 2, answer: "If you have to leave before you can move in, short-term storage and temporary accommodation bridge the gap. Some movers use bridging finance to buy before they sell, which needs specialist advice.", qs: ["What happens if completion dates don’t match?", "Where can I store my belongings?"], help: ["removals", "finance"] }
},

popular: ["offer-accepted", "conv-time", "survey", "exchange", "completion", "removals-when"],
explains: ["exchange", "searches", "sol-vs-conv", "lpe1", "completion", "mip"],

checklists: [
  { id: "buying", title: "House buying checklist", items: ["Check your budget and deposit", "Get a mortgage in principle", "Line up a solicitor", "View homes and ask about the chain", "Make an offer", "Instruct your solicitor", "Submit your mortgage application", "Book a survey", "Read your report on title", "Arrange buildings insurance for exchange", "Exchange contracts", "Book removals", "Complete and collect keys"] },
  { id: "selling", title: "House selling checklist", items: ["Get two or three valuations", "Choose an estate agent", "Book your EPC", "Instruct a solicitor", "Gather guarantees and planning documents", "Order leasehold pack if needed", "Accept an offer", "Answer enquiries quickly", "Get a mortgage redemption figure", "Exchange contracts", "Book removals", "Complete and hand over keys"] },
  { id: "ftb", title: "First-time buyer checklist", items: ["Save your deposit", "Check your credit file", "Work out total buying costs", "Get a mortgage in principle", "Learn the basic terms (see our glossary)", "Find a solicitor", "View and offer", "Book a survey", "Understand exchange and completion", "Budget for ongoing costs: council tax, bills, insurance"] },
  { id: "exchange", title: "Exchange checklist", items: ["Mortgage offer received", "Searches back and reviewed", "Enquiries answered", "Report on title read", "Contract and transfer deed signed", "Deposit funds sent", "Completion date agreed", "Buildings insurance arranged"] },
  { id: "completion", title: "Completion checklist", items: ["Balance of funds with your solicitor", "Removals confirmed", "Utilities set up", "Broadband booked", "Keys collection arranged", "Meter readings on the day", "Photos of the property on arrival"] },
  { id: "moving", title: "Moving house checklist", items: ["Book removals or a van", "Start decluttering", "Order packing materials", "Book storage if needed", "Redirect your post", "Arrange broadband", "Pack an essentials box", "Defrost the freezer", "Take final meter readings", "Leave keys and manuals"] },
  { id: "address", title: "Change of address checklist", items: ["Banks", "Credit card and loan providers", "DVLA (licence and vehicle)", "HMRC", "Employer", "Schools", "GP", "Dentist", "Insurance companies", "Gas, electricity and water", "Broadband and TV", "Subscriptions and deliveries", "Local council (council tax and electoral roll)", "Pension and investment providers", "Royal Mail redirection"] },
  { id: "leasehold", title: "Leasehold buyer checklist", items: ["Check years left on the lease", "Ask for ground rent and service charge", "Request the management pack (LPE1)", "Check planned major works", "Check buildings insurance", "Ask about restrictions: pets, letting, alterations"] },
  { id: "auction", title: "Auction buyer checklist", items: ["Download and review the legal pack", "Have a solicitor check it", "Arrange finance for a 28-day deadline", "Survey before auction day", "Check fees in the conditions of sale", "Have the deposit ready", "Arrange buildings insurance from the hammer"] }
],

glossary: [
  { t: "Bridging finance", d: "Short-term borrowing, often used to buy before you sell or to meet an auction deadline.", g: "dates-mismatch" },
  { t: "Auction legal pack", d: "The legal documents for an auction lot: title, searches, lease and special conditions." },
  { t: "Chain", d: "A line of linked sales and purchases that depend on each other.", g: "chain" },
  { t: "Completion", d: "The day money changes hands, ownership transfers and you get the keys.", g: "completion" },
  { t: "Conveyancing", d: "The legal work of transferring property from one owner to another.", g: "sol-vs-conv" },
  { t: "Disbursements", d: "Costs your solicitor pays to others on your behalf, such as search and Land Registry fees.", g: "conv-cost" },
  { t: "Enquiries", d: "Questions your solicitor raises with the other side about the property.", g: "enquiries" },
  { t: "EPC", d: "Energy Performance Certificate. Rates a home’s energy efficiency; needed before marketing." },
  { t: "Exchange", d: "When signed contracts are swapped and the deal becomes legally binding.", g: "exchange" },
  { t: "Freehold", d: "Owning the building and the land it stands on outright.", g: "leasehold" },
  { t: "Gazumping", d: "When a seller accepts a higher offer after already accepting yours.", g: "offer-binding" },
  { t: "Gazundering", d: "When a buyer lowers their offer just before exchange.", g: "offer-binding" },
  { t: "Ground rent", d: "A regular payment a leaseholder may pay to the freeholder.", g: "leasehold" },
  { t: "Leasehold", d: "Owning the right to live in a property for a set number of years under a lease.", g: "leasehold" },
  { t: "Loan-to-value (LTV)", d: "Your mortgage as a percentage of the property’s value. A bigger deposit means a lower LTV.", g: "borrow" },
  { t: "LPE1", d: "A standard leasehold information form, usually part of the management pack.", g: "lpe1" },
  { t: "Mortgage in principle", d: "A lender’s early indication of how much it may lend. Not a guarantee.", g: "mip" },
  { t: "Report on title", d: "Your solicitor’s summary of the legal checks on the property." },
  { t: "Searches", d: "Checks on the property and its area, ordered by your solicitor.", g: "searches" },
  { t: "Service charge", d: "What leaseholders pay towards maintaining shared parts of a building.", g: "leasehold" },
  { t: "Stamp Duty", d: "A tax on buying property in England and Northern Ireland. Scotland and Wales have their own versions.", g: "buying-costs" },
  { t: "Transfer of equity", d: "Changing who legally owns a property without selling it." }
]
};

window.PFY.quick = {
  slug: "sell-my-house-fast",
  reasons: ["Chain has broken", "Relocating", "Separation or divorce", "Inherited property", "Behind on payments", "Property won’t sell", "Landlord selling up", "Something else"],
  types: ["House", "Flat", "Bungalow", "Other"],
  values: ["Under £150k", "£150k–£250k", "£250k–£400k", "£400k–£600k", "£600k+", "Not sure"],
  mortgage: ["No mortgage", "Mortgage, with equity", "Mortgage, little or no equity", "Not sure"],
  times: ["As soon as possible", "Within 4 weeks", "1–3 months", "Just exploring"],
  routes: [
    { t: "Cash buyer", icon: "ph ph-lightning", rows: [{ k: "Typical speed", v: "Often 7–28 days" }, { k: "Price", v: "Usually below market value, commonly 75–85%" }, { k: "Certainty", v: "High, if funds are proven" }, { k: "Best when", v: "Speed and certainty matter most" }] },
    { t: "Auction", icon: "ph ph-gavel", rows: [{ k: "Typical speed", v: "Around 4–8 weeks to completion" }, { k: "Price", v: "Set by bidding, protected by a reserve" }, { k: "Certainty", v: "Binding when the hammer falls" }, { k: "Best when", v: "The home is unusual or hard to mortgage" }] },
    { t: "Estate agent, priced to sell", icon: "ph ph-storefront", rows: [{ k: "Typical speed", v: "Often 2–4 months" }, { k: "Price", v: "Closest to full market value" }, { k: "Certainty", v: "Lower until exchange" }, { k: "Best when", v: "You can wait a little longer for more money" }] }
  ],
  how: ["Tell us about your property", "We talk through your options with you", "An independent valuation is arranged", "You get no-obligation offers or a clear plan", "You choose the completion date", "Your own solicitor handles the sale"],
  checks: ["They can prove the funds are in place", "No upfront or hidden fees", "The offer is based on an independent valuation", "No price drop just before exchange", "You use your own independent solicitor", "They belong to a recognised body, such as the NAPB or The Property Ombudsman"],
  flags: ["Asking you to pay anything upfront", "Pressure to decide on the spot", "Cutting the offer just before exchange", "Insisting you use their solicitor", "Vague about who is actually buying"],
  faqs: [
    { q: "How fast can I sell my house?", a: "With a proven cash buyer and a solicitor ready, some sales complete in a few weeks. The legal work still has to be done properly, so most take a little longer." },
    { q: "How much will a cash buyer offer?", a: "Usually below full market value, commonly around 75–85%, because you’re trading price for speed and certainty. Always compare it against the other routes." },
    { q: "Are there any fees?", a: "Some buyers cover legal fees, others don’t. Get everything in writing, and be wary of anyone asking for money upfront." },
    { q: "Can I sell if I’m behind on my mortgage?", a: "Often, yes, as long as the sale clears what you owe. If you’re worried about repossession, see our repossession help as well.", g: "repo" },
    { q: "What is sale and rent back?", a: "Selling your home to a company and renting it back. It’s regulated by the FCA and carries real risks, so get independent advice before considering it." }
  ]
};
window.PFY.repo = {
  slug: "repossession-help",
  stages: [
    { id: "behind", label: "Behind on payments", what: "You’ve missed one or more payments. Your lender will get in touch, and arrears charges may be added.", urgency: "Act now: most options are still open.", now: ["Contact your lender and explain what’s happening", "Get free, independent debt advice", "Work out what you can realistically pay"] },
    { id: "letters", label: "Letters from my lender", what: "Formal arrears letters are part of the steps lenders must follow before going to court.", urgency: "Your lender should try to agree a plan with you first.", now: ["Reply to every letter and keep copies", "Ask about a payment arrangement or a temporary change", "Get free advice before you agree to anything"] },
    { id: "court", label: "I have a court date", what: "Your lender has applied for a possession order. At the hearing, a judge decides what happens next.", urgency: "Urgent: get advice before your hearing.", now: ["Go to the hearing. Not attending can make things worse", "Get free legal advice. A duty adviser can help on the day", "Bring proof of income and any offer you can make"] },
    { id: "order", label: "A possession order was made", what: "The court has made an order. It may be suspended as long as you keep to the payments it sets.", urgency: "Very urgent: time may be short.", now: ["Keep to any payments the court set", "Get advice straight away if you can’t", "Think about whether selling on your own terms is better"] },
    { id: "eviction", label: "I have an eviction date", what: "Your lender has asked for bailiffs to take possession. You may still be able to ask the court to delay it.", urgency: "Act today.", now: ["Get free legal advice today", "Ask about applying to suspend the eviction", "Contact your council for housing help"] }
  ],
  behind: ["Not behind yet, but worried", "1–2 months", "3–5 months", "6 months or more", "Not sure"],
  wants: ["Keep my home", "Sell my home", "Not sure yet"],
  options: [
    { t: "Payment arrangement", d: "Paying your usual amount plus something towards the arrears.", i: "ph ph-calendar-check" },
    { t: "Temporary changes", d: "Such as a longer term or a spell on interest-only, if your lender agrees.", i: "ph ph-sliders-horizontal" },
    { t: "Support for Mortgage Interest", d: "A government loan towards mortgage interest for some people on certain benefits.", i: "ph ph-bank" },
    { t: "Selling on your own terms", d: "Selling before repossession usually gets a better price and keeps you in control.", i: "ph ph-sign-out" },
    { t: "Sale and rent back", d: "Regulated by the FCA and higher risk. Only consider it after independent advice.", i: "ph ph-warning" },
    { t: "Voluntary surrender", d: "Handing back the keys. Usually a last resort, as you can still owe money afterwards.", i: "ph ph-key" }
  ],
  advice: [
    { t: "MoneyHelper", d: "Free, government-backed money and debt guidance." },
    { t: "StepChange", d: "Free debt advice charity." },
    { t: "Citizens Advice", d: "Free advice on debt, housing and court." },
    { t: "Shelter", d: "Free housing advice, including help with possession hearings." }
  ],
  help: ["A calm, confidential call to understand your situation", "Help working out your options, including whether selling makes sense", "Introductions to mortgage brokers and solicitors", "If you choose to sell, introductions to reputable quick-sale buyers", "Pointers to free, independent debt advice"],
  faqs: [
    { q: "Can repossession be stopped?", a: "Often, especially if you act early. Lenders are expected to treat repossession as a last resort and consider reasonable proposals." },
    { q: "How long does repossession take?", a: "It varies. From a first missed payment to a court hearing is often several months, and lenders must follow set steps first." },
    { q: "Will I still owe money after repossession?", a: "Possibly. If the sale doesn’t cover the mortgage and costs, you can be asked to pay the shortfall." },
    { q: "Is it better to sell before repossession?", a: "Often. A sale you control usually gets a better price and lower costs than a lender’s sale. Get advice first." }
  ]
};

/* ── Shared lists and colours used across pages ─────────────────────────── */

window.PFY.ui = {
  neon: ["#29b6f6", "#1fd67a", "#a259ff", "#ff2e9a", "#ff7a2f", "#ffe135"],
  doing: ["Buying", "Selling", "Buying & selling", "Let to buy", "Remortgaging", "Transfer of equity", "Auction", "New build", "Shared ownership", "Specialist finance", "Quick sale", "Facing repossession", "Moving home", "Other"],
  stages: ["Just considering moving", "Looking for a property", "Offer accepted", "Sale agreed", "Mortgage arranged", "Conveyancing underway", "Near exchange", "Exchanged", "Completion approaching", "Already moved"],
  times: ["Morning", "Lunchtime", "Afternoon", "Evening"],
  stop: "what does the how when should my is are can and for with do i a an to of in after need get much long it on be if you your me who which why at",
  how: [
    { t: "Tell us about your move", d: "A couple of minutes online. Buying, selling or not sure yet." },
    { t: "We call you", d: "At a time that suits you, to understand your situation." },
    { t: "We find the right help", d: "Introductions to professionals from our partner network." },
    { t: "You decide", d: "No obligation. We’re here for questions at every stage." }
  ],
  after: ["We receive your enquiry", "Our team calls you at your chosen time", "We work out what you need", "We introduce the right professional", "You decide whether to go ahead"],
  why: [
    { i: "compass", t: "We look at the whole move", d: "Not just one service, so nothing falls between the gaps." },
    { i: "chat-circle-text", t: "Plain English", d: "We explain what’s happening and what comes next." },
    { i: "handshake", t: "Partner network", d: "Professionals regulated where their work requires it." },
    { i: "hand-heart", t: "No obligation", d: "Ask for help without committing to anything." }
  ],
  homeServices: [
    { t: "Conveyancing", d: "Quotes from conveyancing firms on our panel.", icon: "ph ph-scales", k: "conveyancing" },
    { t: "Mortgages & finance", d: "Explore options through our broker network.", icon: "ph ph-bank", k: "mortgages" },
    { t: "Surveys", d: "Know the condition of a home before you commit.", icon: "ph ph-magnifying-glass", k: "surveys" },
    { t: "Removals", d: "Removals, packing, storage and man and van.", icon: "ph ph-truck", k: "removals" },
    { t: "Utilities", d: "Energy, water, broadband and TV, sorted in time.", icon: "ph ph-plug", k: "moving" },
    { t: "Insurance", d: "Buildings and contents, from the right date.", icon: "ph ph-shield-check", k: "moving" },
    { t: "Change of address", d: "A checklist of everyone who needs to know.", icon: "ph ph-envelope-simple", to: "checklists" },
    { t: "Storage", d: "For when completion dates don’t line up.", icon: "ph ph-package", k: "moving" },
    { t: "Cleaning & home services", d: "Cleaners, handymen, locksmiths and more.", icon: "ph ph-sparkle", k: "moving" }
  ],
  about: [
    { t: "What Properfy is", d: "A property concierge. We sit in the middle of the home-moving process and help you understand what you need, when you need it and who can help." },
    { t: "Who we help", d: "Buyers, sellers, people doing both, first-time buyers, people remortgaging or changing ownership, and anyone whose move isn’t straightforward." },
    { t: "How it works", d: "You tell us about your move. We call you, work out what you need and introduce you to suitable professionals. You decide whether to go ahead." },
    { t: "How enquiries are handled", d: "Your details go to our team, not straight to a list of companies. We only share them with a partner once we’ve agreed the introduction with you.", items: ["No obligation to proceed", "You choose when we call", "Ask us to delete your details at any time"] },
    { t: "How partners work", d: "We work with conveyancers, mortgage brokers, surveyors, removals firms and other home services. We may receive a referral fee when we introduce you, and we’ll always tell you before an introduction is made." },
    { t: "What we won’t say", d: "You won’t see us promise the ‘best’, ‘cheapest’ or ‘guaranteed’ anything. Every move is different, and good help starts with understanding yours." },
    { t: "How our guides are written", d: "Our guides are original, written in plain English, checked against authoritative sources and reviewed by qualified professionals. Each one shows when it was last reviewed." }
  ]
};

/* ── Settings ───────────────────────────────────────────────────────────── */

window.PFY.config = {
  // Every enquiry, callback, quote request and checklist request is emailed
  // here by FormSubmit (formsubmit.co). The very first submission sends an
  // "Activate Form" email instead: click it once and everything after
  // arrives. Set to null for preview mode (nothing is sent; the site says so).
  leadEndpoint: "https://formsubmit.co/ajax/Mr.w.davey@hotmail.com",
  contact: { email: "Mr.w.davey@hotmail.com", phone: "07746 448080", phoneHref: "+447746448080" },
  site: "https://properfy.co.uk",
  // Who reviewed the guides. Shown on every guide as "Reviewed by …" once set.
  reviewer: null,
  guidesUpdated: "September 2026",
  // Properfy only serves England and Wales. Postcodes in these areas are
  // refused on every form (see PF.checkPostcode in site.js).
  serviceArea: {
    name: "England and Wales",
    outside: {
      "Scotland": ["AB", "DD", "DG", "EH", "FK", "G", "HS", "IV", "KA", "KW", "KY", "ML", "PA", "PH", "TD", "ZE"],
      "Northern Ireland": ["BT"],
      "the Channel Islands": ["GY", "JE"],
      "the Isle of Man": ["IM"]
    },
    // TD (Scottish Borders) districts that include English addresses,
    // e.g. Berwick-upon-Tweed and Cornhill-on-Tweed.
    allowDistricts: ["TD12", "TD15"]
  }
};
