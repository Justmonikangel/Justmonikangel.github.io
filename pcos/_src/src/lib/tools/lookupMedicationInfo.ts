import medicationSeed from '@/mocks/medicationInfo.json';

/**
 * Read-only medication info lookup.
 *
 * v2 invariants (Content Governance K-5 / A-2 / A-3):
 * - Returns mechanism, common PCOS uses (population evidence), common side
 *   effects, and topics to raise with a doctor.
 * - Does NOT return dose, frequency, duration, or "X is right for you".
 * - Returns `null` for unknown drug names; agent must say "I don't have
 *   info on that medication" rather than guess.
 */
export interface MedicationInfo {
  drug: string;
  zhName?: string;
  brand?: string[];
  mechanism: string;
  pcosCommonUses: string[];
  commonSideEffects: string[];
  notesForDoctorDiscussion: string[];
  citationIds: string[];
}

const REGISTRY: Record<string, MedicationInfo> = Object.fromEntries(
  (medicationSeed as MedicationInfo[]).map((entry) => [entry.drug.toLowerCase(), entry]),
);

export function lookupMedicationInfo(query: string): MedicationInfo | null {
  if (!query) return null;
  const direct = REGISTRY[query.toLowerCase()];
  if (direct) return direct;
  for (const entry of Object.values(REGISTRY)) {
    if (entry.zhName === query) return entry;
    if (entry.brand?.includes(query)) return entry;
  }
  return null;
}

export function listMedicationInfo(): MedicationInfo[] {
  return Object.values(REGISTRY);
}
