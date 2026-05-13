import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import userSeed from '@/mocks/user.json';
import type { User } from '@/types/user';

interface UserState {
  profile: User;
  setProfile: (profile: User) => void;
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      profile: userSeed as User,
      setProfile: (profile) => set({ profile }),
    }),
    { name: 'cyster.user.v1' },
  ),
);
