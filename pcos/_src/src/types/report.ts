import type { ExclusionStatus, FeatureFlag, NumValue } from '@/types/common';

/**
 * A single uploaded/recorded lab or imaging report.
 *
 * v2 changes from v1:
 * - rawFiles (data URLs in localStorage) removed; replaced by
 *   originalImageRefs pointing to IndexedDB keys, populated only when
 *   the user opts in via Settings.
 * - diagnosis (DiagnosisResult) replaced by featureMapId pointing to a
 *   PcosFeatureMap stored separately, so the same report can be re-mapped
 *   as guidelines evolve.
 */
export interface Report {
  id: string;
  takenAt: string;
  cycleDay?: number;
  source: 'ocr' | 'manual' | 'imported';
  hormones?: HormonePanel;
  metabolic?: MetabolicPanel;
  ultrasound?: UltrasoundFindings;
  notes?: string;
  parsed: boolean;

  /** IndexedDB keys for any original images the user chose to keep. */
  originalImageRefs?: string[];

  /** Pointer to the PcosFeatureMap derived from this report. */
  featureMapId?: string;
}

export interface HormonePanel {
  FSH?: NumValue;
  LH?: NumValue;
  E2?: NumValue;
  P?: NumValue;
  T?: NumValue;
  freeT?: NumValue;
  DHEAS?: NumValue;
  SHBG?: NumValue;
  AMH?: NumValue;
  Prolactin?: NumValue;
  TSH?: NumValue;
  '17OHP'?: NumValue;
}

export interface MetabolicPanel {
  fastingGlucose?: NumValue;
  fastingInsulin?: NumValue;
  HbA1c?: NumValue;
  HOMA_IR?: NumValue;
  TC?: NumValue;
  TG?: NumValue;
  HDL?: NumValue;
  LDL?: NumValue;
  BMI?: NumValue;
  WHR?: NumValue;
}

export interface UltrasoundFindings {
  /** 2018/2023 Intl Guideline threshold: AFC >= 20/ovary on hi-res TVUS. */
  folliclesPerOvary?: number;
  ovarianVolumeMl?: { left?: number; right?: number };
  endometriumMm?: number;
  description?: string;
}

/**
 * v2 replacement for DiagnosisResult.
 *
 * Critical invariants (UI and agent must respect):
 * - Never outputs "confirmed" / "diagnosed".
 * - For adolescent population (cycleAvgYearsSinceMenarche < 8), AMH and
 *   ultrasound are NOT used as PCOM evidence.
 * - For adult population, AMH may substitute for ultrasound AFC.
 * - exclusionsChecked must be considered before any "consistent" literacy
 *   summary; missing exclusions show up in literacyOutput.missingExclusions.
 */
export interface PcosFeatureMap {
  id: string;
  reportId?: string;
  computedAt: string;
  population: 'adult' | 'adolescent' | 'unknown';
  criteriaReference: 'IntlPCOS2023';

  features: {
    ovulatoryDysfunction: FeatureFlag;
    hyperandrogenism: {
      clinical: FeatureFlag;
      biochemical: FeatureFlag;
    };
    polycysticOvarianMorphology: {
      ultrasoundAFC: FeatureFlag;
      amh: FeatureFlag;
      /** false for adolescents per 2023 guideline. */
      applicableForPopulation: boolean;
    };
  };

  associatedFeatures: {
    insulinResistance: FeatureFlag;
    centralAdiposity: FeatureFlag;
    depressionOrAnxietyRisk: FeatureFlag;
  };

  exclusionsChecked: {
    thyroid: ExclusionStatus;
    prolactin: ExclusionStatus;
    cah17OHP: ExclusionStatus;
    fsh: ExclusionStatus;
    cushing: ExclusionStatus;
    androgenSecretingTumor: ExclusionStatus;
  };

  literacyOutput: {
    summary: string;
    consistentFeatures: string[];
    inconclusiveFeatures: string[];
    missingExclusions: string[];
    suggestedDoctorQuestions: string[];
    relatedKnowledgeCardIds: string[];
  };

  /** Literal-typed disclaimer the UI must render verbatim. */
  disclaimer: 'feature-map-only-not-diagnosis';
}
