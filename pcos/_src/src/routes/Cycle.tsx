import { CycleHistory } from '@/components/cycle/CycleHistory';
import { CycleRing } from '@/components/cycle/CycleRing';
import { SymptomLog } from '@/components/cycle/SymptomLog';
import { Card } from '@/components/ui/card';
import { cycleDayFromDate, fertileWindow, predictNextCycle } from '@/lib/cycle';
import { useUser } from '@/store/user';

export default function Cycle() {
  const profile = useUser((s) => s.profile);
  const cycleAvgDays = profile.cycleAvgDays ?? 28;

  const day =
    profile.lastPeriodStart !== undefined
      ? cycleDayFromDate(profile.lastPeriodStart)
      : null;

  const fw =
    profile.lastPeriodStart !== undefined
      ? fertileWindow(profile.lastPeriodStart, cycleAvgDays)
      : null;
  const nextStart =
    profile.lastPeriodStart !== undefined
      ? predictNextCycle(profile.lastPeriodStart, cycleAvgDays)
      : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-primary-ink">
          周期追踪
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-cy-ink-1 sm:text-4xl">
          月经 / 排卵 / 症状
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-cy-ink-2">
          PCOS 患者的周期常常不规律，这里的推算仅供参考。Cyster 不替代体温法或排卵试纸，
          也不用于避孕或备孕的精确判断。
        </p>
      </header>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">本月概览</h2>
        {day === null || day < 1 ? (
          <p className="text-sm text-cy-ink-3">
            还没有记录上一次月经开始日。请到 Profile 完善后再来。
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <CycleRing cycleDay={day} cycleAvgDays={cycleAvgDays} />
            <div className="space-y-2 text-sm leading-6 text-cy-ink-2">
              <p>
                <span className="text-cy-ink-3">上次月经：</span>
                <span className="font-mono tabular-nums text-cy-ink-1">
                  {profile.lastPeriodStart}
                </span>
              </p>
              {fw ? (
                <p>
                  <span className="text-cy-ink-3">预计排卵窗：</span>
                  <span className="font-mono tabular-nums text-cy-ink-1">
                    {fw.start} – {fw.end}
                  </span>
                </p>
              ) : null}
              {nextStart ? (
                <p>
                  <span className="text-cy-ink-3">预计下次月经：</span>
                  <span className="font-mono tabular-nums text-cy-ink-1">{nextStart}</span>
                </p>
              ) : null}
              <p className="text-xs text-cy-ink-3">
                仅供参考。PCOS 周期常不规律。
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">今日打卡</h2>
        <SymptomLog />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">近期记录</h2>
        <CycleHistory />
      </Card>
    </div>
  );
}
