import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { SelfAssessmentQuestion } from '@/types/selfAssessment';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: SelfAssessmentQuestion;
  index: number;
  total: number;
  value: unknown;
  onAnswer: (value: unknown) => void;
}

/**
 * Single-question card used inside SelfAssessmentForm. P1.2 supports the
 * `yesno` answer type fully; other answer types render a placeholder note
 * and leave the value unset until a later phase.
 */
export function QuestionCard({ question, index, total, value, onAnswer }: QuestionCardProps) {
  const [hintOpen, setHintOpen] = useState(false);

  return (
    <Card className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-cy-ink-3">
          第 {index + 1} / {total} 题
        </p>
        <p className="text-xs text-cy-ink-3">{question.kind}</p>
      </div>

      <h3 className="text-lg font-semibold leading-7 text-cy-ink-1">{question.text}</h3>

      {question.hint ? (
        <div>
          <button
            type="button"
            onClick={() => setHintOpen((s) => !s)}
            className="text-xs font-medium text-cy-primary-ink hover:underline"
          >
            {hintOpen ? '隐藏说明' : '为什么问这个？'}
          </button>
          {hintOpen ? (
            <p className="mt-2 text-sm leading-6 text-cy-ink-2">{question.hint}</p>
          ) : null}
        </div>
      ) : null}

      {question.answerType === 'yesno' ? (
        <div className="flex gap-3">
          <Button
            type="button"
            variant={value === true ? 'default' : 'secondary'}
            className="flex-1"
            onClick={() => onAnswer(true)}
          >
            是
          </Button>
          <Button
            type="button"
            variant={value === false ? 'default' : 'secondary'}
            className={cn('flex-1', value === false && 'bg-cy-ink-2 text-white')}
            onClick={() => onAnswer(false)}
          >
            否
          </Button>
        </div>
      ) : (
        <p className="text-sm leading-6 text-cy-ink-3">
          这道题类型（{question.answerType}）的输入控件将在后续 phase 接通。
        </p>
      )}
    </Card>
  );
}
