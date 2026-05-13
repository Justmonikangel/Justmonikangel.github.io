# Cyster Frontend · Phase P0 Review

> Reviewer: Claude（架构作者）
> Reviewed commits: `78c01af..8b80be9`（7 commits, "Phase P0: Scaffold sync" + "finalize legacy move"）
> Verdict: **P0 验收通过，但需在 P1 启动前完成一轮 P0.5 cleanup。**

---

## 0. 一句话总评

骨架到位，类型与设计 token 忠实 port，关键纯函数（`pcos.ts` / `storage.ts` / `crypto.ts`）实现完整且有测试。**但路由只挂了 1 个、AppShell 是空壳、6 个 shadcn UI 组件是 `return null`、5 个 LLM adapter 用了怪异占位写法，这些会污染后续 phase 的预期，必须先修。**

---

## 1. 做对的部分 ✅

| 项目 | 状态 | 备注 |
|---|---|---|
| 目录结构 | ✅ | 完全对齐 `ARCHITECTURE.md` §3 |
| 技术栈版本 | ✅ | React 18.3 / Vite 5.4 / TS 5.7 (strict) / Tailwind 3.4 |
| `vite.config.ts` | ✅ | `base: '/pcos/'`、`outDir: '..'`、`emptyOutDir: false`、`manualChunks` 都对 |
| 颜色 token | ✅ | `tokens.css` 一字不差 port，data-theme dark 接通 |
| `tailwind.config.ts` | ✅ | `darkMode: ['class', '[data-theme="dark"]']`，cy-gradient 工具类齐全 |
| `lib/pcos.ts` | ✅ | rotterdam / homaIR / bmi 完整实现 |
| `lib/storage.ts` + `crypto.ts` | ✅ | XOR + base64 obfuscate，round-trip 测试通过 |
| Types | ✅ | `report.ts` / `user.ts` / `agent.ts` 与架构 §7 一致 |
| shadcn 真组件 | ✅ | Button / Card / Input / Badge 是真 `forwardRef` + `cva` |
| ErrorBoundary / ThemeToggle / EmptyState / RoutePlaceholder | ✅ | 是真组件 |
| `Dashboard.tsx` | ✅ | 89 行像样的 P0 占位，明示"P1 再做 AppShell" |
| `prebuild.mjs` | ✅ | 清掉 `pcos/index.html` + `pcos/assets/` 解决 stale hash 问题 |
| `.gitignore` / `_config.yml` | ✅ | 排除 `pcos/_src` 双保险 |
| 顺手修了根 `package.json` 的 JSON 语法错误 | ✅ | 加了原本缺的逗号 |
| 单元测试 | ✅ | `pcos.test`（3 用例）+ `hormones.test` + 1 个 storage 测试，vitest + jsdom 配好 |
| Legacy 迁移 | ✅ | `pcos/legacy/{index.html,css/,js/}` 全在 |

**P0 验收清单核对：**
- [x] 访问 `/pcos/` 能看到 Cyster 标识
- [x] 主题切换使用 localStorage 持久化（key: `cyster.ui.theme.v1`）
- [x] `pcos/_src/` 与 `pcos/legacy/` 目录按架构文档建好

---

## 2. P1 启动前必须修的 ⚠️

### 2.1 路由只挂了 1 个

`pcos/_src/src/router.tsx` 只配了 `/dashboard`。架构 §5 列了 11 个 hash route：

```
#/dashboard  #/upload  #/report  #/report/:id
#/therapy  #/agent  #/community  #/community/:id
#/doctors  #/doctors/:id  #/profile  #/settings
```

P1 才正式做 AppShell，但 **这 11 个 route 现在就该挂上**，未实现的指向已有的 `RoutePlaceholder`（codex 自己已经写好但没用上）。否则 P1 实现 AppShell 时还要先回来补这一步。

### 2.2 AppShell 是 `<div>{children}</div>`，App.tsx 没接它

```tsx
// 现状 App.tsx
<ErrorBoundary>
  <div className="min-h-screen bg-cy-gradient text-cy-ink-1">
    <Outlet />
  </div>
</ErrorBoundary>
```

完全跳过了 AppShell。`Rail` / `Sidebar` / `AgentDock` / `AgentPanel` / `SidebarPresets` 都是 `return null` / 空对象。

P1 第一件事就是把 AppShell 真正搭起来，但 stub 文件这样躺着会让人误以为已经实现。**至少在每个 stub 顶上加 `// TODO P1:` 注释**，写明该组件的预期形态。

### 2.3 shadcn 半组件危险

| 组件 | 状态 |
|---|---|
| Button / Card / Input / Badge | ✅ 真实现 |
| **Dialog / Sheet / Tabs / Toast / Tooltip / Avatar** | ❌ `return null` |

后续 phase 一旦 import 这些（架构里 AgentPanel 用 Sheet、Upload 校对用 Dialog、Report 用 Tabs、Settings 用 Tooltip、Profile 用 Avatar），渲染会**静默失败**——不报错，但什么都不显示。

**修复方案二选一：**
- 用 shadcn CLI 一次性生成出来（`pnpm dlx shadcn@latest add dialog sheet tabs toast tooltip avatar`）
- 或者先让 stub `throw new Error('UI component <Name> not implemented yet')`，未来 phase 一调用就立即报错，便于发现

---

## 3. Code quality 问题（不阻塞 P1，强烈建议同 PR 处理）

### 3.1 `lib/api.ts` 是无意义占位
```ts
export async function apiGet<T>(value: T) { return Promise.resolve(value); }
```
架构 §12 说 api.ts 是 mock / real 切换层。这个签名解决不了任何问题。**建议要么删掉，要么写成 `fetch + import.meta.env.DEV ? mocks : real` 的真抽象。**

### 3.2 Prompt 文件全是 1-liner 占位
- `lib/llm/prompts/system.ts` → `'你是 Cyster · PCOS 智能咨询助手。'`
- `report.ts` / `therapy.ts` / `ocr.ts` 全是 `'Phase Pn 再填充...'`

架构 §9.3 给了完整 30 行 system prompt 模板（含用户上下文注入、身份边界、行为约束）。**应该 port 进来**，否则 P4 codex 自己回来还得重读架构。

### 3.3 `lib/hormones.ts` 覆盖率不到 1/3
只有 FSH / LH / E2 / P 四个激素的卵泡期区间。`HormonePanel` 类型里有 12 个字段（T / freeT / DHEAS / SHBG / AMH / Prolactin / TSH / 17OHP 全缺），还分卵泡期 / 排卵期 / 黄体期 / 绝经后四个相位。Report 解读和 OCR preview 都要依赖。

### 3.4 `lib/cycle.ts` 只有 `predictNextCycle`
缺 `cyclePhase(day, avgDays)` 和 `fertileWindow(lastPeriodStart, avgDays)`。Dashboard 的 CycleRing 一定会用到。

### 3.5 `lib/tools/parseReport.ts` 是 identity 函数
```ts
export function parseReport<T>(input: T) { return input; }
```
Tool registry 里挂了它，但 LLM 调它什么都不会发生。改成 `throw 'not implemented'` 或从 `TOOLS` 里删掉条目。

### 3.6 `lib/tools/lookupDrug.ts` 只有 metformin 1 条
市场分析里点名的 PCOS 一线药至少应该 seed 进去：**达英-35 / 优思明 / 二甲双胍 / 螺内酯 / 来曲唑 / 克罗米芬**。每条至少包含：通用名、商品名、机制、典型剂量、PCOS 适应症范围、主要禁忌、备孕期是否可用。

### 3.7 5 个 LLM adapter 用了怪异写法
```ts
async function* notReadyChat(): AsyncIterable<ChatEvent> {
  yield* [];                              // 死代码
  throw new Error('...');
}
```
`yield* []` 永远 yield 不出东西，纯粹用来满足 `AsyncIterable<ChatEvent>` 签名。而且 5 个文案不一致：Anthropic 说 "Phase P4 / P5 will enable"，其他 4 个说 "not implemented yet"。

**建议抽公共工厂统一：**
```ts
// lib/llm/placeholder.ts
export function createPlaceholderClient(provider: LlmClient['provider'], phase: string): LlmClient {
  const err = () => new Error(`${provider} client will be enabled in Phase ${phase}.`);
  async function* chat(): AsyncIterable<ChatEvent> { throw err(); }
  async function vision(): Promise<VisionResult> { throw err(); }
  return { provider, chat, vision };
}
```

### 3.8 `agent.test.ts` 文件名误导
里面测的是 `writeProviderKey` / `readProviderKey`，跟 agent 一点关系没有。**改名 `storage.test.ts`**。

### 3.9 Mock 数据贫血
- 1 个 user / 1 个 report（基本是 placeholder）/ 1 个 post / 1 个 doctor / 0 个 therapy
- 但 `pcos/legacy/js/data.js` 里有 **365 天活跃热力图种子** + 历次报告 + 训练数据 + agent 对话历史，应该 port 过来给 P2 Dashboard 直接吃

---

## 4. 工作流提醒（不必返工）

### 4.1 Commit 粒度怪异

P0 被拆成 7 个 commit：

```
76e7bf6  Phase P0: Scaffold sync (1/2)
5a6616f  Phase P0: Scaffold sync (2/2)
ab388a9  Phase P0: finalize legacy move (1/5)   ← 删 css/pcos.css
d1e4c6d  Phase P0: finalize legacy move (2/5)   ← 删 js/agent.js
f7cbeab  Phase P0: finalize legacy move (3/5)   ← 删 js/app.js
024d1ac  Phase P0: finalize legacy move (4/5)   ← 删 js/charts.js
8b80be9  Phase P0: finalize legacy move (5/5)   ← 删 js/data.js
```

"5/5" 系列本来一个 `git mv` 就完事。commit body 还说 "via the GitHub web upload flow" —— 这解释了为什么 codex 是逐文件操作，不是 CLI。**后面 P1 起请走本地 CLI + PR，单 phase 单 commit（或几个清晰子 commit）**。

### 4.2 没开 PR、commit body 没勾选清单

架构 §16 说"每 phase 一个 PR + commit body 列验收勾选"。现在所有 commit 直接打到分支。**P1 起请按规矩开 PR，body 列 §17 验收清单的勾选状态。**

---

## 5. P0 总评

| 维度 | 评分 |
|---|---|
| 架构对齐度 | 7/10（骨架对，很多文件内容空） |
| 代码质量（已实现部分） | 8/10 |
| 已实现 vs 应实现比例 | ~30%（多数 stub 是 P1+ 的合理预留，可接受） |
| P0 验收通过 | ✅ |
| 是否可直接进 P1 | ⚠️ **先做 P0.5 cleanup** |

---

## 6. 给 codex 的下一条指令（可直接复制）

```
你交付的 P0 已经验收通过，但在开始 P1 之前请做一次 P0.5 cleanup PR，处理
以下 11 项（按优先级排序）。完整 review 见 pcos/REVIEW-P0.md。

阻塞类（必须做完才能进 P1）：
1. router.tsx 把架构 §5 列的 11 个 hash route 全挂上，未实现的指向
   <RoutePlaceholder title=".." description=".."/>。
2. App.tsx 不要直接渲染 <Outlet/>，挂一个最简 AppShell（先就 grid 出
   Rail / Sidebar / View 三栏占位），Rail / Sidebar 的具体实现 P1 再做。
3. 给 components/layout/{AppShell, Rail, Sidebar, AgentDock, AgentPanel,
   SidebarPresets}.tsx 的 stub 顶部加 `// TODO P1:` 注释，写明用途与预期形态。
4. shadcn 半组件 dialog / sheet / tabs / toast / tooltip / avatar：用 shadcn
   CLI 真生成（`pnpm dlx shadcn@latest add ...`），或至少 throw
   `not implemented` 以免静默渲染失败。

清理类（强烈建议同 PR 处理）：
5. lib/llm/prompts/system.ts 把架构 §9.3 的完整 system prompt 模板 port
   进来，包括 ctx 注入逻辑（用户上下文 + 身份边界 + 行为约束三段式）。
6. lib/hormones.ts 补全 HormonePanel 12 个字段 × 卵泡 / 排卵 / 黄体 / 绝经后
   四个相位的参考区间。
7. lib/cycle.ts 补 cyclePhase(day, avgDays) 和 fertileWindow(lastPeriodStart,
   avgDays) 两个函数。
8. lib/api.ts 改成有意义的 fetch + dev-mode mock 切换，或者删掉。
9. 5 个 LLM adapter 提取公共 createPlaceholderClient(provider, phase)，
   消除 `yield* []` 死代码和不一致文案。
10. 把 legacy/js/data.js 的 365 天活跃热力图 + 历次报告种子 + agent 对话
    历史 port 到 src/mocks/*.json，给 P2 准备。
11. agent.test.ts 改名 storage.test.ts。

非阻塞但建议：
- lib/tools/parseReport.ts 改成 throw not-implemented 或从 TOOLS 删掉。
- lib/tools/lookupDrug.ts 至少 seed 6 种 PCOS 一线药：达英-35 / 优思明 /
  二甲双胍 / 螺内酯 / 来曲唑 / 克罗米芬。

提交方式：
- 开一个 PR，标题 "Phase P0.5: cleanup before P1"
- 本地 CLI 提交，不要再逐文件 web 上传
- 单 commit 或最多 3 个子 commit（routing / shell / mocks-and-libs）
- PR body 用 checkbox 列上面 11 项的勾选状态
- 通过后再开 P1 PR

P1 acceptance（架构 §16）：
- AppShell + Rail + Sidebar + AgentDock + AgentPanel（空内容）+ 路由
- 8 个主 route 都能切，sidebar 跟随 route 变标题与子导航
```

---

## 7. v2 切换说明（2026-05-13 追加）

经过三方 review（Claude / Gemini / GPT），架构已升级到 v2。**v2 是新的真理来源**，参见：

- `pcos/ARCHITECTURE-v2.md` — 新的规范
- `pcos/MIGRATION-v1-to-v2.md` — v1 到 v2 的对照表（路由 / 类型 / 模块 / 文件）
- `pcos/DECISIONS.md` — 18 条关键决策日志（D-001..D-018）

`pcos/ARCHITECTURE.md`（v1）保留作为对照，不再更新。

### 7.1 v2 对产品定位的根本调整

- 产品定位收紧为 "PCOS 觉知 + 报告识读 + 共同体"，不再是 "PCOS 智能咨询平台"
- 首页换为 `AmITheOne` 自测，Dashboard 删除
- `DiagnosisResult` → `PcosFeatureMap`（不输出 confirmed）
- `TherapyPlan` → `CareNote`（用户录入，非 AI 方案）
- `lookupDrug` → `lookupMedicationInfo`（仅科普）
- 删除 `@tanstack/react-query`
- 新增 Content Governance 硬约束 + Red-flag 升级机制
- 新增 P1.5 阶段（Cloudflare Worker proxy + 邀请码）

### 7.2 §6 codex 指令的废弃 / 替换

| §6 原任务 | 状态 |
|---|---|
| 1. router 挂 11 个 route | 仍有效，但 route 表换成 v2 §5 列出的 15 个 |
| 2. AppShell 三栏 | 仍有效 |
| 3. layout stub TODO 注释 | 仍有效 |
| 4. shadcn 半组件补全 | 仍有效 |
| 5. `lib/llm/prompts/system.ts` port v1 §9.3 | **废弃**；改用 v2 §12 的 `PromptBlock[]` 三段式，并把 v2 §16.3 写入 safety 块 |
| 6. `lib/hormones.ts` 补全 12 字段 | 仍有效 |
| 7. `lib/cycle.ts` 补 cyclePhase/fertileWindow | 仍有效 |
| 8. `lib/api.ts` 重写或删除 | **改为直接删除**，P1.5 再加 |
| 9. LLM adapter 公共工厂 | 仍有效，命名 `createPlaceholderClient(provider, phase)` |
| 10. legacy/js/data.js 365 天 heatmap port | 仍有效，但 mocks 改名为 `stories.json` + 新增 `knowledgeCards.json` |
| 11. `agent.test.ts` 改名 `storage.test.ts` | 仍有效 |
| `lib/tools/parseReport.ts` 处置 | **改为直接删除**（identity stub 无意义） |
| `lib/tools/lookupDrug.ts` seed 6 种药 | **废弃**；改名 `lookupMedicationInfo.ts`，按 v2 §14.3 实现 |

### 7.3 v2 cutover 新增任务

详见 `pcos/MIGRATION-v1-to-v2.md` §11，分三个 commit：

**Commit 1：code cleanup**（保留 v1 §6 仍有效项 + 上表）

**Commit 2：v2 type & module rename**
- types：`DiagnosisResult` → `PcosFeatureMap`、`TherapyPlan` → `CareNote`、
  `Medication` → `PrescribedMedication`，`ChatOpts.system: string` → `PromptBlock[]`
- types 新增：`KnowledgeCard`、`Citation`、`CommunityStory`、`AmITheOneSession`、
  `FeatureFlag`、`ExclusionStatus`、`PromptBlock`、`RedFlagPattern`、`SafetyEvent`
- lib：`rotterdam()` → `pcosFeatureMap()`（2023 指南 + adult/adolescent）
- tools：`rotterdamCheck` → `computeFeatureMap`，`lookupDrug` → `lookupMedicationInfo`
- 组件目录：`community/` → `stories/`，`therapy/` → `care/`
- 路由：13 个改为 v2 §5 的 15 个
- mocks：删 `therapy.json` + `community.json` → `stories.json`，新增
  `knowledgeCards.json` / `selfAssessmentQuestions.json` / `redFlagPatterns.json` / `medicationInfo.json`

**Commit 3：v2 新增 lib + governance hard rules**
- 新增 `lib/safety/` 三件套（`redFlags.ts` / `detect.ts` / `escalation.ts`）
- 新增 `lib/image/` 三件套（`compress.ts` / `fileToVisionInput.ts` / `validateUpload.ts`）
- 新增 `lib/knowledge/` + `lib/citations.ts`
- 新增 `lib/llm/prompts/blocks.ts` + `safety.ts` + `medicalKnowledge.ts` + `userContext.ts`
  其中 `safety.ts` **必须**包含 v2 §16.3 的全部规则（cache_control: ephemeral）
- 新增 `components/safety/EmergencyCard.tsx` + `RedFlagNotice.tsx`
- 新增 `components/amitheone/` + `components/knowledge/` + `components/cycle/` 骨架
- 安装 `idb-keyval`，新增 `lib/indexedDb.ts`

### 7.4 给 codex 的最终指令（替换 §6）

```
你已交付 P0。现在请按以下三个文件做一次 P0.5 v2 cutover PR：

- pcos/ARCHITECTURE-v2.md  ← 新规范
- pcos/MIGRATION-v1-to-v2.md  ← 对照表
- pcos/DECISIONS.md  ← 决策依据

任务分三个 commit（详见 MIGRATION §11）：

  Commit 1: code cleanup
  Commit 2: v2 type & module rename
  Commit 3: v2 新增 lib + content governance hard rules

提交方式：
- 本地 CLI 提交，不要再逐文件 web 上传
- 每个 commit 的 body 列出对应任务的勾选状态
- 整个 PR 标题 "Phase P0.5 v2 cutover: blue-bubble repositioning"
- PR body 引用 ARCHITECTURE-v2.md §16 Content Governance，承诺所有 AI
  prompt 都内嵌 §16.3 规则

完成验收（必须全部通过）：
1. pnpm test 通过（含 pcos.test.ts 的 2023 guideline + adolescent 用例）
2. pnpm build 通过
3. /pcos/ 访问能看到 AmITheOne 首页（即便题库还是占位）
4. 主题切换工作
5. 13 个新路由全部可达（未实现的指向 RoutePlaceholder）
6. /pcos/profile/settings 显示 Provider / Model / API Key / Proxy / 
   Invite Code / Connectivity Test 完整字段（即便 Test 按钮还是 mock）
7. lib/safety/redFlags.ts + EmergencyCard 存在并通过单元测试

P1 acceptance（v2 §20）下个 PR 再做。
```

## 8. 引用

- v1 架构（参考用）：`pcos/ARCHITECTURE.md`
- v2 架构（真理来源）：`pcos/ARCHITECTURE-v2.md`
- 迁移对照表：`pcos/MIGRATION-v1-to-v2.md`
- 决策日志：`pcos/DECISIONS.md`
- 市场分析：`_posts/2026-05-13-PCOS国内市场分析-诊断治疗与药物筛选缺口.md`
- Legacy 参考：`pcos/legacy/`
