import { Sparkles } from 'lucide-react';

import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const scaffoldModules = [
  'Dashboard',
  'Upload',
  'Report',
  'Therapy',
  'Agent',
  'Community',
  'Doctors',
  'Profile',
];

export default function Dashboard() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
      <header className="flex flex-col gap-6 rounded-[32px] border border-white/60 bg-white/45 p-6 shadow-cyster backdrop-blur-xl lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <Badge
            className="w-fit"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--cy-primary) 12%, white)',
              color: 'var(--cy-primary-ink)',
            }}
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Phase P0 · Scaffold
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-cy-ink-1 sm:text-5xl">Cyster</h1>
            <p className="max-w-2xl text-sm leading-7 text-cy-ink-2 sm:text-base">
              PCOS 智能咨询平台的 Vite + React + TypeScript 基座已经落地。当前 phase
              先交付空壳、主题切换和后续模块的目录骨架，下一 phase 再进入 AppShell 与多路由视图。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start">
          <ThemeToggle />
          <Button type="button" variant="secondary">
            P0 Ready
          </Button>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {scaffoldModules.map((moduleName) => (
          <Card key={moduleName} className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-ink-3">Module</p>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-cy-ink-1">{moduleName}</h2>
              <p className="mt-2 text-sm leading-6 text-cy-ink-2">目录、路由位点和类型边界已预留，细节在后续 phase 逐步填充。</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-ink-3">Acceptance</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">P0 验收点</h2>
          </div>
          <ul className="space-y-3 text-sm leading-6 text-cy-ink-2">
            <li>访问 `/pcos/` 能看到 Cyster 标识。</li>
            <li>主题切换使用 `localStorage` 持久化。</li>
            <li>`pcos/_src/` 与 `pcos/legacy/` 目录按架构文档建好。</li>
          </ul>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-ink-3">Notes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">这次保留的 TODO</h2>
          </div>
          <ul className="space-y-3 text-sm leading-6 text-cy-ink-2">
            <li>P1 再接入完整 AppShell、Rail、Sidebar 与 AgentDock。</li>
            <li>P4 再让 `src/lib/llm/*` 的 provider 真正发起请求。</li>
            <li>P5 再把 OCR 与报告校对流程串起来。</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
