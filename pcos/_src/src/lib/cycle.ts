import dayjs from 'dayjs';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

/**
 * Predict the start date of the next cycle.
 *
 * For irregular PCOS cycles this is at best a rough approximation; UI must
 * label the output as estimate-only.
 */
export function predictNextCycle(lastPeriodStart: string, cycleAvgDays: number): string {
  return dayjs(lastPeriodStart).add(cycleAvgDays, 'day').format('YYYY-MM-DD');
}

/**
 * Map a cycle day (day 1 = first day of period) to a phase label.
 *
 * Boundaries assume a typical 28-day cycle. For longer cycles we anchor the
 * luteal phase to ~14 days and scale the follicular phase up.
 *
 * For irregular PCOS cycles, treat the result as approximate only.
 */
export function cyclePhase(cycleDay: number, cycleAvgDays = 28): CyclePhase {
  if (cycleDay < 1) {
    return 'menstrual';
  }
  const ovulationDay = Math.max(10, cycleAvgDays - 14);
  if (cycleDay <= 5) return 'menstrual';
  if (cycleDay < ovulationDay) return 'follicular';
  if (cycleDay <= ovulationDay + 1) return 'ovulatory';
  return 'luteal';
}

/**
 * Estimated fertile window for a single cycle starting at lastPeriodStart.
 *
 * Returns ISO date strings [start, end] inclusive. Five-day pre-ovulation
 * window plus the ovulation day, anchored to (cycleAvgDays - 14).
 */
export function fertileWindow(lastPeriodStart: string, cycleAvgDays = 28) {
  const ovulationDay = Math.max(10, cycleAvgDays - 14);
  const start = dayjs(lastPeriodStart).add(ovulationDay - 5, 'day');
  const end = dayjs(lastPeriodStart).add(ovulationDay + 1, 'day');
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
  };
}

/**
 * Compute cycle day from lastPeriodStart and an optional target date.
 *
 * Day 1 is the first day of period. Returns 1 when target == lastPeriodStart.
 */
export function cycleDayFromDate(lastPeriodStart: string, target: Date | string = new Date()) {
  const start = dayjs(lastPeriodStart);
  const diff = dayjs(target).diff(start, 'day');
  return diff + 1;
}
