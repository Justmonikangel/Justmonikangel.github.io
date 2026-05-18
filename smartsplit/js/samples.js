/* SmartSplit · four sample Australian receipts.
   Shape matches what the OCR + parser layer would emit, so the rest of
   the app sees the same data whether the source is a real photo or a
   bullet-proof demo card. */
window.SS_SAMPLES = [
  {
    id: "sample_chinchin",
    band: "dinner",
    bandLabel: "🍜 Dinner",
    title: "Chin Chin · birthday dinner",
    placeName: "Melbourne CBD, VIC",
    merchant: {
      name: "CHIN CHIN",
      abn: "ABN 33 145 209 887",
      address: "125 Flinders Ln, Melbourne VIC 3000",
      datetime: "17 May 2026 · 19:55",
      payment: "EFTPOS Visa Debit •••• 7710 · Card surcharge 1.2%",
      footer: "Split charged to host card · Visa •••• 9082\n— Thank you —",
    },
    servicePct: 10,
    items: [
      { id: "i1", name: "Crispy Caramelised Pork", qty: 2, priceCents: 3800 },
      { id: "i2", name: "Kingfish Sashimi",        qty: 1, priceCents: 2800 },
      { id: "i3", name: "Coconut Tiger Prawns",    qty: 1, priceCents: 4200 },
      { id: "i4", name: "Sticky Beef Short Rib",   qty: 1, priceCents: 4500 },
      { id: "i5", name: "Wok Greens",              qty: 2, priceCents: 1600 },
      { id: "i6", name: "Jasmine Rice",            qty: 4, priceCents:  500 },
      { id: "i7", name: "House Negroni",           qty: 2, priceCents: 2200 },
      { id: "i8", name: "NA Spritz",               qty: 2, priceCents: 1400 },
    ],
  },
  {
    id: "sample_woolworths",
    band: "grocery",
    bandLabel: "🛒 Grocery",
    title: "Woolworths · Coogee weekly shop",
    placeName: "Coogee NSW",
    merchant: {
      name: "WOOLWORTHS",
      abn: "ABN 88 000 014 675",
      address: "Coogee Bay Rd, Coogee NSW 2034",
      datetime: "18 May 2026 · 18:42",
      payment: "Mastercard •••• 4421",
      footer: "Everyday Rewards earned · 38 pts\n— Thank you —",
    },
    servicePct: 0,
    items: [
      { id: "i1", name: "Tip Top White Bread 700g",   qty: 1, priceCents:  450 },
      { id: "i2", name: "Pura Full Cream Milk 2L",    qty: 2, priceCents:  360 },
      { id: "i3", name: "Free Range Eggs 12pk",        qty: 1, priceCents:  690 },
      { id: "i4", name: "Lurpak Butter 250g",          qty: 1, priceCents:  875 },
      { id: "i5", name: "Bananas Cavendish (kg)",      qty: 1, priceCents:  320 },
      { id: "i6", name: "Cherry Tomatoes 250g",        qty: 2, priceCents:  450 },
      { id: "i7", name: "Coopers Pale Ale 6pk",        qty: 1, priceCents: 2200 },
      { id: "i8", name: "Greek Yoghurt 1kg",           qty: 1, priceCents:  799 },
      { id: "i9", name: "Tim Tams (Original)",         qty: 2, priceCents:  500 },
    ],
  },
  {
    id: "sample_singleo",
    band: "cafe",
    bandLabel: "☕ Café",
    title: "Single O · Saturday morning",
    placeName: "Surry Hills NSW",
    merchant: {
      name: "SINGLE O",
      abn: "ABN 51 121 555 213",
      address: "60-64 Reservoir St, Surry Hills NSW 2010",
      datetime: "16 May 2026 · 09:38",
      payment: "Apple Pay · Visa •••• 1188",
      footer: "Roastery · single origin\n— Thank you —",
    },
    servicePct: 0,
    items: [
      { id: "i1", name: "Flat white",              qty: 2, priceCents:  550 },
      { id: "i2", name: "Oat milk latte",          qty: 1, priceCents:  650 },
      { id: "i3", name: "Almond croissant",        qty: 2, priceCents:  750 },
      { id: "i4", name: "Banana bread, toasted",   qty: 1, priceCents:  650 },
      { id: "i5", name: "Sparkling mineral 330ml", qty: 1, priceCents:  450 },
    ],
  },
  {
    id: "sample_rolld",
    band: "delivery",
    bandLabel: "🛵 Uber Eats",
    title: "Roll'd · via Uber Eats",
    placeName: "Pitt Street, Sydney",
    merchant: {
      name: "ROLL'D",
      abn: "ABN 17 158 904 003",
      address: "Pitt Street Mall, Sydney NSW 2000",
      datetime: "19 May 2026 · 12:14",
      payment: "Uber Eats wallet · Mastercard •••• 7702",
      footer: "Delivery + service fees apply\n— Thank you —",
    },
    servicePct: 0,
    serviceFlatCents: 749,
    items: [
      { id: "i1", name: "Bánh mì (pork)",                  qty: 2, priceCents: 1390 },
      { id: "i2", name: "Bánh mì (lemongrass tofu)",       qty: 1, priceCents: 1290 },
      { id: "i3", name: "Spring rolls (3pc)",              qty: 2, priceCents:  890 },
      { id: "i4", name: "Vermicelli bowl (beef brisket)",  qty: 1, priceCents: 1690 },
      { id: "i5", name: "Vietnamese iced coffee",          qty: 3, priceCents:  650 },
    ],
  },
];

// Precompute totals so the gallery cards can display them without re-running math.
window.SS_SAMPLES.forEach((r) => {
  r.subtotalCents = r.items.reduce((a, it) => a + it.qty * it.priceCents, 0);
  if (r.servicePct) {
    r.serviceFeeCents = Math.round(r.subtotalCents * (r.servicePct / 100));
  } else if (r.serviceFlatCents) {
    r.serviceFeeCents = r.serviceFlatCents;
  } else {
    r.serviceFeeCents = 0;
  }
  r.totalCents = r.subtotalCents + r.serviceFeeCents;
});

window.SS_SCENARIOS = [
  {
    icon: "🌱",
    title: "Vegetarian friend",
    desc: "Aya didn't have the kingfish or the pork — but the rice, drinks and service are still hers. SmartSplit handles it without you doing line-item maths in your head.",
    panels: [
      { step: "01", body: "Tap the photo." },
      { step: "02", body: "Pick the squad — 4 friends + Aya." },
      { step: "03", body: "Allocate: drop Aya off the meat items." },
      { step: "04", body: "Settle. Aya owes $46.20, you owe $68.30." },
    ],
  },
  {
    icon: "🎂",
    title: "Birthday person eats free",
    desc: "Joel's birthday: the squad covers his share equally and SmartSplit subtracts his own contribution from the total before the per-item × per-person split.",
    panels: [
      { step: "01", body: "Snap the Chin Chin receipt." },
      { step: "02", body: "Squad: 5 people including Joel." },
      { step: "03", body: "Mark Joel as 'birthday' — his share goes 0." },
      { step: "04", body: "Everyone else absorbs Joel's slice." },
    ],
  },
  {
    icon: "✈️",
    title: "Two-week trip ledger",
    desc: "Seven shared dinners, three Airbnbs, a hire car. Each receipt pinned to a place; the running per-person balance shows up on the home timeline.",
    panels: [
      { step: "01", body: "Capture each receipt as you go." },
      { step: "02", body: "Squad stays the same — 4 of you." },
      { step: "03", body: "Allocate per item per night." },
      { step: "04", body: "Final ledger settles in one tap." },
    ],
  },
];
