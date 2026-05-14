import { searchKnowledgeCards } from '@/lib/knowledge';

/**
 * Tool wrapper: substring + category search over curated KnowledgeCard
 * registry. Agent gets short stable references it can quote with citations.
 */
export function searchKnowledge(query: string) {
  return searchKnowledgeCards(query).map((card) => ({
    id: card.id,
    slug: card.slug,
    title: card.title,
    shortAnswer: card.shortAnswer,
    category: card.category,
    citations: card.citations,
    lastReviewedAt: card.lastReviewedAt,
  }));
}
