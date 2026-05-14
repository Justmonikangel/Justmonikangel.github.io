import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import storiesSeed from '@/mocks/stories.json';
import type { CommunityStory } from '@/types/stories';

interface StoriesState {
  stories: CommunityStory[];
  /** Local-only "I resonated" markers; not uploaded. */
  resonatedIds: string[];
  toggleResonated: (id: string) => void;
}

export const useStories = create<StoriesState>()(
  persist(
    (set) => ({
      stories: (storiesSeed as CommunityStory[]).filter(
        (s) => s.consentStatus === 'granted-with-name' || s.consentStatus === 'granted-anonymous',
      ),
      resonatedIds: [],
      toggleResonated: (id) =>
        set((state) => ({
          resonatedIds: state.resonatedIds.includes(id)
            ? state.resonatedIds.filter((x) => x !== id)
            : [...state.resonatedIds, id],
        })),
    }),
    {
      name: 'cyster.stories.v1',
      partialize: (state) => ({ resonatedIds: state.resonatedIds }),
    },
  ),
);
