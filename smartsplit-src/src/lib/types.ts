export type ID = string;

export interface Person {
  id: ID;
  name: string;
  emoji?: string;
}

export interface ReceiptItem {
  id: ID;
  name: string;
  qty: number;
  unitPriceCents: number;
  /** People who consumed this item. Empty = shared by all squad members. */
  consumerIds: ID[];
}

export interface Receipt {
  id: ID;
  title: string;
  placeName?: string;
  capturedAt: string;
  items: ReceiptItem[];
  serviceFeeRate: number; // 0.10 = 10%
  prepaidDepositCents: number;
  prepaidByPersonId?: ID;
}

export interface SplitResult {
  itemsSubtotalCents: number;
  serviceFeeCents: number;
  totalCents: number;
  perPerson: Array<{
    personId: ID;
    name: string;
    grossCents: number;
    creditCents: number;
    owedCents: number;
  }>;
}

export interface AppState {
  squad: Person[];
  receipt: Receipt | null;
  /** Past completed splits — the memory timeline. */
  history: Array<{
    id: ID;
    title: string;
    placeName?: string;
    settledAt: string;
    totalCents: number;
    perPerson: SplitResult["perPerson"];
  }>;
}
