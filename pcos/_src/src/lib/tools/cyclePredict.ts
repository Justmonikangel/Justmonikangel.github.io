import { predictNextCycle } from '@/lib/cycle';

export function cyclePredict(lastPeriodStart: string, cycleAvgDays: number) {
  return predictNextCycle(lastPeriodStart, cycleAvgDays);
}
