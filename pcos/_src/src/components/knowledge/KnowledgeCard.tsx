import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { CitationList } from '@/components/knowledge/CitationList';
import { LastReviewedBadge } from '@/components/knowledge/LastReviewedBadge';
import { Card } from '@/components/ui/card';
import type { KnowledgeCard as KnowledgeCardModel } from '@/types/knowledge';

interface KnowledgeCardProps {
  card: KnowledgeCardModel;
}

/**
 * Full KnowledgeCard view. Header includes category, title, lastReviewed
 * badge; body renders markdown; footer shows citations and aiAssist
 * disclosure (Content Governance K-3 transparency).
 */
export function KnowledgeCard({ card }: KnowledgeCardProps) {
  return (
    <Card className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-cy-primary-ink">
            {card.category}
          </span>
          <LastReviewedBadge lastReviewedAt={card.lastReviewedAt} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-cy-ink-1 sm:text-3xl">
          {card.title}
        </h1>
        <p className="text-sm leading-7 text-cy-ink-2">{card.shortAnswer}</p>
      </header>

      <div className="prose-cyster space-y-3 text-sm leading-7 text-cy-ink-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.body}</ReactMarkdown>
      </div>

      <CitationList citations={card.citations} />

      <footer className="space-y-1 border-t border-cy-line/60 pt-4 text-xs leading-5 text-cy-ink-3">
        <p>
          适用人群：{card.applicablePopulation.map((p) => (p === 'adult' ? '成人' : '青少年')).join(' / ')}
        </p>
        {card.aiAssisted ? (
          <p>
            AI 协助：{card.aiAssistKind?.join(' / ') ?? '未细分'}（正文由人撰写，AI 只做{card.aiAssistKind?.join('、')}）。
          </p>
        ) : (
          <p>AI 协助：无（全人工撰写）。</p>
        )}
        <p>
          这张卡片不构成医学建议。涉及个人治疗决定，请和医生讨论。
        </p>
      </footer>
    </Card>
  );
}
