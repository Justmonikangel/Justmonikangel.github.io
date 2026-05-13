import type { HormonePanel } from '@/types/report';

export const follicularRanges: Partial<Record<keyof HormonePanel, [number, number]>> = {
  FSH: [3, 10],
  LH: [2, 12],
  E2: [20, 160],
  P: [0.1, 1.5],
};
