/**
 * v2 User shape.
 *
 * Removed from v1: phenotype (clinician-facing, not patient-facing).
 * Added: population (adolescent / adult split per 2023 guideline).
 * Renamed: diagnosisStatus -> pcosStatus, with patient-friendlier enum.
 */
export interface User {
  id: string;
  displayName: string;
  avatar?: string;
  birthYear: number;
  heightCm?: number;
  weightKg?: number;
  cycleAvgDays?: number;
  lastPeriodStart?: string;

  /**
   * "adolescent" applies when years-since-menarche < 8 (2023 guideline);
   * affects whether AMH and ultrasound are used as PCOM evidence.
   */
  population: 'adult' | 'adolescent' | 'unknown';

  goals: Array<
    | 'understand'
    | 'regulate-cycle'
    | 'fertility'
    | 'metabolic'
    | 'community'
  >;

  pcosStatus:
    | 'not-explored'
    | 'self-suspected'
    | 'clinical-suspected'
    | 'clinically-confirmed';
}
