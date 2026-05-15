import { NavLink } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { bmi } from '@/lib/pcos';
import { cyclePhase, cycleDayFromDate, predictNextCycle } from '@/lib/cycle';
import { useUser } from '@/store/user';
import { useSelfAssessment } from '@/store/selfAssessment';

const STATUS_LABEL: Record<string, string> = {
  'not-explored': '尚未自测',
  'self-suspected': '自测疑似',
  'clinical-suspected': '医生临床疑似',
  'clinically-confirmed': '医生已确认',
};

const GOAL_LABELS: Record<string, string> = {
  understand: '想理解自己',
  'regulate-cycle': '想规律月经',
  fertility: '备孕',
  'metabolic': '改善代谢',
  community: '想找到同伴',
};

const POPULATION_LABEL: Record<string, string> = {
  adult: '成人评估路径',
  adolescent: '青少年评估路径',
  unknown: '尚未指定',
};

export default function Profile() {
  const profile = useUser((s) => s.profile);
  const sessions = useSelfAssessment((s) => s.sessions);

  const completed = sessions.filter((s) => s.completedAt);
  const age = new Date().getFullYear() - profile.birthYear;
  const userBmi =
    profile.heightCm && profile.weightKg ? bmi(profile.heightCm, profile.weightKg) : null;
  const today = new Date();
  const day = profile.lastPeriodStart
    ? cycleDayFromDate(profile.lastPeriodStart, today)
    : null;
  const phase = day !== null && profile.cycleAvgDays
    ? cyclePhase(day, profile.cycleAvgDays)
    : null;
  const nextStart =
    profile.lastPeriodStart && profile.cycleAvgDays
      ? predictNextCycle(profile.lastPeriodStart, profile.cycleAvgDays)
      : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-primary-ink">
          我的
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-cy-ink-1 sm:text-4xl">
          {profile.displayName}
        </h1>
        <p className="text-sm text-cy-ink-3">
          {age} 岁 · {POPULATION_LABEL[profile.population] ?? '未指定'}
        </p>
      </header>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">PCOS 状态</h2>
        <p className="text-sm text-cy-ink-2">
          目前：<span className="font-medium text-cy-ink-1">{STATUS_LABEL[profile.pcosStatus] ?? profile.pcosStatus}</span>
        </p>
        <p className="text-xs text-cy-ink-3">
          这只是你自己的标记，不代表诊断。任何时候都可以通过自测和报告识读重新评估。
        </p>
        <div className="pt-2">
          <NavLink to="/">
            <Button type="button" variant="secondary" size="sm">
              再做一次自测
            </Button>
          </NavLink>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">身体基线</h2>
        <ul className="space-y-1.5 text-sm leading-6 text-cy-ink-2">
          <li>
            身高 / 体重：
            <span className="ml-1 font-mono tabular-nums text-cy-ink-1">
              {profile.heightCm ?? '—'} cm / {profile.weightKg ?? '—'} kg
            </span>
          </li>
          <li>
            BMI：
            <span className="ml-1 font-mono tabular-nums text-cy-ink-1">
              {userBmi !== null ? userBmi.toFixed(1) : '—'}
            </span>
          </li>
          <li>
            平均周期：
            <span className="ml-1 font-mono tabular-nums text-cy-ink-1">
              {profile.cycleAvgDays ?? '—'} 天
            </span>
          </li>
          <li>
            最近月经开始：
            <span className="ml-1 text-cy-ink-1">{profile.lastPeriodStart ?? '—'}</span>
          </li>
          {day !== null && day > 0 ? (
            <li>
              当前周期日：
              <span className="ml-1 font-mono tabular-nums text-cy-ink-1">D{day}</span>
              {phase ? <span className="ml-1 text-cy-ink-3">（{phaseLabel(phase)}）</span> : null}
            </li>
          ) : null}
          {nextStart ? (
            <li>
              预计下次月经：
              <span className="ml-1 text-cy-ink-1">{nextStart}</span>
              <span className="ml-1 text-cy-ink-3">（仅供参考，PCOS 周期常不规律）</span>
            </li>
          ) : null}
        </ul>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">目标</h2>
        {profile.goals.length === 0 ? (
          <p className="text-sm text-cy-ink-3">还没有设置目标。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.goals.map((g) => (
              <span key={g} className="rounded-full bg-cy-bg-2 px-2.5 py-0.5 text-xs text-cy-ink-2">
                {GOAL_LABELS[g] ?? g}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-cy-ink-1">自测历史</h2>
        {completed.length === 0 ? (
          <p className="text-sm text-cy-ink-3">还没有完成过自测。回首页测一次只要 30 秒。</p>
        ) : (
          <ul className="space-y-2 text-sm leading-6 text-cy-ink-2">
            {completed.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-baseline justify-between">
                <span>{s.completedAt?.slice(0, 10)}</span>
                <span className="font-mono tabular-nums text-cy-ink-1">
                  勾了 {s.result?.pcosFeatureCount ?? 0} 条
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <NavLink to="/profile/settings">
          <Button type="button" variant="secondary">
            进入设置
          </Button>
        </NavLink>
      </div>
    </div>
  );
}

function phaseLabel(phase: ReturnType<typeof cyclePhase>): string {
  switch (phase) {
    case 'menstrual':
      return '月经期';
    case 'follicular':
      return '卵泡期';
    case 'ovulatory':
      return '排卵期';
    case 'luteal':
      return '黄体期';
  }
}
