import type { Person, Receipt, SplitResult } from "./types";

export const fmt = (cents: number): string =>
  `$${(cents / 100).toFixed(2)}`;

/**
 * Pure integer-cent split.
 * Each item's cost is divided evenly among its consumerIds (or all squad
 * members if consumerIds is empty). Service fee is applied to the full
 * item subtotal and split in the same proportion as item liability.
 * Remainder cents from integer division are distributed deterministically.
 */
export function computeSplit(receipt: Receipt, squad: Person[]): SplitResult {
  const personIds = squad.map((p) => p.id);
  const nameOf = new Map(squad.map((p) => [p.id, p.name]));

  // Step 1: per-person item liability in cents (integer arithmetic only).
  const gross = new Map<string, number>(personIds.map((id) => [id, 0]));

  for (const item of receipt.items) {
    const lineCents = item.qty * item.unitPriceCents;
    const consumers = item.consumerIds.length ? item.consumerIds : personIds;
    if (consumers.length === 0) continue;
    const base = Math.floor(lineCents / consumers.length);
    let remainder = lineCents - base * consumers.length;
    for (const pid of consumers) {
      const share = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
      gross.set(pid, (gross.get(pid) ?? 0) + share);
    }
  }

  const itemsSubtotal = [...gross.values()].reduce((a, b) => a + b, 0);

  // Step 2: service fee proportional to gross item liability.
  const feeTotal = Math.round(itemsSubtotal * receipt.serviceFeeRate);
  const fee = new Map<string, number>(personIds.map((id) => [id, 0]));
  if (itemsSubtotal > 0 && feeTotal > 0) {
    let allocated = 0;
    const ids = [...personIds];
    for (let i = 0; i < ids.length; i++) {
      const pid = ids[i];
      const share =
        i === ids.length - 1
          ? feeTotal - allocated
          : Math.floor((gross.get(pid) ?? 0) * feeTotal / itemsSubtotal);
      fee.set(pid, share);
      allocated += share;
    }
  }

  // Step 3: deposit credit goes to the prepayer.
  const credit = new Map<string, number>(personIds.map((id) => [id, 0]));
  if (receipt.prepaidByPersonId && receipt.prepaidDepositCents > 0) {
    credit.set(receipt.prepaidByPersonId, receipt.prepaidDepositCents);
  }

  const perPerson = personIds.map((pid) => {
    const g = (gross.get(pid) ?? 0) + (fee.get(pid) ?? 0);
    const c = credit.get(pid) ?? 0;
    return {
      personId: pid,
      name: nameOf.get(pid) ?? "?",
      grossCents: g,
      creditCents: c,
      owedCents: Math.max(0, g - c),
    };
  });

  return {
    itemsSubtotalCents: itemsSubtotal,
    serviceFeeCents: feeTotal,
    totalCents: itemsSubtotal + feeTotal,
    perPerson,
  };
}
