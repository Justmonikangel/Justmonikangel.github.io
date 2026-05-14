import { NavLink } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { SelfAssessmentResult } from '@/types/selfAssessment';

const KIND_LABELS: Record<keyof SelfAssessmentResult['countsByKind'], string> = {
  cycle: '月经周期',
  'androgen-clinical': '雄激素相关',
  metabolic: '代谢相关',
  mental: '情绪 / 认知',
  fertility: '生育',
  history: '既往史',
};

interface ResultPanelProps {
  result: SelfAssessmentResult;
  onRetake: () => void;
}

/**
 * Final screen of the AmITheOne flow.
 *
 * Visual hierarchy:
 *  - Big feature count + soft framing line
 *  - Per-kind breakdown
 *  - Suggested next steps with strong/medium/weak CTAs
 *  - Always-present non-diagnosis disclaimer at the bottom
 */
export function ResultPanel({ result, onRetake }: ResultPanelProps) {
  const totalKinds = (Object.keys(result.countsByKind) as Array<keyof typeof result.countsByKind>)
    .filter((k) => result.countsByKind[k] > 0);

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-cy-ink-3">自测结果</p>
        <h2 className="text-3xl font-semibold tracking-tight text-cy-ink-1">
          你勾选了 <span className="text-cy-primary-ink">{result.pcosFeatureCount}</span> 条
          PCOS 常见特征
        </h2>
        <p className="text-sm leading-7 text-cy-ink-2">
          {result.pcosFeatureCount === 0
            ? '当前你的勾选不指向 PCOS 的典型模式。如果之后出现新的不适，欢迎再回来测一次。'
            : '这不是诊断，只是把你的描述和 PCOS 报告里常见的模式做了一次对照。下面是几个可能对你有帮助的下一步。'}
        </p>
      </Card>

      {totalKinds.length > 0 ? (
        <Card className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-cy-ink-3">维度分布</p>
          <ul className="space-y-2 text-sm leading-6 text-cy-ink-2">
            {totalKinds.map((kind) => (
              <li key={kind} className="flex items-baseline justify-between gap-3">
                <span>{KIND_LABELS[kind]}</span>
                <span className="font-mono tabular-nums text-cy-ink-1">{result.countsByKind[kind]} 条</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-cy-ink-3">下一步可以做的</p>
        <div className="space-y-3">
          {result.nextSteps.map((step, idx) => (
            <NextStepRow key={`${step.kind}-${idx}`} step={step} primary={idx === 0} />
          ))}
        </div>
      </Card>

      <p className="text-xs leading-5 text-cy-ink-3">
        免责声明：以上是自测结果，不是诊断。最终是否为 PCOS、需要做什么检查或治疗，请以医生面诊为准。
        如果出现严重不适（剧烈腹痛、大量出血、胸痛、自杀念头等），请立即拨打 120 或前往最近的急诊。
      </p>

      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={onRetake}>
          再测一次
        </Button>
      </div>
    </div>
  );
}

function NextStepRow({
  step,
  primary,
}: {
  step: SelfAssessmentResult['nextSteps'][number];
  primary: boolean;
}) {
  const { label, to } = stepLink(step);
  return (
    <NavLink
      to={to}
      className="block rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm leading-6 transition-colors hover:bg-white/80"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={primary ? 'font-semibold text-cy-primary-ink' : 'font-medium text-cy-ink-1'}>
          {label}
        </span>
        <span aria-hidden className="text-cy-ink-3">→</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-cy-ink-3">{step.reason}</p>
    </NavLink>
  );
}

function stepLink(step: SelfAssessmentResult['nextSteps'][number]): { label: string; to: string } {
  switch (step.kind) {
    case 'upload-report':
      return { label: '上传化验单，让 Cyster 帮你翻译', to: '/report/upload' };
    case 'read-stories':
      return { label: '读其他姐妹的故事', to: '/stories' };
    case 'talk-to-doctor':
      return { label: '生成「下次看医生该问什么」清单', to: '/care' };
    case 'browse-knowledge':
      return { label: '了解相关科普', to: `/knowledge/${step.cardId}` };
    default:
      return { label: '继续', to: '/' };
  }
}
