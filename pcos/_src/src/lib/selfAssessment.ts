import type {
  AmITheOneSession,
  SelfAssessmentQuestion,
  SelfAssessmentResult,
} from '@/types/selfAssessment';

const KNOWLEDGE_BY_KIND: Record<SelfAssessmentQuestion['kind'], string> = {
  cycle: 'pcos-2023-criteria',
  'androgen-clinical': 'pcos-2023-criteria',
  metabolic: 'pcos-2023-criteria',
  mental: 'pcos-and-depression',
  fertility: 'pcos-2023-criteria',
  history: 'pcos-2023-criteria',
};

/**
 * Pure result computation for an AmITheOne session.
 *
 * Counts how many questions were answered affirmatively (truthy), grouped
 * by kind, and emits a SelfAssessmentResult that NEVER outputs a diagnosis.
 *
 * Counting is intentionally simple: we only count yesno questions where
 * value === true, and scale-5 questions where value >= 4. Other answer
 * types are tolerated (their `mapsToFeature` is ignored).
 */
export function computeSelfAssessmentResult(
  answers: AmITheOneSession['answers'],
  questions: SelfAssessmentQuestion[],
): SelfAssessmentResult {
  const byId = new Map(questions.map((q) => [q.id, q] as const));

  const countsByKind: SelfAssessmentResult['countsByKind'] = {
    cycle: 0,
    'androgen-clinical': 0,
    metabolic: 0,
    mental: 0,
    fertility: 0,
    history: 0,
  };
  let totalAffirmative = 0;

  for (const a of answers) {
    const q = byId.get(a.questionId);
    if (!q) continue;
    if (countsAsAffirmative(q, a.value)) {
      countsByKind[q.kind] = (countsByKind[q.kind] ?? 0) + 1;
      totalAffirmative += 1;
    }
  }

  const explanationCardIds = uniqueExplanationCards(countsByKind);
  const nextSteps = buildNextSteps(countsByKind, totalAffirmative);

  return {
    pcosFeatureCount: totalAffirmative,
    countsByKind,
    explanationCardIds,
    nextSteps,
    disclaimer: 'self-assessment-not-diagnosis',
  };
}

function countsAsAffirmative(q: SelfAssessmentQuestion, value: unknown): boolean {
  if (q.answerType === 'yesno') {
    return value === true;
  }
  if (q.answerType === 'scale-5') {
    return typeof value === 'number' && value >= 4;
  }
  return false;
}

function uniqueExplanationCards(counts: SelfAssessmentResult['countsByKind']): string[] {
  const ids: string[] = [];
  (Object.keys(counts) as Array<keyof typeof counts>).forEach((kind) => {
    if (counts[kind] > 0) {
      const id = KNOWLEDGE_BY_KIND[kind];
      if (id && !ids.includes(id)) ids.push(id);
    }
  });
  return ids;
}

function buildNextSteps(
  counts: SelfAssessmentResult['countsByKind'],
  total: number,
): SelfAssessmentResult['nextSteps'] {
  const steps: SelfAssessmentResult['nextSteps'] = [];

  if (total >= 2) {
    steps.push({
      kind: 'upload-report',
      reason: '你勾选的特征在 PCOS 报告里常一起出现。上传一份化验单可以让 Cyster 帮你逐项翻译。',
    });
  }
  if (counts.mental > 0) {
    steps.push({
      kind: 'read-stories',
      reason: 'PCOS 患者群体中抑郁/焦虑发生率约为普通人群 3 倍。看看其他人的经历可能会让你不那么孤独。',
    });
    steps.push({
      kind: 'browse-knowledge',
      cardId: 'pcos-and-depression',
      reason: '了解为什么 PCOS 会和情绪问题挂钩——这不是性格缺陷。',
    });
  }
  if (total >= 1) {
    steps.push({
      kind: 'talk-to-doctor',
      reason: '把你勾选的特征带去和医生讨论，Cyster 可以帮你列「下次问什么」清单。',
    });
  }
  if (steps.length === 0) {
    steps.push({
      kind: 'browse-knowledge',
      cardId: 'pcos-2023-criteria',
      reason: '即便目前没有典型特征，了解 PCOS 的诊断标准仍然有用。',
    });
  }
  return steps;
}
