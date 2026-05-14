import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import knowledgeSeed from '@/mocks/knowledgeCards.json';
import type { KnowledgeCard } from '@/types/knowledge';

interface KnowledgeState {
  cards: KnowledgeCard[];
}

export const useKnowledge = create<KnowledgeState>()(
  persist(
    () => ({
      cards: knowledgeSeed as KnowledgeCard[],
    }),
    {
      name: 'cyster.knowledge.v1',
      partialize: () => ({}),
    },
  ),
);
