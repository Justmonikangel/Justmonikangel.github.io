import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SymptomEntry {
  date: string; // YYYY-MM-DD
  mood?: 1 | 2 | 3 | 4 | 5;
  acne?: boolean;
  cramps?: boolean;
  flow?: 'spotting' | 'light' | 'medium' | 'heavy';
  sleepHours?: number;
  note?: string;
}

interface CycleState {
  symptomLog: Record<string, SymptomEntry>;
  upsertEntry: (entry: SymptomEntry) => void;
  removeEntry: (date: string) => void;
}

export const useCycle = create<CycleState>()(
  persist(
    (set) => ({
      symptomLog: {},
      upsertEntry: (entry) =>
        set((state) => ({
          symptomLog: { ...state.symptomLog, [entry.date]: entry },
        })),
      removeEntry: (date) =>
        set((state) => {
          const next = { ...state.symptomLog };
          delete next[date];
          return { symptomLog: next };
        }),
    }),
    { name: 'cyster.cycle.v1' },
  ),
);
