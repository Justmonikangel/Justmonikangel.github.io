import knowledgeSeed from '@/mocks/knowledgeCards.json';
import type { KnowledgeCard } from '@/types/knowledge';

/**
 * KnowledgeCard registry.
 *
 * P1: seeded from mocks/knowledgeCards.json. P1.5 adds local full-text
 * search; P2 swaps in RAG against PMC OA + open guidelines.
 */
const REGISTRY: KnowledgeCard[] = knowledgeSeed as KnowledgeCard[];
const BY_SLUG = new Map(REGISTRY.map((c) => [c.slug, c] as const));
const BY_ID = new Map(REGISTRY.map((c) => [c.id, c] as const));

export function listKnowledgeCards(): KnowledgeCard[] {
  return REGISTRY;
}

export function getKnowledgeCardBySlug(slug: string): KnowledgeCard | undefined {
  return BY_SLUG.get(slug);
}

export function getKnowledgeCardById(id: string): KnowledgeCard | undefined {
  return BY_ID.get(id);
}

export function listKnowledgeCardsByCategory(category: KnowledgeCard['category']): KnowledgeCard[] {
  return REGISTRY.filter((c) => c.category === category);
}

/**
 * Simple substring search for now. Returns matched cards with naive scoring
 * (title hit > shortAnswer hit > body hit).
 */
export function searchKnowledgeCards(query: string): KnowledgeCard[] {
  if (!query) return REGISTRY;
  const q = query.toLowerCase();
  return REGISTRY
    .map((card) => {
      let score = 0;
      if (card.title.toLowerCase().includes(q)) score += 3;
      if (card.shortAnswer.toLowerCase().includes(q)) score += 2;
      if (card.body.toLowerCase().includes(q)) score += 1;
      return { card, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.card);
}

/**
 * Cards last reviewed more than `staleAfterDays` ago. Default 540 days
 * (≈18 months) per Content Governance K-2.
 */
export function listStaleCards(staleAfterDays = 540): KnowledgeCard[] {
  const cutoff = Date.now() - staleAfterDays * 24 * 60 * 60 * 1000;
  return REGISTRY.filter((c) => new Date(c.lastReviewedAt).getTime() < cutoff);
}
