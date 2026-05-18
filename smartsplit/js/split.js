/* Pure integer-cent split math.
   computeSplit(receipt, squad) → totals + per-person breakdown.

   Rules:
   - Each item has an `assignments` array of personIds who claim it.
   - Item cost (priceCents × qty) splits equally among those people.
   - Remainder cents are distributed deterministically to the first N
     assignees (sorted by id) so totals reconcile exactly.
   - Service fee is split equally across the full squad (same rule). */
window.SS_SPLIT = (function () {
  function distribute(totalCents, recipientIds) {
    const n = recipientIds.length;
    if (n === 0) return {};
    const base = Math.floor(totalCents / n);
    let remainder = totalCents - base * n;
    const sorted = [...recipientIds].sort();
    const out = {};
    sorted.forEach((id, i) => {
      out[id] = base + (i < remainder ? 1 : 0);
    });
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
      const tagged = (item.assignments || []).filter((id) => owed.hasOwnProperty(id));
      if (tagged.length === 0) return; // unclaimed line — surfaces later
      const share = distribute(lineTotal, tagged);
      Object.entries(share).forEach(([id, c]) => { owed[id] += c; });
    });

    const fee = receipt.serviceFeeCents || 0;
    if (squad.length > 0 && fee > 0) {
      const share = distribute(fee, squad.map((p) => p.id));
      Object.entries(share).forEach(([id, c]) => { owed[id] += c; });
    }

    const totalCents = itemsSubtotal + fee;
    const unclaimedCents = (receipt.items || []).reduce((sum, it) => {
      const tagged = (it.assignments || []).filter((id) => owed.hasOwnProperty(id));
      return tagged.length === 0 ? sum + it.priceCents * (it.qty || 1) : sum;
    }, 0);

    return {
      itemsSubtotalCents: itemsSubtotal,
      serviceFeeCents: fee,
      totalCents,
      unclaimedCents,
      perPerson: squad.map((p) => ({
        personId: p.id,
        name: p.name,
        owedCents: owed[p.id],
      })),
    };
  }

  return { computeSplit, fmt, distribute };
})();
