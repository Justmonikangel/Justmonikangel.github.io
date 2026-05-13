# Cyster Frontend Architecture

> 给 codex 实现的前端架构规范。读完即可开始 scaffold。
> 任何与本文档冲突的"自由发挥"必须先停下来回到这里对齐。

## 0. TL;DR

- 在 `pcos/` 子路径下提供一个独立 SPA：**Cyster · PCOS 智能咨询平台**
- 栈：**React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Zustand + React Router (hash mode) + TanStack Query**
- LLM：**Anthropic Claude Sonnet 4.6 优先**，统一抽象层支持 OpenAI / 通义 / 文心 / DeepSeek 适配器
- 部署：**GitHub Pages**，Vite `base: '/pcos/'`，构建产物写入 `pcos/`（覆盖现有静态 Cyster）
- 现有 `pcos/index.html`、`pcos/css/`、`pcos/js/` 整体替换；先把它们备份到 `pcos/legacy/` 作为视觉与逻辑参考
- 数据：Phase 1 纯 mock + localStorage；Phase 2 接真后端，由 `src/lib/api.ts` 统一切换
- Phase 1 验收：路由打通 / Dashboard 展示 / Agent 可对话 / Upload 解析一份化验单 / Report 显示一次解读

---

## 1. 目标与非目标

### 1.1 目标（Phase 1，4–6 周）
- 把现有 vanilla Cyster 的视觉与交互（Discord 风 rail + sidebar + view + 悬浮 agent dock）用现代栈重建
- 通过 Anthropic Claude API 提供：报告 OCR 结构化、报告解读对话、个性化方案生成
- 完整 8 个模块的骨架与可点击交互：Dashboard / Upload / Report / Therapy / Agent / Community / Doctors / Profile
- 全程类型安全，所有跨模块数据流走 TypeScript 类型 + Zod 校验
- 在 GitHub Pages 上无后端可独立跑（用户自带 LLM key 模式）

### 1.2 非目标（Phase 2+ 再说）
- 真正的后端、用户系统、支付
- NMPA 医疗器械合规化（这是商业化阶段的事）
- 真实医生入驻与认证
- 服务器侧 OCR / RAG / 向量库

---

## 2. 技术选型

| 层 | 选型 | 版本下限 | 理由 |
|---|---|---|---|
| Framework | React | 18.3+ | Suspense / streaming 友好 |
| Build | Vite | 5.4+ | 启动快、ESM 原生、`base` 配置好 |
| Language | TypeScript | 5.5+ | 严格模式，所有 lib 必须 typed |
| Style | Tailwind CSS | 3.4+ | 配 CSS variables 做主题 |
| UI primitives | shadcn/ui | latest | 抄到 `src/components/ui/`，可改 |
| Icons | lucide-react | latest | 替代手写 SVG |
| Router | react-router-dom | 6.26+ | **HashRouter**（GitHub Pages 兼容） |
| State | Zustand | 4.5+ | 轻量，每个 domain 一个 store |
| Server state | @tanstack/react-query | 5.x | 缓存 + 重试，未来接真 API 时无痛 |
| Forms | react-hook-form + zod | 7.x / 3.x | 类型安全表单 |
| Charts | recharts | 2.x | 激素曲线、BMI 趋势、雷达图 |
| Markdown | react-markdown + remark-gfm | latest | 渲染 agent 输出 |
| Date | dayjs | latest | 比 moment 轻 |
| LLM SDK | `@anthropic-ai/sdk`（浏览器模式） | latest | 主 provider |
| 兼容 LLM | `openai`、`@dashscope/dashscope-sdk` 等 | — | 适配器层 |
| Test | vitest + @testing-library/react | latest | 单元 + 组件 |
| Lint | eslint + prettier + typescript-eslint | latest | strict |

不引入：Redux、MobX、Emotion、styled-components、CSS-in-JS。

---

## 3. 仓库结构

```
pcos/                                # SPA 根（最终交付路径）
├── ARCHITECTURE.md                  # 本文档
├── legacy/                          # 旧 vanilla 实现，只读参考
│   ├── index.html
│   ├── css/pcos.css
│   └── js/{app,data,agent,charts}.js
├── index.html                       # Vite 构建产物（提交时一并 commit）
├── assets/                          # Vite 构建产物
└── _src/                            # 源码（前置下划线避开 Jekyll 处理）
    ├── package.json
    ├── pnpm-lock.yaml
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── .eslintrc.cjs
    ├── .prettierrc
    ├── index.html                   # 源码入口（Vite 会改写）
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── router.tsx
        ├── routes/
        │   ├── Dashboard.tsx
        │   ├── Upload.tsx
        │   ├── Report.tsx
        │   ├── ReportDetail.tsx
        │   ├── Therapy.tsx
        │   ├── Agent.tsx
        │   ├── Community.tsx
        │   ├── PostDetail.tsx
        │   ├── Doctors.tsx
        │   ├── DoctorDetail.tsx
        │   └── Profile.tsx
        ├── components/
        │   ├── layout/
        │   │   ├── AppShell.tsx
        │   │   ├── Rail.tsx
        │   │   ├── Sidebar.tsx
        │   │   ├── SidebarPresets.tsx     # 每个 route 一套
        │   │   ├── AgentDock.tsx
        │   │   └── AgentPanel.tsx
        │   ├── ui/                         # shadcn 组件
        │   │   ├── button.tsx
        │   │   ├── card.tsx
        │   │   ├── dialog.tsx
        │   │   ├── sheet.tsx
        │   │   ├── input.tsx
        │   │   ├── textarea.tsx
        │   │   ├── badge.tsx
        │   │   ├── avatar.tsx
        │   │   ├── tabs.tsx
        │   │   ├── tooltip.tsx
        │   │   ├── toast.tsx
        │   │   └── ...
        │   ├── dashboard/
        │   │   ├── CycleRing.tsx
        │   │   ├── HormoneRadar.tsx
        │   │   ├── ActivityHeatmap.tsx     # 1 年活跃热力图
        │   │   ├── TodayCard.tsx
        │   │   └── QuickActions.tsx
        │   ├── upload/
        │   │   ├── Dropzone.tsx
        │   │   ├── OcrProgress.tsx
        │   │   ├── OcrPreview.tsx          # 把 LLM 结构化结果给用户校对
        │   │   └── ManualEntryForm.tsx
        │   ├── report/
        │   │   ├── ReportCard.tsx
        │   │   ├── HormonePanel.tsx
        │   │   ├── UltrasoundCard.tsx
        │   │   ├── MetabolicCard.tsx
        │   │   ├── DiagnosisCriteria.tsx   # Rotterdam 三选二可视化
        │   │   ├── TrendChart.tsx
        │   │   └── ReportTimeline.tsx
        │   ├── therapy/
        │   │   ├── PlanOverview.tsx
        │   │   ├── MedicationTracker.tsx
        │   │   ├── LifestyleCard.tsx
        │   │   ├── MealPlan.tsx
        │   │   ├── WorkoutPlan.tsx
        │   │   └── FollowUpReminder.tsx
        │   ├── community/
        │   │   ├── PostList.tsx
        │   │   ├── PostCard.tsx
        │   │   ├── PostComposer.tsx
        │   │   └── CommentThread.tsx
        │   ├── doctors/
        │   │   ├── DoctorList.tsx
        │   │   ├── DoctorCard.tsx
        │   │   └── ReferralButton.tsx
        │   ├── agent/
        │   │   ├── ChatStream.tsx
        │   │   ├── MessageBubble.tsx
        │   │   ├── ToolCallView.tsx
        │   │   ├── PromptChips.tsx
        │   │   └── ContextDrawer.tsx       # 显示注入到 system prompt 的用户上下文
        │   └── common/
        │       ├── ThemeToggle.tsx
        │       ├── CycleDayBadge.tsx
        │       ├── EmptyState.tsx
        │       ├── ErrorBoundary.tsx
        │       └── LoadingSpinner.tsx
        ├── store/
        │   ├── user.ts
        │   ├── reports.ts
        │   ├── therapy.ts
        │   ├── community.ts
        │   ├── doctors.ts
        │   ├── agent.ts
        │   └── ui.ts                       # theme, panel open, sidebar collapsed
        ├── lib/
        │   ├── llm/
        │   │   ├── index.ts                # createLlmClient(provider)
        │   │   ├── types.ts                # ChatMessage, ToolDef, ToolCall ...
        │   │   ├── anthropic.ts            # 默认 provider
        │   │   ├── openai.ts
        │   │   ├── qwen.ts
        │   │   ├── wenxin.ts
        │   │   ├── deepseek.ts
        │   │   └── prompts/
        │   │       ├── system.ts           # 主 system prompt
        │   │       ├── ocr.ts              # OCR 提示
        │   │       ├── report.ts
        │   │       └── therapy.ts
        │   ├── tools/                      # Agent 可调用的"本地"工具
        │   │   ├── index.ts                # tool registry
        │   │   ├── parseReport.ts
        │   │   ├── computeHomaIR.ts
        │   │   ├── computeBMI.ts
        │   │   ├── cyclePredict.ts
        │   │   ├── rotterdamCheck.ts
        │   │   ├── lookupDrug.ts
        │   │   └── searchCommunity.ts
        │   ├── pcos.ts                     # 业务核心：诊断/分型/分级
        │   ├── hormones.ts                 # 激素正常区间 by phase
        │   ├── cycle.ts                    # 周期推算
        │   ├── ocr.ts                      # OCR 入口（调 LLM vision）
        │   ├── api.ts                      # 抽象 fetch（mock / real）
        │   ├── storage.ts                  # localStorage 封装
        │   ├── crypto.ts                   # API key 简单 obfuscate
        │   └── utils.ts
        ├── types/
        │   ├── user.ts
        │   ├── report.ts
        │   ├── therapy.ts
        │   ├── community.ts
        │   ├── doctor.ts
        │   └── agent.ts
        ├── mocks/
        │   ├── user.json
        │   ├── reports.json
        │   ├── therapy.json
        │   ├── community.json
        │   └── doctors.json
        ├── styles/
        │   ├── globals.css                 # Tailwind + base reset
        │   └── tokens.css                  # CSS variables (light/dark)
        └── test/
            ├── pcos.test.ts
            ├── hormones.test.ts
            └── agent.test.ts
```

> Vite 的 `build.outDir` 指向 `../` 的 `index.html / assets/`，让构建产物直接落在 `pcos/` 根，GitHub Pages 立即可见。
> `_src/` 前缀下划线让 Jekyll 默认忽略；在 `_config.yml` 的 `exclude` 里也补一条 `pcos/_src` 双保险（codex 实施时一并改）。

---

## 4. 设计系统

### 4.1 颜色 token（从现有 Cyster 继承）

```css
/* src/styles/tokens.css */
:root {
  --cy-bg-1: #ffe7ee;
  --cy-bg-2: #fff5e6;
  --cy-bg-3: #e6f6f4;
  --cy-primary: #ff6b8a;     /* 主粉 */
  --cy-primary-ink: #c64166;
  --cy-accent-warm: #ffa86b;
  --cy-accent-cool: #6bd5c2;
  --cy-ink-1: #1f1d2c;
  --cy-ink-2: #4a4860;
  --cy-ink-3: #8c8aa3;
  --cy-line: #ece7f0;
  --cy-card: #ffffff;
  --cy-success: #4ec38a;
  --cy-warn: #f0a93b;
  --cy-danger: #e0556b;
}

[data-theme="dark"] {
  --cy-bg-1: #1a1424;
  --cy-bg-2: #221a30;
  --cy-bg-3: #142022;
  --cy-card: #2a2238;
  --cy-ink-1: #f3eef7;
  --cy-ink-2: #c8c0d8;
  --cy-ink-3: #8a82a0;
  --cy-line: #3a3050;
  /* 主色不变 */
}
```

### 4.2 Tailwind 接 token

```ts
// tailwind.config.ts
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        cy: {
          primary: 'var(--cy-primary)',
          ink: { 1: 'var(--cy-ink-1)', 2: 'var(--cy-ink-2)', 3: 'var(--cy-ink-3)' },
          line: 'var(--cy-line)',
          card: 'var(--cy-card)',
          success: 'var(--cy-success)',
          warn: 'var(--cy-warn)',
          danger: 'var(--cy-danger)',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'cy-gradient': 'linear-gradient(135deg, var(--cy-bg-1) 0%, var(--cy-bg-2) 50%, var(--cy-bg-3) 100%)',
      },
      borderRadius: { xl2: '20px' },
    },
  },
} satisfies Config;
```

### 4.3 排版

- 标题：`text-2xl font-semibold tracking-tight`
- 正文：`text-sm leading-6 text-cy-ink-2`
- 数字（hormone values）：`font-mono tabular-nums`

---

## 5. 路由

**HashRouter**（GitHub Pages 不支持 SPA fallback，hash 路由最稳）。

```
#/dashboard
#/upload
#/report           列表
#/report/:id       详情
#/therapy
#/agent            全屏 agent 视图（dock 是 floating，全屏视图是补充）
#/community
#/community/:id
#/doctors
#/doctors/:id
#/profile
#/settings         API key、provider、隐私
```

`router.tsx` 集中定义；每个 route 用 `lazy()` 拆 chunk。

---

## 6. 状态管理

每个 domain 一个 Zustand store。统一 pattern：

```ts
// src/store/reports.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Report } from '@/types/report';

interface ReportsState {
  list: Report[];
  selectedId: string | null;
  addReport: (r: Report) => void;
  updateReport: (id: string, patch: Partial<Report>) => void;
  removeReport: (id: string) => void;
  select: (id: string | null) => void;
}

export const useReports = create<ReportsState>()(
  persist(
    (set) => ({
      list: [],
      selectedId: null,
      addReport: (r) => set((s) => ({ list: [r, ...s.list] })),
      updateReport: (id, patch) =>
        set((s) => ({
          list: s.list.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      removeReport: (id) =>
        set((s) => ({ list: s.list.filter((r) => r.id !== id) })),
      select: (id) => set({ selectedId: id }),
    }),
    { name: 'cyster.reports.v1' }
  )
);
```

UI store 不 persist（除了 theme 用单独 key）。

---

## 7. 域模型（types）

只列关键类型，codex 实施时按需扩。

### 7.1 User

```ts
// src/types/user.ts
export interface User {
  id: string;
  displayName: string;
  avatar?: string;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  cycleAvgDays: number;            // 默认 28，PCOS 患者常 35–60
  lastPeriodStart: string;         // ISO date
  goals: Array<'regulate-cycle' | 'fertility' | 'anti-androgen' | 'weight' | 'metabolic'>;
  diagnosisStatus: 'undiagnosed' | 'suspected' | 'confirmed';
  phenotype?: 'A' | 'B' | 'C' | 'D'; // Rotterdam phenotype
}
```

### 7.2 Report

```ts
// src/types/report.ts
export interface Report {
  id: string;
  takenAt: string;           // ISO datetime
  cycleDay?: number;
  source: 'ocr' | 'manual' | 'imported';
  rawFiles?: string[];       // 原始图片/PDF 的 data URL 或 blob ref
  hormones?: HormonePanel;
  metabolic?: MetabolicPanel;
  ultrasound?: UltrasoundFindings;
  notes?: string;
  parsed: boolean;
  diagnosis?: DiagnosisResult;
}

export interface HormonePanel {
  // 卵泡期参考；单位需注明
  FSH?: NumValue;   // IU/L
  LH?: NumValue;
  E2?: NumValue;    // pg/mL
  P?: NumValue;     // ng/mL
  T?: NumValue;     // ng/dL or nmol/L
  freeT?: NumValue;
  DHEAS?: NumValue;
  SHBG?: NumValue;
  AMH?: NumValue;   // ng/mL
  Prolactin?: NumValue;
  TSH?: NumValue;
  '17OHP'?: NumValue;
}

export interface MetabolicPanel {
  fastingGlucose?: NumValue;
  fastingInsulin?: NumValue;
  HbA1c?: NumValue;
  HOMA_IR?: NumValue;        // 可由前两项 derive
  TC?: NumValue; TG?: NumValue; HDL?: NumValue; LDL?: NumValue;
  BMI?: NumValue;
  WHR?: NumValue;
}

export interface UltrasoundFindings {
  folliclesPerOvary?: number;     // ≥ 12（旧）/ ≥ 20（新 2018 国际指南）
  ovarianVolumeMl?: { left?: number; right?: number };
  endometriumMm?: number;
  description?: string;
}

export interface NumValue { value: number; unit: string; ref?: [number, number]; flag?: 'low'|'normal'|'high' }

export interface DiagnosisResult {
  criteria: 'Rotterdam2003' | 'AES2009' | 'NIH1990' | 'IntlPCOS2018';
  features: {
    oligoAnovulation: boolean;
    hyperandrogenism: { clinical: boolean; biochemical: boolean };
    pcomOnUS: boolean;
  };
  meets: boolean;
  phenotype?: 'A' | 'B' | 'C' | 'D';
  confidence: number;          // 0–1
  rationale: string;           // agent 生成
}
```

### 7.3 Therapy

```ts
// src/types/therapy.ts
export interface TherapyPlan {
  id: string;
  createdAt: string;
  phase: number;
  weeks: number;
  goals: User['goals'];
  medications: Medication[];
  lifestyle: Lifestyle;
  followUp: FollowUp[];
  rationale: string;
}

export interface Medication {
  drug: string;
  dose: string;
  schedule: string;             // "每日 1 次 / 餐后"
  duration: string;
  purpose: string;
  cautions: string[];
  adherence: AdherenceLog[];
}

export interface AdherenceLog { date: string; taken: boolean; note?: string }

export interface Lifestyle {
  diet: { type: 'low-GI' | 'mediterranean' | 'low-carb'; notes: string };
  workout: { sessionsPerWeek: number; mix: string[] };
  sleepHoursTarget: number;
}

export interface FollowUp {
  kind: 'lab' | 'imaging' | 'visit';
  dueAt: string;
  description: string;
  done: boolean;
}
```

### 7.4 Agent

```ts
// src/types/agent.ts
export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: Role;
  createdAt: string;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;        // when role === 'tool'
  streaming?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'done' | 'error';
}

export interface AgentSession {
  id: string;
  startedAt: string;
  messages: ChatMessage[];
  context: {
    userId: string;
    lastReportId?: string;
    cycleDay?: number;
  };
}
```

---

## 8. 模块详细设计

### 8.1 AppShell

```
┌──────┬──────────┬──────────────────────────────┐
│      │          │                              │
│ Rail │ Sidebar  │           View               │
│      │          │                              │
│      │          │  ┌────────────────────────┐  │
│      │          │  │  AgentPanel (sheet)    │  │
│      │          │  │  slide in from right   │  │
│      │          │  └────────────────────────┘  │
│      │          │              ⚪  AgentDock   │
└──────┴──────────┴──────────────────────────────┘
```

- `AppShell.tsx`：grid 布局，Rail 64px / Sidebar 240px / View flex-1
- `AgentDock` 用 `motion/react` 做脉冲
- `AgentPanel` 用 shadcn `<Sheet side="right">`

### 8.2 Dashboard

- 顶部：CycleRing（当前周期日 + 预测期 + 排卵窗）
- 卡片网格：
  - TodayCard（症状速记 + 体重 + 心情）
  - HormoneRadar（最近一次激素六维雷达）
  - ActivityHeatmap（1 年打卡热力图，复用 legacy/data.js 的生成逻辑）
  - QuickActions（去上传 / 去问诊 / 去打卡）
- 数据：从 `useReports` + `useUser` + `useTherapy` 拉

### 8.3 Upload

- Dropzone（接受 image/* + application/pdf，最多 5 张）
- Pipeline：
  1. 文件转 base64
  2. 调用 `lib/ocr.ts` → 走 LLM vision
  3. 流式回填 OcrPreview 表单
  4. 用户手工校对（OcrPreview 是个 react-hook-form 表单）
  5. 提交 → `useReports.addReport`
  6. 跳转 `#/report/:id`

### 8.4 Report

- `Report.tsx` 列表（时间线 + 关键指标 chip）
- `ReportDetail.tsx`：
  - HormonePanel（每个激素一行：值 + 参考区间条 + flag）
  - MetabolicCard（HOMA-IR 自动算 + BMI 自动算）
  - UltrasoundCard（卵泡数可视化）
  - DiagnosisCriteria（Rotterdam 三个条件的勾选可视化）
  - TrendChart（同一指标多次随访曲线，recharts）
  - 右上 "让 Cyster 解读"按钮 → 触发 agent

### 8.5 Therapy

- PlanOverview：当前 phase / 进度条
- MedicationTracker：今日待服药 checkbox，写入 `AdherenceLog`
- LifestyleCard / MealPlan / WorkoutPlan
- FollowUpReminder（与日历同步预留）

### 8.6 Agent（重点）

- 全屏视图 `Agent.tsx` 与悬浮 `AgentPanel.tsx` 共享 `ChatStream` 组件
- `ChatStream` 接收 `AgentSession`，渲染 messages + 正在 streaming 的 bubble
- 工具调用渲染为 `ToolCallView`（一个折叠卡片，显示 tool 名 + args + result）
- PromptChips：固定 6 个 quick prompts（解读报告 / 训练计划 / 食物识别 / 周期预测 / 复诊提醒 / 找医生）

### 8.7 Community / Doctors / Profile

按 mock 数据展示即可。Phase 1 不做发帖真实存储；Doctors 是静态列表 + 点详情。

---

## 9. AI Agent 架构（核心差异化）

### 9.1 LLM 抽象层

```ts
// src/lib/llm/types.ts
export interface LlmClient {
  provider: 'anthropic' | 'openai' | 'qwen' | 'wenxin' | 'deepseek';
  chat(opts: ChatOpts): AsyncIterable<ChatEvent>;
  vision(opts: VisionOpts): Promise<VisionResult>;
}

export interface ChatOpts {
  system: string;
  messages: ChatMessage[];
  tools?: ToolDef[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  cacheKey?: string;            // for Anthropic prompt caching
}

export type ChatEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'tool-call'; call: ToolCall }
  | { type: 'tool-result'; id: string; result: unknown }
  | { type: 'done'; usage: TokenUsage };

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: ZodSchema;      // 用 zod-to-json-schema 转给 LLM
}
```

`createLlmClient(provider)` 工厂；默认 `provider = 'anthropic'`，模型 `claude-sonnet-4-6`。

### 9.2 Anthropic 实现要点

- 使用 `@anthropic-ai/sdk` 的浏览器模式（`dangerouslyAllowBrowser: true`）—— 仅 Phase 1 自带 key 模式；Phase 2 切到后端 proxy
- **必开 prompt caching**：把 system prompt（含病种知识 + 用户长期上下文）放进 `cache_control: { type: 'ephemeral' }`
- Streaming：`client.messages.stream({...}).on('text', ...).on('contentBlock', ...)`
- Vision：`messages.create` with `image` blocks，模型 `claude-sonnet-4-6`

### 9.3 系统 prompt 模板

```ts
// src/lib/llm/prompts/system.ts
export const buildSystemPrompt = (ctx: AgentContext) => `
你是 Cyster · PCOS 智能咨询助手。

# 身份与边界
- 你不是医生，不提供诊断或处方，不替代专业医疗。
- 你帮用户「理解报告 / 追踪症状 / 维持依从性 / 找到合适医生」。
- 涉及具体治疗，必须建议复诊。

# 用户上下文（已脱敏摘要）
姓名: ${ctx.user.displayName}
年龄: ${new Date().getFullYear() - ctx.user.birthYear}
BMI: ${ctx.user.bmi?.toFixed(1) ?? '未知'}
当前周期日: ${ctx.cycleDay ?? '未知'}
诊断状态: ${ctx.user.diagnosisStatus}
最近报告摘要: ${ctx.lastReportSummary ?? '无'}

# 行为约束
- 用中文，简洁、有同理心、有依据。
- 涉及指标必须给参考区间。
- 引用文献时标注作者+年份（不编造）。
- 不确定时调用工具或直接说不知道。
`;
```

`ctx.lastReportSummary` 由前端预计算，避免每次把整份报告塞进去。

### 9.4 Tool registry

```ts
// src/lib/tools/index.ts
export const TOOLS: Record<string, Tool> = {
  parse_report,        // 把 OCR 结果结构化
  compute_homa_ir,
  compute_bmi,
  cycle_predict,
  rotterdam_check,     // 输入 features → 输出诊断结论
  lookup_drug,         // 本地药典查询（mock）
  search_community,    // mock 搜索社区
};
```

每个 tool 是 pure function（不副作用、不调 LLM）。Agent loop：
1. 用户消息进来
2. 调 `client.chat({ system, messages, tools })`
3. Stream 中检测 `tool-call` → 本地执行 → 把 `tool-result` 追加进 messages → 重新调一次 chat
4. 直到没有 tool call → done

最多 5 轮 tool loop，防爆。

### 9.5 安全

- API key 存 `localStorage`，写入前 base64 + 简单 XOR（`lib/crypto.ts`）—— 不是真的安全，只是防截屏暴露
- 首次使用引导走 `#/settings` 输入 key，提示用户"key 不会上传，仅本地保存"
- 给一个"使用我们的代理"的按钮（Phase 2 接）

---

## 10. OCR Pipeline

```
用户上传 → 文件转 base64
       → llm.vision({ system: OCR_PROMPT, images, schema })
       → 流式拿到 JSON（用 zod 校验）
       → 写入 Report.parsed=false, 跳到 OcrPreview
       → 用户校对 → Report.parsed=true
```

OCR_PROMPT 关键内容：
- 列出所有需要提取的字段（hormones 全集、metabolic 全集、ultrasound）
- 强制输出 JSON schema
- 要求每个值同时给出值 + 单位 + 参考区间（如果原报告有）
- 找不到的字段输出 null，**不要编造**

`lib/ocr.ts` 用 `claude-sonnet-4-6` + `tool_choice: { type: 'tool', name: 'emit_report' }` 强制结构化输出。

---

## 11. PCOS 业务逻辑（`lib/pcos.ts`）

把诊断 / 分型 / 风险计算放成 pure functions，便于测试。

```ts
export function rotterdam(features: {
  oligoAnovulation: boolean;
  clinicalHA: boolean;
  biochemicalHA: boolean;
  pcom: boolean;
}): DiagnosisResult {
  const HA = features.clinicalHA || features.biochemicalHA;
  const positives = [features.oligoAnovulation, HA, features.pcom].filter(Boolean).length;
  const meets = positives >= 2;
  // 表型推断
  let phenotype: 'A'|'B'|'C'|'D'|undefined;
  if (meets) {
    if (features.oligoAnovulation && HA && features.pcom) phenotype = 'A';
    else if (features.oligoAnovulation && HA) phenotype = 'B';
    else if (HA && features.pcom) phenotype = 'C';
    else if (features.oligoAnovulation && features.pcom) phenotype = 'D';
  }
  return { criteria: 'Rotterdam2003', features: { ... }, meets, phenotype, confidence: meets ? 0.9 : 0.7, rationale: '' };
}

export const homaIR = (fastingGlucose_mmolL: number, fastingInsulin_uIUmL: number) =>
  (fastingGlucose_mmolL * fastingInsulin_uIUmL) / 22.5;

export const bmi = (heightCm: number, weightKg: number) => weightKg / Math.pow(heightCm / 100, 2);
```

所有数字带单位的，类型层就强制（NumValue.unit）。

---

## 12. Mock 数据

- `src/mocks/*.json` 是默认种子
- 首次启动 store 时若 localStorage 空，从 mocks 灌入
- 把 legacy `pcos/js/data.js` 的种子数据迁过来（活跃热力图、几条历史报告、agent 对话）
- 真实 API 接入时切换 `lib/api.ts` 的实现，store 形态不变

---

## 13. 安全与合规（务实做法，不是法务建议）

- 所有用户输入数据只存 localStorage（Phase 1），不向第三方上传，除 OCR 时把图片发给 LLM provider
- Settings 页面给「本地数据导出 / 清除」按钮（PIPL 第 47 条 / GDPR 类需求兜底）
- `dangerouslyAllowBrowser` 仅 Phase 1；Phase 2 必须切代理
- 报告解读输出必须带 disclaimer footer：「仅供参考，不构成诊疗建议」

---

## 14. 构建 & 部署

### 14.1 Vite config

```ts
// pcos/_src/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/pcos/',
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    outDir: path.resolve(__dirname, '..'),
    emptyOutDir: false,                // 不要删掉 legacy/、ARCHITECTURE.md
    assetsDir: 'assets',
    rollupOptions: {
      output: { manualChunks: { react: ['react', 'react-dom'], llm: ['@anthropic-ai/sdk'] } },
    },
  },
});
```

> 由于 `emptyOutDir: false`，构建前手动 `rm -rf pcos/assets pcos/index.html` 再 build。codex 写个 `npm run prebuild` 脚本干这事。

### 14.2 GitHub Actions（可选）

`.github/workflows/build-cyster.yml`：
- 触发：`paths: ['pcos/_src/**']`
- 步骤：checkout → setup node → `cd pcos/_src && pnpm i && pnpm build` → commit `pcos/index.html` + `pcos/assets/` 回 main

Phase 1 codex 可以先本地 build + commit，不强制 Actions。

---

## 15. 从 Cyster v1 迁移清单

| Legacy 文件 | 处置 |
|---|---|
| `pcos/index.html` | 备份到 `pcos/legacy/index.html`，新 build 覆盖 |
| `pcos/css/pcos.css` | 备份到 `pcos/legacy/css/`，颜色 token 抄到 `tokens.css`，布局 className 用 Tailwind 重写 |
| `pcos/js/app.js` | 路由逻辑抄到 `router.tsx`；sidebar preset 抄到 `SidebarPresets.tsx` |
| `pcos/js/data.js` | 种子数据抄成 `mocks/*.json`；rng 工具放 `lib/utils.ts` |
| `pcos/js/agent.js` | 规则路由废弃，改成真 Claude；但保留 `TOOLS` 文案和 "工具调用 · ..." 的视觉样式 |
| `pcos/js/charts.js` | 三个图（line / radar / silhouette）用 recharts 重写 |

每个 legacy 函数对应的新位置，codex 在 commit message 里标注（"port from legacy/js/app.js#routeFrom"）。

---

## 16. 实施 Phase（codex 一次一个 PR）

| Phase | 内容 | 验收 |
|---|---|---|
| **P0 · Scaffold** | 创建 `pcos/_src/`，装栈，跑通 Vite + Tailwind + shadcn，build 到 `pcos/` 能看到空壳 | 访问 `/pcos/` 看到 "Cyster" 字样 + 主题切换工作 |
| **P1 · Shell** | AppShell + Rail + Sidebar + AgentDock + AgentPanel（空内容）+ 路由 | 8 个 route 都能切，sidebar 跟随 route 变 |
| **P2 · Dashboard + Profile** | 灌 mock 数据，CycleRing / HormoneRadar / ActivityHeatmap | 进首页能看到一份完整 dashboard |
| **P3 · Reports** | Report 列表 + 详情 + DiagnosisCriteria + TrendChart | 进 `#/report/r-001` 能看到完整解读 |
| **P4 · Agent (Claude)** | LLM 抽象 + Anthropic adapter + ChatStream + 4 个 tool | 用户输入 key 后能流式对话，触发 `rotterdam_check` 工具 |
| **P5 · Upload + OCR** | Dropzone + vision OCR + OcrPreview 校对 | 上传一张化验单截图能解析出 ≥ 5 个激素值 |
| **P6 · Therapy** | PlanOverview + MedicationTracker + 打卡 | 能勾掉今日服药，写入 AdherenceLog |
| **P7 · Community + Doctors** | mock 列表 + 详情 | 列表可点击，详情页可返回 |
| **P8 · Polish** | 加载态 / 错误态 / 空状态 / 移动端 ≥ 375px / a11y | Lighthouse perf ≥ 80, a11y ≥ 90 |

每 phase 一个 PR，标题 `Phase Pn: <name>`，body 列出本 phase 触达的文件与验收勾选。

---

## 17. 验收 / 退出条件（Phase 1 全部完成时）

- [ ] `/pcos/` 在 GitHub Pages 上可访问，无 console error
- [ ] 8 个 route 全部可达且渲染 mock 数据
- [ ] 主题切换持久化
- [ ] 用户在 Settings 输入 Claude API key 后，Agent 可流式回答 ≥ 5 轮
- [ ] 上传 1 张化验单截图，OCR 能填充 ≥ 5 个字段（用户可改）
- [ ] Report 详情页对一份 mock 报告做出 Rotterdam 诊断判断
- [ ] 所有用户数据仅在 localStorage，无任何第三方上报（除 LLM 请求）
- [ ] TypeScript `strict: true` 零 error；`pnpm test` 通过；`pnpm build` 通过
- [ ] README 写清楚本地起服 + build + key 配置流程

---

## 18. 给 codex 的具体指令模板（粘贴用）

```
你将基于本仓库 pcos/ARCHITECTURE.md 实现 Cyster 前端。

要求：
1. 严格按照架构文档的目录结构、类型定义、phase 顺序。
2. 一次完成一个 phase，提交一个 commit（或 PR），不要跨 phase。
3. 不要擅自更换技术栈、改路由模式、跳过 LLM 抽象层。
4. 现有 pcos/index.html、pcos/css/、pcos/js/ 在 P0 第一步先 git mv 到 pcos/legacy/。
5. 每个 phase 完成后在 commit body 列出验收清单的勾选情况。
6. 优先实现验收清单中列出的功能，其他细节可标 TODO。
7. 模型 ID 用字符串字面量，写在 src/lib/llm/anthropic.ts 顶部常量，便于以后改。
8. 严禁在代码中硬编码 API key；通过 src/lib/storage.ts 读写。

现在从 Phase P0 开始。
```

---

## 19. 未决问题（codex 实施前我会和你对齐）

- 是否要 i18n？（建议 Phase 2 再说，先纯中文）
- 是否要 PWA / 离线？（仓库根有 sw.js，pcos 域要不要单独 PWA manifest？）
- Agent 长对话超过 context window 后的压缩策略（先简单截断最近 20 条）
- 用户多账号 / 设备同步（Phase 2 后端范畴）
- 真实医生入驻流程（不在 Phase 1 范围）

---

**本文档是 codex 的唯一真理来源。代码与文档冲突时，先改文档再改代码。**
