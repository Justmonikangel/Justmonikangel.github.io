import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CareNote } from '@/types/care';

interface CareState {
  notes: CareNote[];
  addNote: (note: CareNote) => void;
  updateNote: (id: string, patch: Partial<CareNote>) => void;
  removeNote: (id: string) => void;
}

export const useCare = create<CareState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (note) =>
        set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, patch) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)),
        })),
      removeNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
    }),
    { name: 'cyster.care.v1' },
  ),
);
