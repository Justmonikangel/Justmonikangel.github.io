import { cyclePhase } from '@/lib/cycle';

interface CycleRingProps {
  cycleDay: number;
  cycleAvgDays: number;
  size?: number;
}

const PHASE_COLORS = {
  menstrual: 'var(--cy-danger)',
  follicular: 'var(--cy-primary)',
  ovulatory: 'var(--cy-accent-warm)',
  luteal: 'var(--cy-accent-cool)',
} as const;

const PHASE_LABELS: Record<ReturnType<typeof cyclePhase>, string> = {
  menstrual: '月经期',
  follicular: '卵泡期',
  ovulatory: '排卵窗口附近',
  luteal: '黄体期',
};

/**
 * SVG ring visualizing position within the current cycle.
 *
 * Layout: an outer arc segmented by phase, with a small dot at the current
 * day. Inner numbers show day-of-cycle and total length.
 *
 * Caveat: for irregular PCOS cycles the phase boundaries are approximate.
 * Caller must show a "仅供参考" caption.
 */
export function CycleRing({ cycleDay, cycleAvgDays, size = 220 }: CycleRingProps) {
  const radius = size / 2 - 14;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const safeDay = Math.max(1, Math.min(cycleDay, cycleAvgDays));
  const currentPhase = cyclePhase(safeDay, cycleAvgDays);

  const ovulationDay = Math.max(10, cycleAvgDays - 14);
  const segments: Array<{ phase: ReturnType<typeof cyclePhase>; start: number; end: number }> = [
    { phase: 'menstrual', start: 1, end: 5 },
    { phase: 'follicular', start: 6, end: ovulationDay - 1 },
    { phase: 'ovulatory', start: ovulationDay, end: ovulationDay + 1 },
    { phase: 'luteal', start: ovulationDay + 2, end: cycleAvgDays },
  ];

  const angleFor = (day: number) => ((day - 1) / cycleAvgDays) * 360;

  const markerAngle = angleFor(safeDay) - 90;
  const markerRad = (markerAngle * Math.PI) / 180;
  const markerX = center + radius * Math.cos(markerRad);
  const markerY = center + radius * Math.sin(markerRad);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--cy-line)"
          strokeWidth={10}
        />
        {segments.map((seg) => (
          <Arc
            key={seg.phase}
            center={center}
            radius={radius}
            circumference={circumference}
            startDay={seg.start}
            endDay={seg.end}
            cycleAvgDays={cycleAvgDays}
            color={PHASE_COLORS[seg.phase]}
          />
        ))}
        <circle cx={markerX} cy={markerY} r={8} fill="var(--cy-card)" stroke={PHASE_COLORS[currentPhase]} strokeWidth={3} />
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          fontSize={32}
          fontWeight={600}
          fill="var(--cy-ink-1)"
        >
          D{safeDay}
        </text>
        <text x={center} y={center + 18} textAnchor="middle" fontSize={12} fill="var(--cy-ink-3)">
          / {cycleAvgDays} 天
        </text>
      </svg>
      <div className="space-y-1 text-center">
        <div className="text-sm text-cy-ink-2">
          当前阶段：<span className="font-medium text-cy-ink-1">{PHASE_LABELS[currentPhase]}</span>
        </div>
        <p className="max-w-[260px] text-xs leading-5 text-cy-ink-3">
          PCOS 周期可能波动较大。本估计仅用于自我观察，不用于避孕或备孕决策。
        </p>
      </div>
    </div>
  );
}

function Arc({
  center,
  radius,
  circumference,
  startDay,
  endDay,
  cycleAvgDays,
  color,
}: {
  center: number;
  radius: number;
  circumference: number;
  startDay: number;
  endDay: number;
  cycleAvgDays: number;
  color: string;
}) {
  if (endDay < startDay) return null;
  const segmentLength = ((endDay - startDay + 1) / cycleAvgDays) * circumference;
  const offset = -((startDay - 1) / cycleAvgDays) * circumference;
  return (
    <circle
      cx={center}
      cy={center}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={10}
      strokeDasharray={`${segmentLength} ${circumference}`}
      strokeDashoffset={offset}
      transform={`rotate(-90 ${center} ${center})`}
      strokeLinecap="round"
    />
  );
}
