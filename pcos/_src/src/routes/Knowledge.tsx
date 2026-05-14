import { NavLink } from 'react-router-dom';

import { LastReviewedBadge } from '@/components/knowledge/LastReviewedBadge';
import { Card } from '@/components/ui/card';
import { listKnowledgeCards } from '@/lib/knowledge';
import type { KnowledgeCard } from '@/types/knowledge';

const CATEGORY_LABELS: Record<KnowledgeCard['category'], string> = {
  criteria: '诊断标准',
  hormone: '激素解读',
  metabolic: '代谢相关',
  mental: '情绪 / 认知',
  lifestyle: '生活方式',
  'medication-info': '药物科普',
  'doctor-visit': '看医生',
  misconception: '常见误解',
};

const CATEGORY_ORDER: KnowledgeCard['category'][] = [
  'criteria',
  'hormone',
  'metabolic',
  'mental',
  'medication-info',
  'lifestyle',
  'doctor-visit',
  'misconception',
];

export default function Knowledge() {
  const cards = listKnowledgeCards();
  const grouped = groupByCategory(cards);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10 lg:px-10">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-primary-ink">
          Cyster 科普卡片
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-cy-ink-1 sm:text-4xl">
          每张卡片都有真文献
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-cy-ink-2">
          这些卡片由 owner 和邀请的医生撰写，AI 仅做润色/翻译/总结。每张卡片至少带一条引用，
          超过 18 个月会被自动标记 "需重审"。
        </p>
      </header>

      {CATEGORY_ORDER.map((category) => {
        const list = grouped[category];
        if (!list || list.length === 0) return null;
        return (
          <section key={category} className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-cy-ink-3">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((card) => (
                <NavLink key={card.id} to={`/knowledge/${card.slug}`}>
                  <Card className="h-full space-y-3 transition-shadow hover:shadow-cyster">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-medium uppercase tracking-[0.22em] text-cy-primary-ink">
                        {CATEGORY_LABELS[card.category]}
                      </span>
                      <LastReviewedBadge lastReviewedAt={card.lastReviewedAt} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold leading-6 tracking-tight text-cy-ink-1">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-cy-ink-2">{card.shortAnswer}</p>
                    </div>
                    <p className="text-xs text-cy-ink-3">
                      {card.citations.length} 条引用 · 阅读 →
                    </p>
                  </Card>
                </NavLink>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function groupByCategory(cards: KnowledgeCard[]) {
  const out: Partial<Record<KnowledgeCard['category'], KnowledgeCard[]>> = {};
  for (const c of cards) {
    out[c.category] = out[c.category] ?? [];
    out[c.category]?.push(c);
  }
  return out;
}
