import { useState } from 'react';

import { ResultPanel } from '@/components/amitheone/ResultPanel';
import { SelfAssessmentForm } from '@/components/amitheone/SelfAssessmentForm';
import { useSelfAssessment } from '@/store/selfAssessment';
import type { SelfAssessmentResult } from '@/types/selfAssessment';

export default function AmITheOne() {
  const [submittedResult, setSubmittedResult] = useState<SelfAssessmentResult | null>(null);
  const startSession = useSelfAssessment((s) => s.startSession);
  const activeSessionId = useSelfAssessment((s) => s.activeSessionId);

  const handleRetake = () => {
    setSubmittedResult(null);
    startSession();
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10 lg:px-10">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-primary-ink">
          Cyster · PCOS 觉知
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-cy-ink-1 sm:text-4xl">
          你最近的「不对劲」，可能不是你的问题——可能是 PCOS。
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-cy-ink-2 sm:text-base">
          多囊卵巢综合征（PCOS）在国内被严重低估。月经不规律、痤疮、体重难降、情绪问题——
          这些感受经常被归因于「懒、贪吃、心理脆弱」，但 PCOS 患者群体里它们常一起出现。
          这是一个 30 秒的自测，帮你判断要不要进一步了解。
        </p>
      </header>

      {submittedResult ? (
        <ResultPanel result={submittedResult} onRetake={handleRetake} />
      ) : (
        <SelfAssessmentForm onComplete={setSubmittedResult} key={activeSessionId ?? 'idle'} />
      )}
    </div>
  );
}
