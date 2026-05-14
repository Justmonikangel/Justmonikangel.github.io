import { ExternalLink } from 'lucide-react';

import { citationHref, formatCitation } from '@/lib/citations';
import type { Citation } from '@/types/common';

interface CitationListProps {
  citations: Citation[];
}

/**
 * Renders Citation[] as a labeled list. Per Content Governance K-1 there
 * must always be at least one citation; if the array is empty we show a
 * note (this should never happen in production and indicates a data bug).
 */
export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return (
      <p className="text-xs italic text-cy-warn">
        这张卡片缺少引用 — Content Governance K-1 要求每张卡片至少有一条文献。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-cy-ink-3">引用</p>
      <ul className="space-y-1.5">
        {citations.map((c) => {
          const href = citationHref(c);
          const label = formatCitation(c);
          return (
            <li key={c.id} className="cy-citation flex items-baseline gap-2">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-baseline gap-1 hover:underline"
                >
                  <span>{label}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span>{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
