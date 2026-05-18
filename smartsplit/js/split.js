/* Pure integer-cent split math. */
window.SS_SPLIT = (function () {
  function distribute(totalCents, recipientIds) {
    const n = recipientIds.length;
    if (n === 0) return {};
    const base = Math.floor(totalCents / n);
    const remainder = totalCents - base * n;
    const sorted = [...recipientIds].sort();
    const out = {};
    sorted.forEach((id, i) => { out[id] = base + (i < remainder ? 1 : 0); });
    return out;
  }

  function fmt(cents) {
    const sign = cents < 0 ? "-" : "";
    const n = Math.abs(cents);
    return sign + "$" + (n / 100).toFixed(2);
  }

  function computeSplit(receipt, squad) {
    const owed = {};
    squad.forEach((p) => { owed[p.id] = 0; });

    let itemsSubtotal = 0;
    (receipt.items || []).forEach((item) => {
      const lineTotal = item.priceCents * (item.qty || 1);
      itemsSubtotal += lineTotal;
      let tagged = (item.assignments || []).filter((id) => owed.hasOwnProperty(id));
      // Skipped item → falls back to the whole squad (per the Allocate copy).
      if (tagged.length === 0) tagged = squad.map((p) => p.id);
      const share = distribute(lineTotal, tagged);
      Object.entries(share).forEach(([id, c]) => { owed[id] += c; });
    });

    const fee = receipt.serviceFeeCents || 0;
    if (squad.length > 0 && fee > 0) {
      const share = distribute(fee, squad.map((p) => p.id));
      Object.entries(share).forEach(([id, c]) => { owed[id] += c; });
    }

    return {
      itemsSubtotalCents: itemsSubtotal,
      serviceFeeCents: fee,
      totalCents: itemsSubtotal + fee,
      unclaimedCents: 0, // skipped items now fall back to whole squad
      perPerson: squad.map((p) => ({
        personId: p.id,
        name: p.name,
        owedCents: owed[p.id],
      })),
    };
  }

  return { computeSplit, fmt, distribute };
})();
