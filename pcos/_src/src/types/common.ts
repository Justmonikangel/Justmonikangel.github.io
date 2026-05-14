/**
 * Common building-block types shared across domains.
 *
 * Keep these tiny and orthogonal — anything domain-specific belongs in
 * types/{report, care, stories, ...}.ts.
 */

/**
 * A numeric measurement with unit and optional reference range.
 *
 * `ref` is the lab's reference range when the report carries one; UI must
 * prefer the lab's range over Cyster's defaults (lib/hormones.ts).
 */
export interface NumValue {
  value: number;
  unit: string;
  ref?: [number, number];
  flag?: 'low' | 'normal' | 'high' | 'borderline';
}

/**
 * Presence/absence of a clinical feature with traceable evidence.
 *
 * `evidence` is a list of human-readable strings the agent/UI can cite
 * back: e.g. ["AFC 35 (left) / 32 (right) on TVUS 2026-04-26",
 * "self-report: irregular cycles 18 months"].
 */
export interface FeatureFlag {
  status: 'present' | 'absent' | 'unknown' | 'borderline';
  evidence: string[];
}

/**
 * Status of a mandatory exclusion check (per 2023 Intl PCOS Guideline).
 *
 * - normal: ruled out
 * - abnormal: another diagnosis suggested; PCOS workup paused
 * - unchecked: lab not performed; PCOS literacy must say "incomplete"
 * - not-applicable: e.g. adolescent population, AMH not considered
 */
export type ExclusionStatusKind = 'normal' | 'abnormal' | 'unchecked' | 'not-applicable';

export interface ExclusionStatus {
  status: ExclusionStatusKind;
  evidence?: string;
}

/**
 * A citation used by KnowledgeCard / CommunityStory / agent output.
 *
 * At least one of url/pmid/doi should be present in production; for P1
 * curated content text-only citations are tolerable but the editorial
 * process must add an id over time.
 */
export interface Citation {
  id: string;
  text: string;
  url?: string;
  pmid?: string;
  doi?: string;
  accessedAt?: string;
}
