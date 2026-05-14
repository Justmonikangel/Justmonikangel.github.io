import { useMemo, useState } from 'react';

import { QuestionCard } from '@/components/amitheone/QuestionCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { computeSelfAssessmentResult } from '@/lib/selfAssessment';
import { useSelfAssessment } from '@/store/selfAssessment';
import type { AmITheOneSession, SelfAssessmentResult } from '@/types/selfAssessment';

interface SelfAssessmentFormProps {
  onComplete: (result: SelfAssessmentResult) => void;
}

/**
 * Drives an AmITheOne session: start (lazily), step through questions,
 * compute result, persist into useSelfAssessment.
 *
 * Visual layout: one question card per step. A simple progress dots row +
 * "上一题 / 下一题" controls. Submission is enabled only when every visible
 * question has an answer.
 */
export function SelfAssessmentForm({ onComplete }: SelfAssessmentFormProps) {
  const questions = useSelfAssessment((s) => s.questions);
  const sessions = useSelfAssessment((s) => s.sessions);
  const activeSessionId = useSelfAssessment((s) => s.activeSessionId);
  const startSession = useSelfAssessment((s) => s.startSession);
  const recordAnswer = useSelfAssessment((s) => s.recordAnswer);
  const completeSession = useSelfAssessment((s) => s.completeSession);

  const [stepIndex, setStepIndex] = useState(0);

  const session: AmITheOneSession | undefined = useMemo(() => {
    return activeSessionId ? sessions.find((s) => s.id === activeSessionId) : undefined;
  }, [activeSessionId, sessions]);

  const handleStart = () => {
    startSession();
    setStepIndex(0);
  };

  if (!session || session.completedAt) {
    return (
      <Card className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-cy-ink-3">「是我吗」自测</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-cy-ink-1">
            30 秒，看看你符合多少条 PCOS 常见特征。
          </h2>
          <p className="mt-2 text-sm leading-6 text-cy-ink-2">
            这是自测，不是诊断。结果只是帮你判断「要不要进一步了解 PCOS / 要不要找医生」。
            所有答案只保存在你的浏览器，不会上传到任何地方。
          </p>
        </div>
        <Button type="button" onClick={handleStart}>
          开始 7 道题
        </Button>
      </Card>
    );
  }

  const total = questions.length;
  const current = questions[stepIndex];
  const answerForCurrent = session.answers.find((a) => a.questionId === current.id)?.value;
  const isLast = stepIndex >= total - 1;
  const allAnswered = questions.every((q) => session.answers.some((a) => a.questionId === q.id));

  const handleAnswer = (value: unknown) => {
    recordAnswer(session.id, current.id, value);
  };

  const handleNext = () => {
    if (stepIndex < total - 1) setStepIndex((s) => s + 1);
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex((s) => s - 1);
  };

  const handleSubmit = () => {
    const result = computeSelfAssessmentResult(session.answers, questions);
    completeSession(session.id, result);
    onComplete(result);
  };

  return (
    <div className="space-y-5">
      <QuestionCard
        question={current}
        index={stepIndex}
        total={total}
        value={answerForCurrent}
        onAnswer={handleAnswer}
      />

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" disabled={stepIndex === 0} onClick={handlePrev}>
          上一题
        </Button>

        <div className="flex items-center gap-1.5">
          {questions.map((q, idx) => {
            const answered = session.answers.some((a) => a.questionId === q.id);
            const isCurrent = idx === stepIndex;
            return (
              <span
                key={q.id}
                className={`block h-1.5 w-4 rounded-full ${
                  isCurrent ? 'bg-cy-primary' : answered ? 'bg-cy-ink-2/60' : 'bg-cy-line'
                }`}
              />
            );
          })}
        </div>

        {isLast ? (
          <Button type="button" disabled={!allAnswered} onClick={handleSubmit}>
            看结果
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled={answerForCurrent === undefined} onClick={handleNext}>
            下一题
          </Button>
        )}
      </div>
    </div>
  );
}
