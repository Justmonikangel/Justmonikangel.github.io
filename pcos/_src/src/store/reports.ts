import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import reportsSeed from '@/mocks/reports.json';
import type { Report } from '@/types/report';

interface ReportsState {
  list: Report[];
  selectedId: string | null;
  addReport: (report: Report) => void;
  updateReport: (id: string, patch: Partial<Report>) => void;
  removeReport: (id: string) => void;
  select: (id: string | null) => void;
}

export const useReports = create<ReportsState>()(
  persist(
    (set) => ({
      list: reportsSeed as Report[],
      selectedId: null,
      addReport: (report) => set((state) => ({ list: [report, ...state.list] })),
      updateReport: (id, patch) =>
        set((state) => ({
          list: state.list.map((report) => (report.id === id ? { ...report, ...patch } : report)),
        })),
      removeReport: (id) => set((state) => ({ list: state.list.filter((report) => report.id !== id) })),
      select: (selectedId) => set({ selectedId }),
    }),
    { name: 'cyster.reports.v1' },
  ),
);
