import { useCycle } from '@/store/cycle';

/**
 * Compact list view of recent symptom log dates. Detailed history graph is
 * deferred to P1.8 polish; this just confirms the store is wired.
 */
export function CycleHistory() {
  const log = useCycle((s) => s.symptomLog);
  const entries = Object.values(log).sort((a, b) => b.date.localeCompare(a.date));

  if (entries.length === 0) {
    return (
      <p className="text-sm text-cy-ink-3">
        还没有打卡记录。在下方记录一下今天的感觉，会显示在这里。
      </p>
    );
  }

  return (
    <ul className="space-y-1.5 text-sm leading-6 text-cy-ink-2">
      {entries.slice(0, 14).map((e) => (
        <li key={e.date} className="flex items-baseline justify-between gap-3">
          <span className="font-mono tabular-nums text-cy-ink-1">{e.date}</span>
          <span className="text-cy-ink-3">
            {[
              e.mood ? `心情 ${e.mood}/5` : null,
              e.cramps ? '痛经' : null,
              e.acne ? '痤疮' : null,
              e.flow ? flowLabel(e.flow) : null,
              e.sleepHours !== undefined ? `睡眠 ${e.sleepHours}h` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </li>
      ))}
    </ul>
  );
}

function flowLabel(flow: NonNullable<ReturnType<typeof useCycle.getState>['symptomLog'][string]['flow']>) {
  switch (flow) {
    case 'spotting':
      return '点滴出血';
    case 'light':
      return '量少';
    case 'medium':
      return '量中';
    case 'heavy':
      return '量多';
  }
}
