export function predictNextCycle(lastPeriodStart: string, cycleAvgDays: number) {
  const lastStart = new Date(lastPeriodStart);
  const nextStart = new Date(lastStart);
  nextStart.setDate(lastStart.getDate() + cycleAvgDays);
  return nextStart.toISOString().slice(0, 10);
}
