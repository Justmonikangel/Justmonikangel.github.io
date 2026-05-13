# Cyster v1 → v2 Migration Map

> v2 把产品定位从 "PCOS 智能咨询平台" 收紧到 "PCOS 觉知 + 报告识读 + 共同体"。
> 本文档列出 v1 → v2 的所有改名、新增、删除项，是 codex 实施 P0.5 v2 cutover 的依据。
>
> v1 参考：`pcos/ARCHITECTURE.md`
> v2 规范：`pcos/ARCHITECTURE-v2.md`
> 决策日志：`pcos/DECISIONS.md`

---

## 1. 定位与品牌

| Aspect | v1 | v2 |
|---|---|---|
| Tagline | PCOS 智能咨询平台 | PCOS 觉知 · 报告识读 · 共同体 |
| Hero 首页 | Dashboard | AmITheOne 自测 |
| 核心叙事 | "AI 帮你管理 PCOS" | "你不是有问题，是 PCOS" |
| 监管姿态 | 隐含医疗器械化 | 显式非医疗器械 + 觉知工具 |

---

## 2. 路由

| v1 | v2 | Action |
|---|---|---|
| `#/dashboard` | `#/` | **REMOVED**（首页换为 AmITheOne） |
| — | `#/` | **NEW** AmITheOne |
| `#/upload` | `#/report/upload` | **MOVED** to nested |
| `#/report` | `#/report` | KEPT |
| `#/report/:id` | `#/report/:id` | KEPT（内容重写） |
| `#/therapy` | `#/care` | **RENAMED** + scope-narrowed |
| `#/agent` | `#/agent` | KEPT |
| `#/community` | `#/stories` | **RENAMED**；curated only |
| `#/community/:id` | `#/stories/:slug` | **RENAMED**；slug 路径 |
| `#/doctors` | `#/doctors` | KEPT（display only） |
| `#/doctors/:id` | `#/doctors/:id` | KEPT |
| `#/profile` | `#/profile` | KEPT |
| `#/settings` | `#/profile/settings` | **NESTED** under profile |
| — | `#/knowledge` | **NEW** Knowledge Cards index |
| — | `#/knowledge/:slug` | **NEW** Knowledge Card detail |
| — | `#/cycle` | **NEW**（从 Dashboard 抽出） |

---

## 3. Types

### 3.1 重命名

| v1 | v2 | 备注 |
|---|---|---|
| `DiagnosisResult` | `PcosFeatureMap` | 不输出 confirmed，结构按 2023 指南重写 |
| `TherapyPlan` | `CareNote` | 移除 rationale / AI-generated plan 字段 |
| `Medication` | `PrescribedMedication` | user-entered only |
| `AdherenceLog` | `MedicationTakeLog` | 用户打卡 + 副作用，不 AI 排方案 |
| `Lifestyle` | (subsumed into KnowledgeCard) | 删除独立类型 |
| `Post` | `CommunityStory` | curated + consent metadata |
| `Comment` | — | **DELETE**（P2 再做） |

### 3.2 新增

| 类型 | 用途 |
|---|---|
| `FeatureFlag` | `present / absent / unknown / borderline` + evidence[] |
| `ExclusionStatus` | `normal / abnormal / unchecked / not-applicable` |
| `Citation` | KnowledgeCard 引用结构（PMID / DOI / URL） |
| `KnowledgeCard` | 科普卡片（citations + lastReviewedAt + aiAssisted）|
| `CommunityStory` | 故事（consentStatus + anonymous + withdrawable + aiAssistKind）|
| `SelfAssessmentQuestion` | 自测题 |
| `AmITheOneSession` | 自测会话 |
| `SelfAssessmentResult` | 自测结果 |
| `PromptBlock` | ChatOpts.system 的 array of blocks |
| `RedFlagPattern` | 红 flag regex + 文案 |
| `SafetyEvent` | 红 flag 触发记录（仅本地） |
| `EmergencyContact` | 紧急联系方式 |
| `DoctorPrepItem` | 看医生准备清单条目 |

### 3.3 字段变化（重要）

**`Report`：**
- 删除 `rawFiles?: string[]`
- 新增 `originalImageRefs?: string[]`（IndexedDB keys，opt-in 才有）
- 新增 `featureMapId?: string`
- 字段 `diagnosis?: DiagnosisResult` → 不再嵌入，由 `featureMapId` 关联

**`User`：**
- 新增 `population: 'adult' | 'adolescent' | 'unknown'`
- 删除 `phenotype`（不是患者关心的语言）
- `diagnosisStatus` → `pcosStatus`，枚举改为 `'not-explored' | 'self-suspected' | 'clinical-suspected' | 'clinically-confirmed'`
- `goals` 枚举改为 `'understand' | 'regulate-cycle' | 'fertility' | 'metabolic' | 'community'`

**`ChatOpts`：**
- `system: string` → `system: PromptBlock[]`（关键！）

**`AgentSession`：**
- `context` 新增 `population` 和 `lastFeatureMapId`
- 新增 `safetyEvents?: SafetyEvent[]`

---

## 4. Lib

### 4.1 重命名

| v1 | v2 | 备注 |
|---|---|---|
| `lib/pcos.ts::rotterdam()` | `lib/pcos.ts::pcosFeatureMap()` | 2023 guideline + adult/adolescent + 排除项 |
| `lib/tools/rotterdamCheck.ts` | `lib/tools/computeFeatureMap.ts` | 同上 |
| `lib/tools/lookupDrug.ts` | `lib/tools/lookupMedicationInfo.ts` | 只返回科普 |
| `lib/llm/prompts/ocr.ts` | `lib/llm/prompts/reportOcr.ts` | 提示词内容也要重写 |

### 4.2 删除

| v1 | 原因 |
|---|---|
| `lib/api.ts` | identity stub，P1 不需要 fetch 层，P1.5 再加 |
| `lib/tools/parseReport.ts` | identity stub，无意义 |
| `lib/llm/prompts/therapy.ts` | "治疗方案" 已被产品定位禁止 |
| `lib/tools/searchCommunity.ts` | 改名 `searchStories.ts` |

### 4.3 新增

| 文件 | 用途 |
|---|---|
| `lib/safety/redFlags.ts` | regex 表 |
| `lib/safety/detect.ts` | 检测函数 |
| `lib/safety/escalation.ts` | 升级逻辑 |
| `lib/image/compress.ts` | Canvas 压缩 |
| `lib/image/fileToVisionInput.ts` | base64 化 + mime |
| `lib/image/validateUpload.ts` | 类型 + 大小校验 |
| `lib/knowledge/index.ts` | KnowledgeCard 注册表 |
| `lib/knowledge/loader.ts` | mock JSON 加载 |
| `lib/citations.ts` | 引用结构与渲染 |
| `lib/llm/prompts/blocks.ts` | PromptBlock 构造器 |
| `lib/llm/prompts/safety.ts` | 安全规则块（cache_control: ephemeral） |
| `lib/llm/prompts/medicalKnowledge.ts` | PCOS 静态知识块 |
| `lib/llm/prompts/userContext.ts` | 动态用户上下文 builder |
| `lib/llm/placeholder.ts` | 5 个 adapter 共用 stub 工厂 |
| `lib/indexedDb.ts` | idb-keyval 封装（opt-in 原图存储） |
| `lib/tools/searchKnowledge.ts` | 检索 KnowledgeCard |
| `lib/tools/searchStories.ts` | 检索 curated stories |
| `lib/tools/generateDoctorQuestions.ts` | 基于 featureMap 生成"问医生清单" |

### 4.4 扩展（content unchanged but expand）

| 文件 | 扩展内容 |
|---|---|
| `lib/hormones.ts` | 补全 12 字段 × 4 相位（卵泡 / 排卵 / 黄体 / 绝经后） |
| `lib/cycle.ts` | 新增 `cyclePhase(day, avgDays)`、`fertileWindow(lastPeriodStart, avgDays)` |
| `lib/llm/prompts/system.ts` | 改为按 PromptBlock 拼接，旧的单字符串废弃 |

---

## 5. Components / 路由层

### 5.1 目录改名

| v1 | v2 | Action |
|---|---|---|
| `components/dashboard/` | (delete) | DELETE（widgets 抽到 components/cycle 等） |
| `components/upload/` | `components/report/upload/` | MOVE |
| `components/report/` | `components/report/literacy/` | RENAME（新增 FeatureMapView 等） |
| `components/therapy/` | `components/care/` | RENAME + 大幅简化 |
| `components/community/` | `components/stories/` | RENAME + 删除 composer/comments |

### 5.2 新增目录

- `components/amitheone/` — SelfAssessmentForm / QuestionCard / ResultPanel
- `components/knowledge/` — KnowledgeCard / CitationList / LastReviewedBadge
- `components/cycle/` — CycleRing / CycleHistory / SymptomLog
- `components/safety/` — **EmergencyCard / RedFlagNotice（关键）**

### 5.3 删除的具体组件

- `components/dashboard/CycleRing.tsx` → 移到 `components/cycle/`
- `components/dashboard/HormoneRadar.tsx` → 移到 `components/report/literacy/`
- `components/dashboard/ActivityHeatmap.tsx` → 移到 `components/cycle/`
- `components/dashboard/TodayCard.tsx` → DELETE
- `components/dashboard/QuickActions.tsx` → DELETE
- `components/community/PostComposer.tsx` → DELETE（P2）
- `components/community/CommentThread.tsx` → DELETE（P2）
- `components/therapy/PlanOverview.tsx` → DELETE
- `components/therapy/MealPlan.tsx` → DELETE
- `components/therapy/WorkoutPlan.tsx` → DELETE
- `components/therapy/LifestyleCard.tsx` → DELETE
- `components/report/DiagnosisCriteria.tsx` → 改为 `report/literacy/FeatureMapView.tsx`

### 5.4 新增路由组件

- `routes/AmITheOne.tsx`
- `routes/Knowledge.tsx`
- `routes/KnowledgeDetail.tsx`
- `routes/Cycle.tsx`
- `routes/Settings.tsx`
- `routes/Stories.tsx` (从 Community 改名)
- `routes/StoryDetail.tsx` (从 PostDetail 改名)
- `routes/Care.tsx` (从 Therapy 改名)
- `routes/ReportUpload.tsx` (从 Upload 改名)
- `routes/ReportList.tsx` (从 Report 改名)

---

## 6. Mocks

| v1 | v2 | Action |
|---|---|---|
| `mocks/user.json` | `mocks/user.json` | KEPT + 新增 population 字段 |
| `mocks/reports.json` | `mocks/reports.json` | EXPAND 到 3–5 份真实 fixtures |
| `mocks/community.json` | `mocks/stories.json` | RENAME + 替换为 curated stories |
| `mocks/doctors.json` | `mocks/doctors.json` | KEPT |
| `mocks/therapy.json` | — | DELETE |
| — | `mocks/knowledgeCards.json` | NEW，20–30 张种子 |
| — | `mocks/selfAssessmentQuestions.json` | NEW，18 题 |
| — | `mocks/redFlagPatterns.json` | NEW，8–12 条 regex + 文案 |
| — | `mocks/medicationInfo.json` | NEW，6 种药物科普 |

---

## 7. 依赖

### 7.1 删除

- ❌ `@tanstack/react-query` — P1 全部 mock，Zustand 足够。P1.5 视情况再加

### 7.2 新增

- ✅ `idb-keyval` — IndexedDB 封装（opt-in 原图存储）
- ✅ `pinyin-pro`（可选）— stories 拼音检索

### 7.3 保留

React 18.3 / Vite 5.4 / TS 5.7 strict / Tailwind 3.4 / shadcn (Radix) / Zustand 4.5 / react-router-dom 6.x HashRouter / react-hook-form + zod / recharts / lucide-react / react-markdown + remark-gfm / dayjs / `@anthropic-ai/sdk` / vitest + @testing-library

---

## 8. Phase 表

| v1 | v2 |
|---|---|
| P0 Scaffold | P0 ✅（codex 已完成） |
| P0.5（implied cleanup） | **P0.5 v2 cutover**（本次 codex 任务） |
| P1（8 个 module 全启） | P1（3 核心 + 5 补充最小占位 + Claude + OCR + 红 flag） |
| — | **P1.5 Cloudflare Worker + 邀请码（NEW）** |
| P2 backend | P2（真后端 + RAG PMC OA + 社区 UGC） |

---

## 9. 移除功能

- ❌ 药物推荐引擎（v1: `lookupDrug` + `TherapyPlan.medications.purpose`）
- ❌ AI 生成的治疗方案（v1: `TherapyPlan.rationale`）
- ❌ 开放社区发帖（移至 P2）
- ❌ 评论功能（移至 P2）
- ❌ 用药依从性作为"方案"（v2: 只是用户打卡 log）
- ❌ 确诊输出（v1: `DiagnosisResult.meets: true`）
- ❌ phenotype A/B/C/D 用户暴露（医生用词，患者不需要）
- ❌ Dashboard 作为首页（v2 改为 AmITheOne）

---

## 10. 新增功能

- ✅ AmITheOne 自测漏斗
- ✅ Curated KnowledgeCard 库（带 citations + lastReviewedAt + aiAssisted 透明披露）
- ✅ Curated CommunityStory 库（带 consentStatus + anonymous + withdrawable + aiAssistKind）
- ✅ Red-flag 安全升级机制（regex + EmergencyCard + LLM 短路）
- ✅ 上传前图片压缩
- ✅ PromptBlock-based prompt caching
- ✅ Settings 完整化（Provider / Model / Proxy / Invite / Connectivity Test）
- ✅ Cloudflare Worker proxy 阶段（P1.5）
- ✅ IndexedDB opt-in 原图存储
- ✅ 显式 Content Governance 章节作为硬约束

---

## 11. P0.5 v2 cutover commit 分解（给 codex）

### Commit 1: code cleanup（保留 v1 P0.5 仍有效项）

- router.tsx 挂上 v2 §5 列出的 15 个 hash route，未实现指向 `<RoutePlaceholder/>`
- App.tsx 接 AppShell（三栏 grid 占位）
- `components/layout/*` stub 加 `// TODO P1:` 注释
- shadcn 半组件 dialog / sheet / tabs / toast / tooltip / avatar 用 shadcn CLI 真生成
- `lib/hormones.ts` 补全 12 字段 × 4 相位
- `lib/cycle.ts` 补 cyclePhase + fertileWindow
- 删除 `lib/api.ts`
- 5 个 LLM adapter 抽公共 `createPlaceholderClient(provider, phase)`
- `test/agent.test.ts` 改名 `test/storage.test.ts`
- 卸载 `@tanstack/react-query`；`main.tsx` 移除 `QueryClientProvider`

### Commit 2: v2 type & module rename

按本文档 §3、§4、§5 全部改名。重点：
- `types/report.ts::DiagnosisResult` → `types/report.ts::PcosFeatureMap`（重写）
- `types/therapy.ts` → `types/care.ts`；`TherapyPlan` → `CareNote`
- `types/community.ts` → `types/stories.ts`；`CommunityStory` 加治理字段
- `types/agent.ts::ChatOpts.system` 由 `string` 改为 `PromptBlock[]`
- `lib/pcos.ts::rotterdam` → `pcosFeatureMap`（2023 指南 + adult/adolescent + 排除项）
- `lib/tools/rotterdamCheck` → `computeFeatureMap`
- `lib/tools/lookupDrug` → `lookupMedicationInfo`
- 组件目录改名 `community/ → stories/`、`therapy/ → care/`
- mocks 改名 + 删除 therapy.json + 新增 4 个 JSON

### Commit 3: v2 新增 lib + content governance hard rules

- 新增 `lib/safety/redFlags.ts` + `detect.ts` + `escalation.ts`
- 新增 `lib/image/compress.ts` + `fileToVisionInput.ts` + `validateUpload.ts`
- 新增 `lib/knowledge/index.ts` + `loader.ts`
- 新增 `lib/citations.ts`
- 新增 `lib/llm/prompts/blocks.ts` + `safety.ts` + `medicalKnowledge.ts` + `userContext.ts`
  其中 `safety.ts` 必须包含 v2 §16 Content Governance §16.3 的全部规则
- 新增 `components/safety/EmergencyCard.tsx` + `RedFlagNotice.tsx`
- 新增 `components/amitheone/`、`components/knowledge/`、`components/cycle/` 目录骨架
- 安装 `idb-keyval`；新增 `lib/indexedDb.ts`

### Commit 4: 验证

- 跑 `pnpm test` 通过
- 跑 `pnpm build` 通过
- PR body 列出所有 commit 1–3 任务的勾选状态
