export interface User {
  id: string;
  displayName: string;
  avatar?: string;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  cycleAvgDays: number;
  lastPeriodStart: string;
  goals: Array<'regulate-cycle' | 'fertility' | 'anti-androgen' | 'weight' | 'metabolic'>;
  diagnosisStatus: 'undiagnosed' | 'suspected' | 'confirmed';
  phenotype?: 'A' | 'B' | 'C' | 'D';
}
