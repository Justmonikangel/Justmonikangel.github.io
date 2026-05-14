import dayjs from 'dayjs';

import { cn } from '@/lib/utils';

interface LastReviewedBadgeProps {
  lastReviewedAt: string;
  /** Days after which a card is flagged "needs review". Default 540 (≈18 months). */
  staleAfterDays?: number;
}

/**
 * Visual badge showing when a KnowledgeCard was last reviewed and whether
 * it has gone stale per Content Governance K-2 (>= 18 months -> "needs review").
 */
export function LastReviewedBadge({ lastReviewedAt, staleAfterDays = 540 }: LastReviewedBadgeProps) {
  const reviewedAt = dayjs(lastReviewedAt);
  const ageDays = dayjs().diff(reviewedAt, 'day');
  const isStale = ageDays > staleAfterDays;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        isStale ? 'bg-cy-warn/15 text-cy-warn' : 'bg-cy-bg-3 text-cy-ink-3',
      )}
    >
      {isStale ? '需重审' : `已审 ${reviewedAt.format('YYYY-MM')}`}
    </span>
  );
}
