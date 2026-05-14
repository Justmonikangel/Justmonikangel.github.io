import { NavLink, useParams } from 'react-router-dom';

import { KnowledgeCard } from '@/components/knowledge/KnowledgeCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getKnowledgeCardBySlug } from '@/lib/knowledge';

export default function KnowledgeDetail() {
  const { slug } = useParams();
  const card = slug ? getKnowledgeCardBySlug(slug) : undefined;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 lg:px-10">
      <div>
        <NavLink to="/knowledge" className="text-xs text-cy-ink-3 hover:text-cy-ink-1">
          ← 返回科普索引
        </NavLink>
      </div>

      {card ? (
        <KnowledgeCard card={card} />
      ) : (
        <Card className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">找不到这张卡片</h2>
          <p className="text-sm leading-6 text-cy-ink-2">
            URL 里的 slug "{slug}" 不在当前 curated 列表中。
          </p>
          <NavLink to="/knowledge">
            <Button type="button">回到索引</Button>
          </NavLink>
        </Card>
      )}
    </div>
  );
}
