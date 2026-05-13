import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import therapySeed from '@/mocks/therapy.json';
import type { TherapyPlan } from '@/types/therapy';

interface TherapyState {
  plans: TherapyPlan[];
}

export const useTherapy = create<TherapyState>()(
  persist(
    () => ({
      plans: therapySeed as TherapyPlan[],
    }),
    { name: 'cyster.therapy.v1' },
  ),
);
