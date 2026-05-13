import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import communitySeed from '@/mocks/community.json';
import type { CommunityPost } from '@/types/community';

interface CommunityState {
  posts: CommunityPost[];
}

export const useCommunity = create<CommunityState>()(
  persist(
    () => ({
      posts: communitySeed as CommunityPost[],
    }),
    { name: 'cyster.community.v1' },
  ),
);
