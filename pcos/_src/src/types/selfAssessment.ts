/**
 * AmITheOne self-assessment domain.
 *
 * Strictly NOT a diagnostic instrument. UI must render the
 * `disclaimer: 'self-assessment-not-diagnosis'` literal alongside results.
 */
export interface SelfAssessmentQuestion {
  id: string;
  text: string;
  hint?: string;
  kind:
    | 'cycle'
    | 'androgen-clinical'
    | 'metabolic'
    | 'mental'
    | 'fertility'
    | 'history';
  answerType: 'yesno' | 'scale-5' | 'choice' | 'number';
  choices?: Array<{ value: string; label: string }>;
  /**
   * Bridges self-assessment to PcosFeatureMap. Multiple questions can map
   * to the same feature (we aggregate).
   */
  mapsToFeature?: 'ovulatory' | 'androgen-clinical' | 'metabolic' | 'mental';
}

export interface AmITheOneSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  answers: Array<{ questionId: string; value: unknown }>;
  result?: SelfAssessmentResult;
}

export interface SelfAssessmentResult {
  pcosFeatureCount: number;
  countsByKind: Record<SelfAssessmentQuestion['kind'], number>;
  explanationCardIds: string[];
  nextSteps: Array<
    | { kind: 'upload-report'; reason: string }
    | { kind: 'read-stories'; reason: string }
    | { kind: 'talk-to-doctor'; reason: string }
    | { kind: 'browse-knowledge'; cardId: string; reason: string }
  >;
  disclaimer: 'self-assessment-not-diagnosis';
}
