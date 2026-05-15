import { ShieldCheck } from 'lucide-react';

import type { CommunityStory } from '@/types/stories';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<CommunityStory['consentStatus'], string> = {
  'granted-with-name': '已实名授权',
  'granted-anonymous': '已匿名授权',
  pending: '待授权',
  withdrawn: '已撤回',
};

const LEVEL_LABELS: Record<CommunityStory['anonymizationLevel'], string> = {
  none: '未脱敏',
  light: '轻度脱敏',
  full: '完全脱敏',
};

interface ConsentNoticeProps {
  story: Pick<
    CommunityStory,
    'consentStatus' | 'anonymous' | 'anonymizationLevel' | 'aiAssisted' | 'aiAssistKind' | 'withdrawable'
  >;
  variant?: 'badge' | 'block';
}

/**
 * Visual marker for consent + anonymization metadata. UI hard rule:
 * stories with consentStatus !== 'granted-*' must never reach this
 * component (they're filtered out in useStories), so we treat any other
 * status as a data bug and call it out.
 */
export function ConsentNotice({ story, variant = 'badge' }: ConsentNoticeProps) {
  const isGranted = story.consentStatus.startsWith('granted');

  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-cy-bg-3 px-2.5 py-0.5 text-xs font-medium text-cy-ink-3',
          !isGranted && 'bg-cy-warn/15 text-cy-warn',
        )}
      >
        <ShieldCheck className="h-3 w-3" />
        {STATUS_LABELS[story.consentStatus]}
      </span>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-cy-line/60 bg-white/50 p-4 text-xs leading-5 text-cy-ink-3">
      <p className="flex items-center gap-2 text-cy-ink-2">
        <ShieldCheck className="h-4 w-4" style={{ color: 'var(--cy-success)' }} />
        <span className="font-medium">{STATUS_LABELS[story.consentStatus]}</span>
        <span>·</span>
        <span>{LEVEL_LABELS[story.anonymizationLevel]}</span>
      </p>
      <p>
        作者保留撤回权。如果你希望下架自己的故事，写信给我们即可——通常 48 小时内处理。
      </p>
      {story.aiAssisted ? (
        <p>
          AI 协助内容：{story.aiAssistKind?.join(' / ') ?? '未细分'}。Cyster 不允许 AI 生成虚构患者故事，
          这里 AI 只做润色、脱敏、结构化或翻译。
        </p>
      ) : (
        <p>这篇故事全人工撰写，未经 AI 协助。</p>
      )}
    </div>
  );
}
