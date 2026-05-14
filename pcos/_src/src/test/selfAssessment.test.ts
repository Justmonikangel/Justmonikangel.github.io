import { describe, expect, it } from 'vitest';

import { computeSelfAssessmentResult } from '@/lib/selfAssessment';
import type { SelfAssessmentQuestion } from '@/types/selfAssessment';

const Q: SelfAssessmentQuestion[] = [
  { id: 'q1', text: 'cycle?', kind: 'cycle', answerType: 'yesno', mapsToFeature: 'ovulatory' },
  { id: 'q2', text: 'androgen?', kind: 'androgen-clinical', answerType: 'yesno', mapsToFeature: 'androgen-clinical' },
  { id: 'q3', text: 'metabolic?', kind: 'metabolic', answerType: 'yesno', mapsToFeature: 'metabolic' },
  { id: 'q4', text: 'mood?', kind: 'mental', answerType: 'yesno', mapsToFeature: 'mental' },
];

describe('computeSelfAssessmentResult', () => {
  it('counts only affirmative yesno answers', () => {
    const result = computeSelfAssessmentResult(
      [
        { questionId: 'q1', value: true },
        { questionId: 'q2', value: false },
        { questionId: 'q3', value: true },
      ],
      Q,
    );
    expect(result.pcosFeatureCount).toBe(2);
    expect(result.countsByKind.cycle).toBe(1);
    expect(result.countsByKind.metabolic).toBe(1);
    expect(result.countsByKind['androgen-clinical']).toBe(0);
    expect(result.disclaimer).toBe('self-assessment-not-diagnosis');
  });

  it('suggests upload-report when >= 2 affirmative answers', () => {
    const result = computeSelfAssessmentResult(
      [
        { questionId: 'q1', value: true },
        { questionId: 'q2', value: true },
      ],
      Q,
    );
    expect(result.nextSteps.some((s) => s.kind === 'upload-report')).toBe(true);
  });

  it('always offers a knowledge browsing step when zero affirmative', () => {
    const result = computeSelfAssessmentResult(
      [
        { questionId: 'q1', value: false },
        { questionId: 'q2', value: false },
      ],
      Q,
    );
    expect(result.pcosFeatureCount).toBe(0);
    expect(result.nextSteps.length).toBeGreaterThanOrEqual(1);
    expect(result.nextSteps[0].kind).toBe('browse-knowledge');
  });

  it('mood answers trigger mental-health steps', () => {
    const result = computeSelfAssessmentResult(
      [{ questionId: 'q4', value: true }],
      Q,
    );
    const kinds = result.nextSteps.map((s) => s.kind);
    expect(kinds).toContain('read-stories');
    expect(kinds).toContain('browse-knowledge');
  });

  it('never outputs a diagnostic verdict', () => {
    const result = computeSelfAssessmentResult(
      [
        { questionId: 'q1', value: true },
        { questionId: 'q2', value: true },
        { questionId: 'q3', value: true },
      ],
      Q,
    );
    expect(JSON.stringify(result)).not.toMatch(/确诊|confirmed|diagnosed/i);
  });
});
