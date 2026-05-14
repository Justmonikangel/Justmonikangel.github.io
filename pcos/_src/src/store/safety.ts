import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { SafetyEvent } from '@/types/safety';

interface SafetyState {
  events: SafetyEvent[];
  pushEvent: (event: SafetyEvent) => void;
  clear: () => void;
}

/**
 * Local-only safety event log. Never uploaded. Used to render history in
 * Settings and to debug red-flag detector behavior.
 */
export const useSafety = create<SafetyState>()(
  persist(
    (set) => ({
      events: [],
      pushEvent: (event) =>
        set((state) => ({ events: [event, ...state.events].slice(0, 50) })),
      clear: () => set({ events: [] }),
    }),
    {
      name: 'cyster.safety.v1',
    },
  ),
);
