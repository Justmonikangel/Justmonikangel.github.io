/* Four Australian sample receipts the demo falls back to.
   Prices in integer cents; the rest of the app never sees floats. */
window.SS_SAMPLES = [
  {
    id: "sample_single_o",
    badge: "coffee",
    badgeLabel: "Café",
    title: "Single O · Surry Hills",
    placeName: "Single O, 60-64 Reservoir St",
    serviceFeeCents: 0,
    items: [
      { id: "i1", name: "Flat white",        qty: 2, priceCents: 1000 },
      { id: "i2", name: "Oat milk latte",    qty: 1, priceCents:  650 },
      { id: "i3", name: "Almond croissant",  qty: 2, priceCents: 1500 },
      { id: "i4", name: "Sparkling water",   qty: 1, priceCents:  450 },
    ],
  },
  {
    id: "sample_woolies",
    badge: "grocery",
    badgeLabel: "Grocery",
    title: "Woolworths Metro · Town Hall",
    placeName: "Woolworths Metro, 9 Park St Sydney",
    serviceFeeCents: 0,
    items: [
      { id: "i1", name: "Sourdough loaf",         qty: 1, priceCents:  650 },
      { id: "i2", name: "Free-range eggs (12pk)", qty: 1, priceCents:  890 },
      { id: "i3", name: "Greek yoghurt 1kg",      qty: 1, priceCents:  799 },
      { id: "i4", name: "Bananas (1kg)",          qty: 1, priceCents:  399 },
      { id: "i5", name: "Macadamia milk 1L",      qty: 2, priceCents:  900 },
      { id: "i6", name: "Tim Tams (Original)",    qty: 1, priceCents:  500 },
      { id: "i7", name: "Coopers Pale 6pk",       qty: 1, priceCents: 2495 },
    ],
  },
  {
    id: "sample_chinchin",
    badge: "dinner",
    badgeLabel: "Dinner",
    title: "Chin Chin · Flinders Lane",
    placeName: "Chin Chin, 125 Flinders Ln Melbourne",
    serviceFeeCents: 1860,
    items: [
      { id: "i1", name: "Kingfish sashimi",            qty: 1, priceCents: 2900 },
      { id: "i2", name: "Caramelised pork belly",      qty: 1, priceCents: 3800 },
      { id: "i3", name: "Massaman beef curry",         qty: 1, priceCents: 4200 },
      { id: "i4", name: "Pad Thai (vegetarian)",       qty: 1, priceCents: 2800 },
      { id: "i5", name: "Coconut rice (bowl)",         qty: 2, priceCents: 1200 },
      { id: "i6", name: "Mango sticky rice",           qty: 1, priceCents: 1600 },
      { id: "i7", name: "Hendrick's & tonic",          qty: 2, priceCents: 4000 },
      { id: "i8", name: "Pinot noir (glass)",          qty: 1, priceCents: 1800 },
    ],
  },
  {
    id: "sample_rolld",
    badge: "delivery",
    badgeLabel: "Uber Eats",
    title: "Roll'd · via Uber Eats",
    placeName: "Roll'd Pitt Street",
    serviceFeeCents: 749,
    items: [
      { id: "i1", name: "Bánh mì (pork)",        qty: 2, priceCents: 1390 },
      { id: "i2", name: "Bánh mì (lemongrass tofu)", qty: 1, priceCents: 1290 },
      { id: "i3", name: "Spring rolls (3pc)",    qty: 2, priceCents:  890 },
      { id: "i4", name: "Vermicelli bowl (beef)", qty: 1, priceCents: 1690 },
      { id: "i5", name: "Vietnamese iced coffee", qty: 3, priceCents:  650 },
    ],
  },
];

window.SS_SAMPLES.forEach((s) => {
  s.subtotalCents = s.items.reduce((a, it) => a + it.qty * it.priceCents, 0);
  s.totalCents = s.subtotalCents + (s.serviceFeeCents || 0);
});
