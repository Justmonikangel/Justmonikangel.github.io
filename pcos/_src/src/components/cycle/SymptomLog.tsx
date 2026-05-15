import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCycle, type SymptomEntry } from '@/store/cycle';

const FLOW_OPTIONS: Array<{ value: SymptomEntry['flow']; label: string }> = [
  { value: undefined, label: '无' },
  { value: 'spotting', label: '点滴' },
  { value: 'light', label: '少' },
  { value: 'medium', label: '中' },
  { value: 'heavy', label: '多' },
];

/**
 * Minimal day-by-day symptom log. P1 records mood / acne / cramps / flow /
 * sleep into useCycle.symptomLog. UI polish + chart visualizations are P1.8.
 */
export function SymptomLog() {
  const today = new Date().toISOString().slice(0, 10);
  const existing = useCycle((s) => s.symptomLog[today]);
  const upsertEntry = useCycle((s) => s.upsertEntry);

  const [mood, setMood] = useState<SymptomEntry['mood']>(existing?.mood);
  const [acne, setAcne] = useState<boolean>(existing?.acne ?? false);
  const [cramps, setCramps] = useState<boolean>(existing?.cramps ?? false);
  const [flow, setFlow] = useState<SymptomEntry['flow']>(existing?.flow);
  const [sleepHours, setSleepHours] = useState<string>(
    existing?.sleepHours !== undefined ? String(existing.sleepHours) : '',
  );
  const [note, setNote] = useState<string>(existing?.note ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const sleepValue = sleepHours.trim() ? Number(sleepHours) : undefined;
    upsertEntry({
      date: today,
      mood,
      acne,
      cramps,
      flow,
      sleepHours: sleepValue !== undefined && !Number.isNaN(sleepValue) ? sleepValue : undefined,
      note: note.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-cy-ink-3">今天 {today}</p>

      <div>
        <p className="text-sm text-cy-ink-2">心情</p>
        <div className="mt-1 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant={mood === n ? 'default' : 'secondary'}
              onClick={() => setMood(n as SymptomEntry['mood'])}
            >
              {n}
            </Button>
          ))}
        </div>
        <p className="mt-1 text-xs text-cy-ink-3">1 很差 → 5 很好</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={cramps ? 'default' : 'secondary'}
          onClick={() => setCramps((c) => !c)}
        >
          {cramps ? '✓ 痛经' : '痛经'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={acne ? 'default' : 'secondary'}
          onClick={() => setAcne((a) => !a)}
        >
          {acne ? '✓ 痤疮' : '痤疮'}
        </Button>
      </div>

      <div>
        <p className="text-sm text-cy-ink-2">出血量</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {FLOW_OPTIONS.map((opt) => (
            <Button
              key={opt.label}
              type="button"
              size="sm"
              variant={flow === opt.value ? 'default' : 'secondary'}
              onClick={() => setFlow(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <label className="block text-sm">
        <span className="text-cy-ink-2">睡眠（小时）</span>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          max={24}
          value={sleepHours}
          onChange={(e) => setSleepHours(e.target.value)}
          placeholder="例如 7.5"
          className="mt-1"
        />
      </label>

      <label className="block text-sm">
        <span className="text-cy-ink-2">备注（可选）</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="任何你想记下的"
          className="mt-1 block w-full rounded-2xl border border-cy-line bg-white/80 px-3 py-2 text-sm text-cy-ink-1 outline-none focus-visible:ring-2 focus-visible:ring-cy-primary"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave}>
          保存今天
        </Button>
        {saved ? <span className="text-xs" style={{ color: 'var(--cy-success)' }}>已保存</span> : null}
      </div>
    </div>
  );
}
