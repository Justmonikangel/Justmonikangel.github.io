# Cyster Frontend Architecture · v2

> **v2 是新的真理来源。** v1 (`pcos/ARCHITECTURE.md`) 保留作为对照，不再更新。
> 任何与本文档冲突的"自由发挥"必须先停下来回到这里对齐。
>
> 对照表：`pcos/MIGRATION-v1-to-v2.md`
> 决策日志：`pcos/DECISIONS.md`

## 0. TL;DR

- 产品定位从 "PCOS 智能咨询平台" 收紧为 **"PCOS 觉知 + 报告识读 + 共同体"**
- 首页是 **「是我吗」自测**，不是 Dashboard
- 技术核心是 **Report Literacy**（OCR + 校对 + 指标解释 + 缺失提醒 + 医生沟通清单）
- 产品核心是 **Curated Community Stories**（owner-written + 邀请制 + 知情同意）
- 不再做诊断、不再生成治疗方案、不再推荐药物或剂量
- `DiagnosisResult` → `PcosFeatureMap`（不输出 confirmed）
- `TherapyPlan` → `CareNote`（仅记录医生已开药，不生成方案）
- AI 仅可解释、引用、提示；不可处方
- 内容治理规则（`Content Governance` §16）是硬约束，违反 = bug
- 红 flag 升级机制（自杀念头、急性出血、胸痛等）必须实现
- 技术栈基本保留 v1：React + Vite + TS + Tailwind + shadcn + Zustand + HashRouter
- **删除 TanStack Query**（P1 不用）
- LLM 抽象用 `PromptBlock[]`（支持 Anthropic prompt caching）
- 图片压缩前置（max 1600px / JPEG 0.8 / target < 2MB）
- 原图默认不进 localStorage（可选 IndexedDB）
- P1: BYOK（开发者/评估者）→ P1.5: Cloudflare Worker proxy + 邀请码（真实 beta）→ P2: 后端 + RAG
- P1 验收：AmITheOne 自测可跑 + 一份报告可识读 + 5 个 curated stories 可看 + agent 可对话且服从内容规则

---

## 1. 产品定位（蓝色气泡）

Cyster 是 PCOS 的觉知运动工具，类比国外的 How to ADHD / Inflow / Numo 之于 ADHD。

**核心使命（用户原话）：**
> 让大家知道：啊，原来我感觉很糟糕，是因为多囊的缘故，不是我这个人的问题。

**Phase 1 价值链：**

```
不知道自己有 PCOS 的女性
  → 通过自测发现"我可能是" 
  → 上传报告获得"被翻译"的体验
  → 读到 curated stories 获得"我不是一个人"
  → 拿到 "下次看医生该问什么" 清单
  → 真的去看医生
```

Cyster 不参与诊断、不参与开药、不替代医生。它解决的是 **"我看不懂报告 / 医生没时间解释 / 我不知道为什么我这么糟糕 / 我不知道下一步该问什么"** 的信息落差。

---

## 2. 目标用户 & 核心 user story

### 2.1 目标用户

| 类型 | 占比目标 | 特征 |
|---|---|---|
| **未确诊但有症状者** | 60% | 月经不规律 + 痤疮/多毛/体重困扰 + 情绪问题。从未被告知可能是 PCOS |
| **疑似 PCOS 自查者** | 25% | 听说过 PCOS，想自查 |
| **已确诊但困惑者** | 15% | 拿到诊断书后没人解释，需要识读 + 共同体 |

### 2.2 核心 user story

```
作为一个长期月经不规律 + 容易疲倦 + 体重难降 的女性，
我想知道这些是不是 PCOS 的表现，
以便我决定要不要去医院做检查，去看哪个科，问什么问题。
```

```
作为一个刚拿到妇科 + 内分泌化验单的患者，
我想知道 LH/FSH 2.6 / AMH 7.1 / HOMA-IR 2.3 是什么意思，
以便我下次复诊能听懂医生的话，能问出有用的问题。
```

```
作为一个被诊断 PCOS 后陷入焦虑的患者，
我想看到其他 PCOS 患者的真实故事，
以便我知道我不是孤独的，知道这是一种可以管理的状态，
而不是我个人的失败。
```

---

## 3. 非目标（显式禁区）

Cyster Phase 1 **不做**：

- ❌ 不输出确诊结论（"你被诊断为 PCOS"）
- ❌ 不生成治疗方案（"建议方案"、"个性化方案"等表述）
- ❌ 不推荐药物或剂量（"建议使用二甲双胍 1500mg/d"）
- ❌ 不替代医生（"你不需要去医院"）
- ❌ 不做电子处方流转
- ❌ 不做 1v1 在线问诊撮合
- ❌ 不做开放发帖与评论（curated only in P1）
- ❌ 不接入医院 / EMR 数据
- ❌ 不自训 embedding / NLP 模型
- ❌ 不从小红书 / Reddit 未授权转载内容
- ❌ 不让 AI 生成虚构患者故事
- ❌ 不在 P1 做 RAG（curated cards + 静态引用足够）

---

## 4. 模块清单与优先级

### 4.1 三个核心模块

| 模块 | 路由 | 说明 |
|---|---|---|
| **「是我吗」自测** | `/` | 落地首页。30 秒 12–20 题自测，输出"勾了 N 条 PCOS 常见特征"，强 CTA 到 Report Literacy |
| **Report Literacy** | `/report` `/report/upload` `/report/:id` | 技术核心。OCR + 用户校对 + 逐项 KnowledgeCard 解释 + 缺失项提醒 + 医生沟通清单 |
| **Community Stories** | `/stories` `/stories/:slug` | 产品核心。Curated（owner 写 + 邀请制 + 知情同意）。无发帖、无评论 |

### 4.2 五个补充模块

| 模块 | 路由 | 说明 |
|---|---|---|
| **Knowledge Cards** | `/knowledge` `/knowledge/:slug` | 科普卡片库。带 citations + lastReviewedAt |
| **Care Notes (Doctor Prep)** | `/care` | 看医生前的准备清单 + 医生已开药记录（用户录入）+ 复诊提醒 |
| **Cycle Tracker** | `/cycle` | 月经周期追踪。从 v1 Dashboard 抽出 |
| **Doctor Info** | `/doctors` `/doctors/:id` | 医生信息库。仅展示，不撮合，不在线咨询 |
| **Agent** | `/agent` | 全屏对话。dock 是悬浮，全屏视图是补充 |
| **Profile / Settings** | `/profile` `/profile/settings` | API Key / Provider / Model / Proxy / Invite Code / 连通性测试 |

### 4.3 优先级声明

P1 必须实现 1–3；4–8 提供路由 + 最小可点击占位；商业化指标看 1 + 2 + 3 的留存。

---

## 5. 路由（13 routes）

HashRouter（GitHub Pages 兼容）：

```
#/                           AmITheOne (落地首页)
#/report                     报告列表（识读历史）
#/report/upload              上传 + OCR + 校对
#/report/:id                 单份报告识读
#/stories                    故事索引
#/stories/:slug              单个故事
#/knowledge                  科普卡片索引
#/knowledge/:slug            单个卡片
#/care                       Care Notes 看医生准备 + 已开药记录
#/cycle                      周期追踪
#/doctors                    医生信息库
#/doctors/:id                医生详情
#/agent                      全屏 agent
#/profile                    个人信息
#/profile/settings           设置（API key / Provider / Model / Proxy / Invite）
```

注意：`/dashboard` 在 v2 已删除。`/community` / `/community/:id` 改为 `/stories` / `/stories/:slug`。`/therapy` 改为 `/care`。`/upload` 移至 `/report/upload`。

---

## 6. 技术栈

### 6.1 沿用 v1

| 层 | 选型 | 备注 |
|---|---|---|
| Framework | React 18.3+ | |
| Build | Vite 5.4+ | |
| Language | TypeScript 5.5+ strict | |
| Style | Tailwind 3.4+ + CSS variables | tokens 沿用 v1 |
| UI primitives | shadcn/ui (Radix) | |
| Router | react-router-dom HashRouter | |
| State | Zustand 4.5+ | |
| Forms | react-hook-form + zod | |
| Charts | recharts | |
| Icons | lucide-react | |
| Markdown | react-markdown + remark-gfm | |
| Date | dayjs | |
| Anthropic SDK | `@anthropic-ai/sdk` | browser mode (P1) → proxy (P1.5+) |
| Test | vitest + @testing-library/react | |

### 6.2 删除

- ❌ **`@tanstack/react-query`** — P1 全部 mock + localStorage，Zustand 足够。P1.5 接 Worker 时再视情况引入

### 6.3 新增

- ✅ `idb-keyval`（轻量 IndexedDB 封装）— 用于 opt-in 保留原图
- ✅ `pinyin-pro`（可选，story 检索拼音匹配）

---

## 7. 仓库结构变化

基本沿用 v1，组件目录改名 + 新增：

```
pcos/_src/src/
├── routes/
│   ├── AmITheOne.tsx               (NEW，替代 Dashboard 首页)
│   ├── ReportList.tsx              (重命名 Report)
│   ├── ReportUpload.tsx            (重命名 Upload)
│   ├── ReportDetail.tsx            (沿用)
│   ├── Stories.tsx                 (重命名 Community)
│   ├── StoryDetail.tsx             (重命名 PostDetail)
│   ├── Knowledge.tsx               (NEW)
│   ├── KnowledgeDetail.tsx         (NEW)
│   ├── Care.tsx                    (重命名 Therapy)
│   ├── Cycle.tsx                   (NEW)
│   ├── Doctors.tsx                 (沿用)
│   ├── DoctorDetail.tsx            (沿用)
│   ├── Agent.tsx                   (沿用)
│   ├── Profile.tsx                 (沿用)
│   └── Settings.tsx                (NEW)
├── components/
│   ├── layout/                     (沿用 v1)
│   ├── ui/                         (沿用 shadcn)
│   ├── amitheone/                  (NEW)
│   │   ├── SelfAssessmentForm.tsx
│   │   ├── QuestionCard.tsx
│   │   └── ResultPanel.tsx
│   ├── report/                     (沿用，改名 literacy/)
│   │   ├── upload/Dropzone.tsx
│   │   ├── upload/OcrPreview.tsx
│   │   ├── upload/OcrProgress.tsx
│   │   ├── literacy/ReportCard.tsx
│   │   ├── literacy/HormonePanel.tsx
│   │   ├── literacy/MetabolicCard.tsx
│   │   ├── literacy/UltrasoundCard.tsx
│   │   ├── literacy/FeatureMapView.tsx     (NEW，代替 DiagnosisCriteria)
│   │   ├── literacy/MissingExclusions.tsx  (NEW)
│   │   ├── literacy/DoctorQuestions.tsx    (NEW)
│   │   └── literacy/TrendChart.tsx
│   ├── stories/                    (重命名 community/)
│   │   ├── StoryCard.tsx
│   │   ├── StoryList.tsx
│   │   └── ConsentNotice.tsx      (NEW)
│   │   // 删除：PostComposer, CommentThread (P2)
│   ├── knowledge/                  (NEW)
│   │   ├── KnowledgeCard.tsx
│   │   ├── CitationList.tsx
│   │   └── LastReviewedBadge.tsx
│   ├── care/                       (重命名 therapy/)
│   │   ├── DoctorPrepChecklist.tsx
│   │   ├── PrescribedMedicationLog.tsx
│   │   ├── FollowUpReminder.tsx
│   │   └── VisitNote.tsx
│   │   // 删除：PlanOverview, MealPlan, WorkoutPlan, LifestyleCard
│   ├── cycle/                      (NEW)
│   │   ├── CycleRing.tsx
│   │   ├── CycleHistory.tsx
│   │   └── SymptomLog.tsx
│   ├── doctors/                    (沿用)
│   ├── agent/                      (沿用 + 新增 SafetyBanner.tsx)
│   ├── safety/                     (NEW)
│   │   ├── EmergencyCard.tsx
│   │   └── RedFlagNotice.tsx
│   └── common/                     (沿用)
├── store/
│   ├── user.ts
│   ├── reports.ts
│   ├── stories.ts                  (重命名 community.ts)
│   ├── knowledge.ts                (NEW)
│   ├── care.ts                     (重命名 therapy.ts)
│   ├── cycle.ts                    (NEW)
│   ├── doctors.ts
│   ├── agent.ts
│   ├── selfAssessment.ts           (NEW)
│   └── ui.ts
├── lib/
│   ├── llm/
│   │   ├── index.ts
│   │   ├── types.ts                (ChatOpts.system: PromptBlock[])
│   │   ├── anthropic.ts
│   │   ├── openai.ts
│   │   ├── qwen.ts
│   │   ├── wenxin.ts
│   │   ├── deepseek.ts
│   │   ├── placeholder.ts          (NEW，公共 stub)
│   │   └── prompts/
│   │       ├── blocks.ts           (NEW，PromptBlock builders)
│   │       ├── safety.ts           (NEW，静态安全规则)
│   │       ├── medicalKnowledge.ts (NEW，PCOS 通用知识)
│   │       └── userContext.ts      (NEW，动态用户上下文 builder)
│   │       // 删除：therapy.ts, ocr.ts→改名 reportOcr.ts
│   ├── tools/
│   │   ├── index.ts
│   │   ├── computeFeatureMap.ts    (重命名 rotterdamCheck)
│   │   ├── lookupMedicationInfo.ts (重命名 lookupDrug)
│   │   ├── computeHomaIR.ts
│   │   ├── computeBMI.ts
│   │   ├── cyclePredict.ts
│   │   ├── searchKnowledge.ts      (NEW)
│   │   ├── searchStories.ts        (NEW，原 searchCommunity)
│   │   └── generateDoctorQuestions.ts (NEW)
│   │   // 删除：parseReport (identity stub)
│   ├── pcos.ts                     (重写：pcosFeatureMap + 2023 guideline + adult/adolescent)
│   ├── hormones.ts                 (扩展：12 字段 × 4 相位)
│   ├── cycle.ts                    (扩展：cyclePhase, fertileWindow)
│   ├── ocr.ts                      (重构：压缩 + LLM vision + zod 校验)
│   ├── image/                      (NEW)
│   │   ├── compress.ts
│   │   ├── fileToVisionInput.ts
│   │   └── validateUpload.ts
│   ├── safety/                     (NEW)
│   │   ├── redFlags.ts             (regex 列表)
│   │   ├── detect.ts               (检测函数)
│   │   └── escalation.ts           (升级逻辑)
│   ├── knowledge/                  (NEW)
│   │   ├── index.ts                (卡片注册表)
│   │   └── loader.ts
│   ├── citations.ts                (NEW，引用类型 + 渲染辅助)
│   ├── storage.ts
│   ├── crypto.ts
│   ├── indexedDb.ts                (NEW，opt-in 原图存储)
│   ├── utils.ts
│   // 删除：api.ts (P1.5 再加)
├── types/
│   ├── user.ts
│   ├── report.ts                   (PcosFeatureMap 替代 DiagnosisResult)
│   ├── care.ts                     (重命名 therapy.ts; CareNote 替代 TherapyPlan)
│   ├── stories.ts                  (重命名 community.ts; CommunityStory)
│   ├── knowledge.ts                (NEW; KnowledgeCard, Citation)
│   ├── selfAssessment.ts           (NEW; AmITheOneSession)
│   ├── doctor.ts
│   ├── agent.ts                    (PromptBlock, ToolCall)
│   ├── safety.ts                   (NEW; RedFlag, EmergencyContact)
│   └── common.ts                   (NEW; FeatureFlag, ExclusionStatus, NumValue)
├── mocks/
│   ├── user.json
│   ├── reports.json                (扩展为真实 PCOS 报告 fixtures)
│   ├── stories.json                (NEW，5–10 curated 故事)
│   ├── knowledgeCards.json         (NEW，20–30 张科普卡片)
│   ├── selfAssessmentQuestions.json (NEW)
│   ├── redFlagPatterns.json        (NEW，regex + 文案)
│   ├── doctors.json
│   └── medicationInfo.json         (NEW，~10 种 PCOS 相关药物的科普信息)
│   // 删除：therapy.json, community.json
└── test/
    ├── pcos.test.ts                (覆盖 2023 guideline + adult/adolescent)
    ├── hormones.test.ts
    ├── safety.test.ts              (NEW，red flag 检测)
    ├── image.test.ts               (NEW，压缩)
    └── storage.test.ts             (重命名 agent.test.ts)
```

---

## 8. 设计系统

沿用 v1 §4 颜色 token，无变动。新增两个语义色：

```css
:root {
  --cy-safety: #dc2626;        /* 红 flag 紧急色 */
  --cy-evidence: #5e7a8a;      /* citation 引用色 */
}
```

新增 utility：

```css
@layer utilities {
  .cy-citation {
    @apply text-xs leading-5 italic;
    color: var(--cy-evidence);
  }
  .cy-emergency {
    background: color-mix(in srgb, var(--cy-safety) 8%, white);
    border: 1px solid color-mix(in srgb, var(--cy-safety) 35%, white);
  }
}
```

---

## 9. 状态管理

Zustand stores，全部 `persist` 到 localStorage（除 `agent` 和 `ui.agentPanelOpen`）：

```
useUser            登录态、个人信息
useReports         报告列表 + 当前选中
useFeatureMaps     每份报告对应的 PcosFeatureMap 缓存
useCareNotes       Care Notes 列表
usePrescribedMeds  已开药记录（user-entered only）
useStories         curated stories（实际从 mocks 读，store 仅缓存阅读状态）
useKnowledge       knowledge cards（同上）
useSelfAssessment  当前/历史自测会话
useCycle           周期数据 + 症状日志
useDoctors         医生信息（mock）
useAgent           对话 session
useUi              theme / sidebar / panel / settings
useSafety          红 flag 触发历史（仅本地，不上报）
```

---

## 10. 域模型

### 10.1 通用基础类型

```ts
// types/common.ts
export interface NumValue {
  value: number;
  unit: string;
  ref?: [number, number];
  flag?: 'low' | 'normal' | 'high' | 'borderline';
}

export interface FeatureFlag {
  status: 'present' | 'absent' | 'unknown' | 'borderline';
  evidence: string[];        // ["AFC 35 (左) / 32 (右)", "self-report: 月经不规律 1 年+"]
}

export interface ExclusionStatus {
  status: 'normal' | 'abnormal' | 'unchecked' | 'not-applicable';
  evidence?: string;
}

export interface Citation {
  id: string;
  text: string;              // 显示文本，如 "ESHRE/AE-PCOS 2023 §3.2"
  url?: string;
  pmid?: string;
  doi?: string;
  accessedAt?: string;
}
```

### 10.2 User

```ts
// types/user.ts （沿用 v1 + 修订）
export interface User {
  id: string;
  displayName: string;
  avatar?: string;
  birthYear: number;
  heightCm?: number;
  weightKg?: number;
  cycleAvgDays?: number;
  lastPeriodStart?: string;
  population: 'adult' | 'adolescent' | 'unknown'; // NEW，初潮 < 8 年视为 adolescent
  goals: Array<'understand' | 'regulate-cycle' | 'fertility' | 'metabolic' | 'community'>;
  pcosStatus: 'not-explored' | 'self-suspected' | 'clinical-suspected' | 'clinically-confirmed';
  // 注意：删除 v1 的 phenotype 字段——不是患者关心的语言
}
```

### 10.3 Report & PcosFeatureMap（核心重写）

```ts
// types/report.ts
export interface Report {
  id: string;
  takenAt: string;
  cycleDay?: number;
  source: 'ocr' | 'manual' | 'imported';
  hormones?: HormonePanel;
  metabolic?: MetabolicPanel;
  ultrasound?: UltrasoundFindings;
  notes?: string;
  parsed: boolean;
  featureMapId?: string;     // 关联到 PcosFeatureMap

  // v2: 原图默认不持久化。如果用户 opt-in，存 IndexedDB
  originalImageRefs?: string[];   // IndexedDB keys, NOT data URLs
}

export interface HormonePanel { /* 沿用 v1，12 字段 */ }
export interface MetabolicPanel { /* 沿用 v1 */ }
export interface UltrasoundFindings { /* 沿用 v1 + AFC 强调 */ }

/**
 * v2 关键类型 —— 替代 v1 的 DiagnosisResult。
 * 不输出 confirmed。不打"诊断"字眼。
 */
export interface PcosFeatureMap {
  id: string;
  reportId?: string;          // 报告来源；可空（仅 self-assessment 的话）
  computedAt: string;
  population: 'adult' | 'adolescent' | 'unknown';
  criteriaReference: 'IntlPCOS2023';   // 锁死，不再 Rotterdam 2003

  /** 2023 指南三大特征 */
  features: {
    ovulatoryDysfunction: FeatureFlag;
    hyperandrogenism: {
      clinical: FeatureFlag;
      biochemical: FeatureFlag;
    };
    /** 注意：对成人，AMH 可替代 ultrasound。对青少年，超声和 AMH 都不用 */
    polycysticOvarianMorphology: {
      ultrasoundAFC: FeatureFlag;     // AFC ≥ 20 per ovary OR OV ≥ 10 mL
      amh: FeatureFlag;               // elevated AMH (lab-dependent)
      applicableForPopulation: boolean; // adolescent → false
    };
  };

  /** 共病/伴随特征（不参与诊断，只用于识读叙事） */
  associatedFeatures: {
    insulinResistance: FeatureFlag;
    centralAdiposity: FeatureFlag;
    depressionOrAnxietyRisk: FeatureFlag;
  };

  /** 2023 指南强制排除项 */
  exclusionsChecked: {
    thyroid: ExclusionStatus;          // TSH
    prolactin: ExclusionStatus;
    cah17OHP: ExclusionStatus;          // 17-hydroxyprogesterone
    fsh: ExclusionStatus;               // ruling out POI
    cushing: ExclusionStatus;
    androgenSecretingTumor: ExclusionStatus;
  };

  /** 输出语义 —— 这是 v2 的关键，不出现 "confirmed" */
  literacyOutput: {
    /** 一句话总结，用第三人称，禁止"你被诊断为..." */
    summary: string;
    /** 用户报告里观察到的、与 PCOS 一致的特征列表 */
    consistentFeatures: string[];
    /** 用户报告里观察不到 / 缺失数据的特征 */
    inconclusiveFeatures: string[];
    /** 缺失的排除性检查 */
    missingExclusions: string[];
    /** 推荐和医生讨论的问题 */
    suggestedDoctorQuestions: string[];
    /** 关联的 KnowledgeCard slug 列表 */
    relatedKnowledgeCardIds: string[];
  };

  /** 显式注释字段，UI 必须渲染这段 disclaimer */
  disclaimer: 'feature-map-only-not-diagnosis';

  /** 不输出 phenotype A/B/C/D —— 那是临床医生用的，患者不需要 */
}
```

### 10.4 Care Note（替代 TherapyPlan）

```ts
// types/care.ts
export interface CareNote {
  id: string;
  createdAt: string;
  updatedAt: string;
  kind: 'doctor-prep' | 'visit-log' | 'medication-log' | 'follow-up';
  visitDate?: string;
  doctorName?: string;
  doctorSpecialty?: string;

  /** 用户去看医生前的准备清单 */
  doctorPrepChecklist?: DoctorPrepItem[];

  /** 用户从医生那里听到的，自己录入 */
  doctorTold?: string[];

  /** 用户从医生那里得到的处方，自己录入（不 AI 推荐！） */
  prescribed?: PrescribedMedication[];

  /** 下次复诊要问的问题，AI 可建议 */
  questionsForNextVisit?: string[];

  /** 待办的检查 / 复查 */
  followUps?: FollowUp[];

  /** 用户自己写的 free text 笔记 */
  freeText?: string;

  // 注意：CareNote 不包含 "rationale" / "treatmentStrategy" / "AI-generated plan"
}

export interface DoctorPrepItem {
  id: string;
  text: string;
  category: 'symptoms' | 'lifestyle' | 'history' | 'medications' | 'questions';
  done: boolean;
}

export interface PrescribedMedication {
  id: string;
  drug: string;           // user-entered drug name
  dose: string;           // user-entered dose
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;   // doctor name
  notes?: string;

  /** 用户的依从性日志 —— 不是 AI 排的方案 */
  log: MedicationTakeLog[];
}

export interface MedicationTakeLog {
  date: string;
  taken: boolean;
  notedSideEffect?: string;
}

export interface FollowUp {
  id: string;
  kind: 'lab' | 'imaging' | 'visit' | 'self-check';
  dueAt: string;
  description: string;
  done: boolean;
}
```

### 10.5 KnowledgeCard

```ts
// types/knowledge.ts
export interface KnowledgeCard {
  id: string;
  slug: string;                    // URL 友好
  title: string;
  shortAnswer: string;             // 一句话回答
  category:
    | 'criteria'                   // 诊断标准 / Rotterdam vs 2023 / AFC
    | 'hormone'                    // FSH / LH / AMH / T 等单项解释
    | 'metabolic'                  // IR / 血糖 / 血脂
    | 'mental'                     // PCOS 与抑郁焦虑
    | 'lifestyle'                  // 饮食 / 运动 / 睡眠
    | 'medication-info'            // 药物机制科普（不个性化推荐）
    | 'doctor-visit'               // 看医生指南
    | 'misconception';             // PCOS 常见误解
  body: string;                    // markdown
  applicablePopulation: ('adult' | 'adolescent')[];

  /** 引用必须，至少 1 条 */
  citations: Citation[];

  /** 上次审校时间。超过 18 个月在 UI 标"需要重审" */
  lastReviewedAt: string;
  reviewedBy?: string;

  /** Phase 1 写在 mocks，Phase 2 进 CMS */
  authoredBy: 'owner' | 'invited-doctor' | 'invited-patient' | 'editorial-team';

  /** AI 协助痕迹，透明披露 */
  aiAssisted: boolean;
  aiAssistKind?: ('polish' | 'translate' | 'summarize')[];

  /** 关联科普卡片 */
  relatedCardIds?: string[];

  /** 关联 story */
  relatedStoryIds?: string[];
}
```

### 10.6 CommunityStory

```ts
// types/stories.ts
export interface CommunityStory {
  id: string;
  slug: string;
  authorPseudonym: string;           // "Pomelo", "山月" 等
  publishedAt: string;
  updatedAt: string;

  /** 故事元信息（用于过滤与共鸣匹配） */
  ageRange?: '<18' | '18-24' | '25-34' | '35+';   // 5 岁区间，匿名级别
  yearsFromSymptomToDiagnosis?: number;
  themes: Array<
    | 'diagnosis-delay'
    | 'mood'
    | 'fertility'
    | 'metabolic'
    | 'weight'
    | 'workplace'
    | 'relationship'
    | 'cultural-pressure'
  >;

  body: string;                      // markdown
  excerpt: string;                   // 用于卡片预览
  coverImage?: string;               // optional asset URL

  /** v2 治理元数据 —— 见 §16 Content Governance */
  consentStatus: 'granted-with-name' | 'granted-anonymous' | 'pending' | 'withdrawn';
  anonymous: boolean;
  anonymizationLevel: 'none' | 'light' | 'full';
  withdrawable: true;                // 字面量 true，类型层保证
  consentDocumentRef?: string;       // 知情同意书的本地 ref（不上传）

  /** AI 协助痕迹 */
  aiAssisted: boolean;
  aiAssistKind?: ('polish' | 'anonymize' | 'structure' | 'translate')[];

  /** 关联科普卡 */
  relatedCardIds?: string[];
}
```

### 10.7 AmITheOne Self-Assessment

```ts
// types/selfAssessment.ts
export interface SelfAssessmentQuestion {
  id: string;
  text: string;
  hint?: string;
  kind:
    | 'cycle'                  // 月经规律性、周期长度、量
    | 'androgen-clinical'      // 痤疮、多毛、脱发
    | 'metabolic'              // 体重、腰围、糖代谢家族史
    | 'mental'                 // 情绪、睡眠、注意力
    | 'fertility'              // 备孕情况
    | 'history';               // 初潮时间、既往病史
  answerType: 'yesno' | 'scale-5' | 'choice' | 'number';
  choices?: { value: string; label: string }[];
  /** 关联到 PcosFeatureMap.features，用于自测结果到识读的桥接 */
  mapsToFeature?: 'ovulatory' | 'androgen-clinical' | 'metabolic' | 'mental';
}

export interface AmITheOneSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  answers: Array<{ questionId: string; value: unknown }>;
  result?: SelfAssessmentResult;
}

export interface SelfAssessmentResult {
  /** 勾的特征总数 */
  pcosFeatureCount: number;
  /** 各 kind 命中数 */
  countsByKind: Record<SelfAssessmentQuestion['kind'], number>;
  /** 解释卡片 ID 列表 */
  explanationCardIds: string[];
  /** 下一步建议（不诊断！） */
  nextSteps: Array<
    | { kind: 'upload-report'; reason: string }
    | { kind: 'read-stories'; reason: string }
    | { kind: 'talk-to-doctor'; reason: string }
    | { kind: 'browse-knowledge'; cardId: string; reason: string }
  >;
  /** UI 必须渲染的免责声明 */
  disclaimer: 'self-assessment-not-diagnosis';
}
```

### 10.8 Agent & PromptBlock

```ts
// types/agent.ts
export interface PromptBlock {
  id: string;
  kind: 'safety' | 'medical-knowledge' | 'tool-spec' | 'user-context' | 'task';
  text: string;
  /** 'ephemeral' 让 Anthropic 缓存这块；false 不缓存 */
  cache?: 'ephemeral' | false;
}

export interface ChatOpts {
  system: PromptBlock[];           // v2 关键：array of blocks
  messages: ChatMessage[];
  tools?: ToolDef[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage { /* 沿用 v1 */ }
export interface ToolCall { /* 沿用 v1 */ }

export interface AgentSession {
  id: string;
  startedAt: string;
  messages: ChatMessage[];
  /** 注入 user-context 块用的 */
  context: {
    userId: string;
    lastReportId?: string;
    lastFeatureMapId?: string;
    cycleDay?: number;
    population: 'adult' | 'adolescent' | 'unknown';
  };
  /** 红 flag 触发历史（仅本地） */
  safetyEvents?: SafetyEvent[];
}
```

### 10.9 Safety

```ts
// types/safety.ts
export interface RedFlagPattern {
  id: string;
  category: 'severe-bleeding' | 'cardiovascular' | 'mental-health' | 'acute-abdomen';
  pattern: string;                 // 序列化的 regex（lib/safety/redFlags.ts 反序列化）
  severity: 'urgent' | 'critical';
  emergencyMessage: string;
}

export interface SafetyEvent {
  id: string;
  occurredAt: string;
  matchedPatternId: string;
  userInputSnippet?: string;       // 仅本地，不上报
  action: 'show-emergency-card' | 'stop-llm-call';
}

export interface EmergencyContact {
  label: string;
  phone?: string;
  description: string;
  region: 'CN' | 'global';
}
```

---

## 11. 模块详细设计

### 11.1 AmITheOne（首页自测）

**路由：** `/`

**目标：** 30 秒内让访客感受到"这描述的就是我"。

**流程：**
1. 落地页一句话："你最近感觉糟糕，可能不是你的问题——可能是 PCOS。"
2. 12–20 题（分 6 类：cycle / androgen / metabolic / mental / fertility / history）
3. 每题简短解释为什么这题相关
4. 提交后输出：
   - "你勾了 N 条 PCOS 常见特征"
   - 分类雷达图（cycle 几条 / 代谢几条 / 情绪几条...）
   - "你不是一个人——X% 的 PCOS 患者也勾了 [类别]"
   - 强 CTA："上传你的化验单，让 Cyster 帮你翻译" → `/report/upload`
   - 中 CTA："读读其他人的故事" → `/stories`
   - 弱 CTA："如果你想立刻聊聊" → `/agent`
5. 必须有的免责：「这是自测，不是诊断。最终判断要医生做。」

**反模式（禁止做的）：**
- ❌ 不输出 "你有 X% 概率是 PCOS"
- ❌ 不打分（怕用户把分数当诊断）
- ❌ 不让 AI 在结果页给"个性化建议"

### 11.2 Report Literacy（技术核心）

**路由：** `/report` / `/report/upload` / `/report/:id`

**上传流程：**
1. Dropzone 接受 image/jpeg, image/png, image/webp（**P1 不接 PDF**）
2. 单文件 ≤ 5MB 原图，最多 5 张
3. 前端压缩：`lib/image/compress.ts`（max 1600px / JPEG 0.8 / target < 2MB）
4. 校验：`lib/image/validateUpload.ts`
5. 调 `lib/ocr.ts` → Claude Sonnet vision 强制结构化输出
6. 用户校对 `OcrPreview` 表单（每个字段都可编辑）
7. 提交后写入 `useReports` + 触发 `computeFeatureMap`
8. 跳转 `#/report/:id`

**报告详情页结构：**
- 顶部摘要：拍摄日期、周期日、Population (adult/adolescent)
- HormonePanel：每个激素 row（值 + 单位 + 参考区间 + flag + 点击展开 KnowledgeCard）
- MetabolicCard：HOMA-IR 自动算 + 卡片解释
- UltrasoundCard：AFC 高亮（AI 友好的诊断锚点入口）
- **FeatureMapView**：可视化 PcosFeatureMap，3 大特征 + 排除项进度
- **MissingExclusions**：缺哪些排除性检查，告诉用户为什么"现在不能下结论"
- **DoctorQuestions**：「下次复诊建议问的 5 个问题」（AI 生成，但允许用户编辑）
- TrendChart：同指标多次趋势

**关键约束：**
- 任何输出不出现 "诊断为 PCOS" / "确诊"
- FeatureMapView 顶部必须有「这是特征图谱，不是诊断结论」横幅
- AI 解读用第三人称："PCOS 患者群体中..."，不是 "你应该..."

### 11.3 Community Stories（产品核心）

**路由：** `/stories` / `/stories/:slug`

**P1 内容来源：**
- 你（owner）写 5–10 篇核心故事
- 邀请 3–5 个 PCOS 朋友写各自的（必须签知情同意书）
- 不开放公开发帖、不开放评论

**列表页：**
- 卡片网格，按 theme 过滤（diagnosis-delay / mood / fertility / metabolic / weight / workplace / relationship / cultural-pressure）
- 每张卡片显示：化名、年龄区间、yearsFromSymptomToDiagnosis、theme tags、excerpt
- 每张卡片底部："共鸣 / 收藏 / 分享"（只 localStorage，不联网，不计数）

**详情页：**
- markdown 渲染 body
- 右侧 / 底部：相关 KnowledgeCard 链接
- 底部 disclaimer："这是 X 的真实经历，已经过她本人授权。不构成医学建议。"
- 底部撤回入口：「这是我的故事，我想撤下」→ 通过表单提交到 owner 邮箱（不入数据库）

**ConsentNotice 组件：**
- 每个 story 卡片都显示 consentStatus 微标
- granted-with-name / granted-anonymous / withdrawn 三态视觉区分
- withdrawn 状态 story 不在列表出现（store 过滤掉）

### 11.4 Knowledge Cards（科普卡片）

**路由：** `/knowledge` / `/knowledge/:slug`

**索引页：** 按 category 分区（criteria / hormone / metabolic / mental / lifestyle / medication-info / doctor-visit / misconception）

**详情页：**
- title + shortAnswer 大字
- markdown body
- 引用区（CitationList，每条带 link）
- `LastReviewedBadge`：超过 18 个月显示 "需重审"
- aiAssisted=true 时底部小字："本卡片由 AI 协助 [润色/翻译]"
- 关联：「下一篇 / 关联科普 / 相关故事」

**P1 内容来源：** owner 写 + 邀请医生审。20–30 张种子。

### 11.5 Care Notes（看医生准备）

**路由：** `/care`

**功能：**
- 创建 "doctor-prep" CareNote → 自动塞入清单模板：症状清单 / 过敏史 / 既往用药 / 想问的问题
- 创建 "visit-log" CareNote → 录入医生说了什么、开了什么药
- 已开药列表（PrescribedMedication[]）
- 用药日志（MedicationTakeLog[]，只是打卡 + 副作用记录）
- 复诊提醒（FollowUp[]）

**关键约束：**
- 处方完全由用户录入（拍照 OCR 也只是辅助）
- AI 可以提示"今天没打卡"，但不能调整剂量
- AI 不允许说"你应该停药"或"建议换药"

### 11.6 Cycle Tracker

**路由：** `/cycle`

**功能：**
- CycleRing 渲染当前周期日 + 排卵窗预测
- CycleHistory 时间线
- SymptomLog 每日症状打卡（情绪、痤疮、痛经、出血量）

**约束：**
- 不替代体温法 / 排卵试纸
- 推算只用 user 的 lastPeriodStart + cycleAvgDays，明示"仅供参考"

### 11.7 Doctor Info（医生信息库）

**路由：** `/doctors` / `/doctors/:id`

**功能：** 仅展示。城市 / 医院 / 科室 / 专长 / 公开介绍。

**P1 数据源：** mock 5–10 条公开信息（来源：医院官网公开页）。

**不做：** 不打分、不撮合、不在线问诊、不付费转诊。

### 11.8 Profile / Settings

**路由：** `/profile` `/profile/settings`

Settings 必须有的字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| Provider | dropdown | anthropic / openai / qwen / wenxin / deepseek |
| Model | dropdown | 按 provider 动态：claude-sonnet-4-6 / claude-opus-4-7 / claude-haiku-4-5 / gpt-4o / qwen-max ... |
| API Key | password input | 本地 obfuscate 存（lib/crypto.ts） |
| Proxy URL | text input | 可选；用户填自己的 Cloudflare Worker URL |
| Invite Code | text input | P1.5 启用 |
| Connectivity Test | button | 发一个 lightweight ping，2-3s timeout |
| Save original images | toggle | 默认 off；on 时原图存 IndexedDB |
| Export local data | button | 下载所有本地数据 JSON |
| Clear local data | button | 二次确认后清空 localStorage + IndexedDB |

---

## 12. AI Agent 架构

### 12.1 PromptBlock 三段式

System prompt 由 3 类块拼接，发给 LLM 时是数组：

```ts
const systemBlocks: PromptBlock[] = [
  // 块 1 静态安全规则（cache_control: ephemeral）
  {
    id: 'safety-rules',
    kind: 'safety',
    cache: 'ephemeral',
    text: SAFETY_RULES,        // 见 §16 Content Governance
  },
  // 块 2 静态医学知识（cache_control: ephemeral）
  {
    id: 'pcos-knowledge',
    kind: 'medical-knowledge',
    cache: 'ephemeral',
    text: PCOS_KNOWLEDGE_BLOCK,
  },
  // 块 3 静态 tool 描述（cache_control: ephemeral）
  {
    id: 'tools-spec',
    kind: 'tool-spec',
    cache: 'ephemeral',
    text: TOOLS_SPEC,
  },
  // 块 4 动态用户上下文（NOT cached）
  {
    id: 'user-context',
    kind: 'user-context',
    cache: false,
    text: buildUserContextBlock(ctx),
  },
];
```

Anthropic adapter 把它翻译成：

```ts
{
  system: [
    { type: 'text', text: SAFETY_RULES, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: PCOS_KNOWLEDGE_BLOCK, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: TOOLS_SPEC, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: userContextText }, // 无 cache_control
  ],
  messages: [...],
}
```

预期效果：多轮对话 cache hit 率 > 80%，输入 token 成本降 90%。

### 12.2 Safety 块内容（硬规则）

```
你是 Cyster，PCOS 觉知与报告识读助手。

# 绝对禁区（违反这些规则会让用户受伤害，必须严守）
- 你不能给出确诊结论。永远不说"你被诊断为 PCOS"、"你确诊 PCOS"、
  "you are diagnosed with PCOS" 或类似措辞。
- 你不能给出具体药物剂量、给药频率、用药时长建议。
- 你不能说"你应该用 X 药"、"X 药适合你"、"换 Y 药"、"加量"、"减量"。
- 你不能替代医生。涉及治疗讨论必须以"和医生讨论"收尾。
- 引用文献必须真实存在（核对 PMID/DOI）。不允许编造引用。
- 检测到 red flag（自杀念头、急性大出血、胸痛、晕厥、剧烈腹痛等），
  立刻输出紧急就医提示，跳过常规对话流程，不输出任何医学解释。

# 鼓励的措辞
- "PCOS 患者群体中..."
- "研究显示..."
- "下次和医生讨论..."
- "这个指标常见的解释是..."
- "你不是一个人，很多人有同样的经历"
- "这不是你的性格问题，是医学因素"

# 禁止的措辞
- "你应该..."
- "建议你..."（涉及具体药物/剂量时）
- "你比较合适..."
- "你确诊..."
- "推荐你..."（涉及具体处方时）
```

### 12.3 Tool registry

```ts
export const TOOLS = {
  compute_feature_map,       // 输入 features → PcosFeatureMap（pure function）
  compute_homa_ir,
  compute_bmi,
  cycle_predict,
  search_knowledge,          // 检索 KnowledgeCard 注册表
  search_stories,            // 检索 curated stories
  lookup_medication_info,    // 只返回科普信息
  generate_doctor_questions, // 基于 featureMap 生成"问医生清单"
};
```

每个 tool 是 pure function；最多 5 轮 tool loop。

### 12.4 Red-flag 短路

Agent loop 第一步是 `lib/safety/detect.ts`：

```
用户消息 → safety.detect(message)
  → 命中 → 渲染 EmergencyCard，不调 LLM，记 SafetyEvent
  → 未命中 → 继续 LLM 流程
```

---

## 13. OCR Pipeline

```
用户拖文件 (image/jpeg|png|webp; ≤5MB; ≤5 张)
  → lib/image/validateUpload (类型 + 大小)
  → lib/image/compress (max 1600px / JPEG 0.8 / 目标 < 2MB)
  → lib/image/fileToVisionInput (base64 + mimeType)
  → lib/ocr.ts (调 Claude vision, 强制 tool_use 输出 zod-validated JSON)
  → 写入 Report.parsed=false
  → 跳转 OcrPreview，用户校对每个字段
  → 提交 → Report.parsed=true → 触发 computeFeatureMap
```

**原图存储：**
- 默认：压缩后的 base64 仅用于发 LLM，不存任何地方
- Opt-in：用户在 Settings 勾选 "保留原图"，压缩后写入 IndexedDB
- 永不写入 localStorage（quota 太小）

**PDF：** P1 不支持。Phase 1.5 再加（依赖 pdfjs-dist）。

---

## 14. PCOS 业务逻辑

### 14.1 `pcosFeatureMap()` 实现要点

```ts
// lib/pcos.ts
export function pcosFeatureMap(input: {
  population: 'adult' | 'adolescent' | 'unknown';
  ovulatoryDysfunction?: FeatureFlag;
  clinicalHA?: FeatureFlag;
  biochemicalHA?: FeatureFlag;
  ultrasoundAFC?: FeatureFlag;
  amh?: FeatureFlag;
  exclusions: PcosFeatureMap['exclusionsChecked'];
  reportId?: string;
}): PcosFeatureMap {
  // 1. 成人 vs 青少年路径分歧
  // 2. 青少年禁用 ultrasoundAFC 和 amh 作为 PCOM 证据
  // 3. 成人 PCOM 证据 = ultrasoundAFC OR amh
  // 4. 计算 consistentFeatures / inconclusiveFeatures
  // 5. 计算 missingExclusions
  // 6. 永不输出 "confirmed"，只输出 literacyOutput.summary
  // 7. disclaimer 字面量 'feature-map-only-not-diagnosis'
}
```

**测试用例（写进 `test/pcos.test.ts`）：**

```
1. 成人，所有 features present，exclusions 全 normal → consistent，summary 说"特征一致"
2. 成人，features present 但 exclusions 缺 TSH/PRL → summary 说"需要先排除其他原因"
3. 青少年，features 仅 androgen + ovulatory → consistent
4. 青少年，pcom 证据 present 但 features 仅 androgen → inconsistent（青少年不能用 PCOM）
5. 任何情况都不输出 "confirmed" / "诊断"
```

### 14.2 单位 & 参考区间

`lib/hormones.ts` 补全 12 字段 × 4 相位（卵泡 / 排卵 / 黄体 / 绝经后）参考区间表。

`computeHomaIR` 输入 fasting glucose (mmol/L) + fasting insulin (μIU/mL)，公式 `(g × i) / 22.5`。

### 14.3 `lookupMedicationInfo`（替代 lookupDrug）

**只返回科普，不返回个体适配判断。**

```ts
{
  drug: 'Metformin',
  zhName: '二甲双胍',
  brand: ['格华止', '迪化糖锭'],
  mechanism: '主要通过抑制肝糖输出和改善外周组织对胰岛素的敏感性...',
  pcosCommonUses: ['改善胰岛素抵抗', '辅助降低雄激素水平', '少数报告改善月经规律'],
  commonSideEffects: ['胃肠道反应（恶心、腹泻）', 'B12 长期使用可能下降'],
  notesForDoctorDiscussion: [
    'PCOS 中多数为说明书外用药，需医生评估',
    '胃肠耐受差时医生可能建议从小剂量开始',
    '备孕女性需医生评估是否继续',
  ],
  citations: [
    { text: 'Cochrane Review CD003053', url: '...' },
    { text: 'Intl PCOS Guideline 2023 §5.3', url: '...' },
  ],
}
```

**绝对不能有：** "适合你"、"推荐剂量"、"用法用量"、"应该服用"

P1 种子 6 条：Metformin / 短效避孕药（COC，含达英-35 / 优思明）/ 螺内酯 / 来曲唑 / 克罗米芬 / 肌醇。

---

## 15. Mock 数据 & Curated 内容来源

### 15.1 Mocks 清单

| 文件 | 内容 | 数量 |
|---|---|---|
| `user.json` | 默认 demo 用户 | 1 |
| `reports.json` | 真实化验单 fixtures（脱敏） | 3–5 |
| `stories.json` | curated stories 种子 | 5–10 |
| `knowledgeCards.json` | 科普卡片种子 | 20–30 |
| `selfAssessmentQuestions.json` | 自测题库 | 18 |
| `redFlagPatterns.json` | red flag regex 列表 + 文案 | 8–12 |
| `doctors.json` | 公开渠道医生信息 | 5–10 |
| `medicationInfo.json` | 药物科普信息 | 6 |

### 15.2 Curated 内容生产流程

**Knowledge Cards：**
1. owner / 邀请医生写初稿（markdown）
2. AI 协助润色 / 翻译 / 总结（aiAssisted=true，aiAssistKind 记录）
3. owner 终审
4. 上线，记 lastReviewedAt
5. 每 12 个月触发"待复审"提醒

**Community Stories：**
1. 受访者（你 / 邀请的朋友）口述或自写
2. 签知情同意书（结构 = `consentDocumentRef` 指向本地 PDF/图片）
3. AI 协助脱敏 / 润色 / 结构化（绝不"生成"）
4. 受访者校阅后定稿
5. 上线 with consentStatus=granted-{with-name|anonymous}
6. 撤回入口永久可用

---

## 16. Content Governance（关键新章节）

> Cyster 是觉知 + 识读工具，不是医疗工具。
> 所有内容产出受以下规则约束。**违反这些规则等同 P0 blocker。**

### 16.1 Knowledge Cards 规则

| ID | 规则 |
|---|---|
| **K-1** | 每张 KnowledgeCard 必须有 ≥ 1 条 citation（Cochrane / ESHRE / AE-PCOS / Intl PCOS 2023 / Endocrine Society / PMC OA / 国内指南） |
| **K-2** | 每张卡片必须有 `lastReviewedAt`，超过 18 个月在 UI 显示"需重审"badge |
| **K-3** | 不允许 AI 生成卡片正文。卡片由 owner 或邀请医生写。AI 可：润色 / 翻译 / 总结 |
| **K-4** | 卡片不允许出现 "你应该" / "建议你" / "适合你" 等第二人称指令。用第三人称："PCOS 患者群体中..."、"研究显示..." |
| **K-5** | 涉及药物的卡片只能说明机制 / 群体证据 / 注意事项，不能写"用法用量" / "推荐剂量" / "如何选择" |

### 16.2 Community Stories 规则

| ID | 规则 |
|---|---|
| **S-1** | 每个 story 必须有 `consentStatus`，只有 `granted-*` 才能上线 |
| **S-2** | `anonymous=true` 时必须 `anonymizationLevel ≥ 'light'`：人名、医院名、城市精确到县市级、年龄取 5 岁区间 |
| **S-3** | `withdrawable=true` 始终成立。用户提撤回，48 小时内下架 |
| **S-4** | P1 不开放真实发帖 / 评论。所有 stories 来自：(a) owner 撰写 / (b) 邀请的 PCOS 朋友（书面同意书归档） |
| **S-5** | 严禁从小红书 / Reddit r/PCOS / 微博 / 知乎 未经授权转载 |
| **S-6** | AI 不能"生成"虚构患者故事。AI 只能：(a) 润色 / (b) 脱敏 / (c) 结构化 / (d) 翻译。必须保留 `aiAssistKind` 元数据 |

### 16.3 AI 输出禁区

| ID | 规则 |
|---|---|
| **A-1** | 禁止 "confirmed" / "确诊" 措辞，不论上下文 |
| **A-2** | 禁止具体药物剂量、给药频率、用药时长建议 |
| **A-3** | 禁止 "你应该用 X 药" / "X 药适合你" / "换 Y 药" / "加量" / "减量" |
| **A-4** | 治疗讨论必须以"和医生讨论"收尾 |
| **A-5** | 引用文献必须真实存在（核对 PMID / DOI）。不允许编造 |
| **A-6** | 检测到 red flag → 立刻输出紧急就医提示，跳过常规对话流程 |

### 16.4 Red-flag Escalation 规则

| ID | 规则 |
|---|---|
| **R-1** | 关键词触发器（regex 列表配置在 `lib/safety/redFlags.ts` 或 `mocks/redFlagPatterns.json`），覆盖：急性大出血 / 心血管 / 心理危机 / 急腹症 |
| **R-2** | 触发后 UI 立刻插入 `EmergencyCard`，包含：120 / 110 / 12320 卫生热线 / 北京心理危机研究与干预中心 010-82951332 / "请立即前往最近的急诊科" |
| **R-3** | 触发后 agent 当轮对话停止 LLM 调用，不输出任何医学解释。只输出 EmergencyCard 内容 |
| **R-4** | 触发事件记入 `useSafety` store（仅本地，不上报） |
| **R-5** | red flag false positive 比 false negative 危险得多 → 宁可多报警，不能漏报 |

### 16.5 实施约束

- `lib/safety/detect.ts` 是 agent loop 第一步，先于 LLM 调用
- `lib/llm/prompts/safety.ts` 的内容必须复刻 §16.3，并放入 system prompt 第一块（cache_control: ephemeral）
- 所有 Knowledge Card / Community Story 在写入 mock 时必须通过 zod schema 验证（治理字段不能缺）

---

## 17. 安全与隐私

### 17.1 本地优先

- 所有用户数据存 localStorage / IndexedDB，不上传任何第三方（除 LLM 请求 payload）
- Settings 提供"导出全部数据"和"清空全部数据"

### 17.2 API Key

- 用户在 Settings 输入
- 本地 base64 + XOR obfuscate 存（沿用 v1 `lib/crypto.ts`）
- "Proxy URL" 字段让用户填自己的 Cloudflare Worker（P1.5 改为邀请码模式）

### 17.3 连通性预检

- Settings 有 "Test Connectivity" 按钮
- 发一个 lightweight 请求（如 `messages.create` with `max_tokens: 1`）
- 2.5s timeout → 标红 + 提示"检查 API Key / 代理 / 网络"

### 17.4 数据出境（中国大陆视角）

- 默认 provider 是 anthropic（境外）
- 中国用户引导优先 Qwen / Wenxin / DeepSeek（境内可达）
- Disclaimer："使用境外 provider 时，你的输入会发送到境外服务"

---

## 18. 构建 & 部署

沿用 v1 §14：
- Vite `base: '/pcos/'`
- `outDir: '..'`, `emptyOutDir: false`
- `npm run prebuild` 清旧产物（`pcos/index.html` + `pcos/assets/`）

GitHub Actions（可选）：触发条件 `paths: ['pcos/_src/**']`，build 后 commit 回 main。

---

## 19. 实施 Phase

| Phase | 内容 | 状态 |
|---|---|---|
| **P0** | Scaffold（codex 已交付） | ✅ |
| **P0.5** | v2 cutover：cleanup（v1 §6 残留）+ type/module rename + 新增 lib + content governance hard rules | ⏳ 当前 |
| **P1** | 三个核心模块（AmITheOne / Report Literacy / Stories）+ 五个补充模块的最小可点击占位 + Claude adapter + OCR + 红 flag | 待 |
| **P1.5** | Cloudflare Worker proxy + 邀请码 + 第一批 20–50 个 PCOS beta 用户 | 待 |
| **P2** | 真后端 + 用户系统 + 支付 + RAG（PMC OA + 指南库）+ 社区 UGC + 评论 | 待 |
| **P3** | DTx 申报 + 商业化 | 远期 |

P1 拆解（每个 phase 一个 PR）：

| Sub-phase | 内容 |
|---|---|
| P1.1 | AppShell 真正落地 + 13 个路由全通 + sidebar 跟随 |
| P1.2 | AmITheOne 自测全流程（题库 + 提交 + 结果 + CTA） |
| P1.3 | Knowledge Cards 库（20–30 张种子上线）+ 索引页 + 详情页 |
| P1.4 | Report Literacy（OCR + Preview + FeatureMapView + DoctorQuestions） |
| P1.5 | Agent（PromptBlock + Anthropic adapter + tools + red-flag short-circuit） |
| P1.6 | Stories（5–10 篇种子 + 列表 + 详情 + ConsentNotice） |
| P1.7 | Care Notes + Cycle + Doctors + Profile/Settings |
| P1.8 | Polish + a11y + 移动端 |

---

## 20. 验收清单（P1 全部完成时）

- [ ] `/` 是 AmITheOne 自测，首屏可见标题 + 第一题
- [ ] 完成自测能看到结果 + 强 CTA 进 `/report/upload`
- [ ] 上传一张化验单图，OCR 能填充 ≥ 5 个字段
- [ ] 报告详情页显示 PcosFeatureMap，**永远不出现 "确诊" 字样**
- [ ] FeatureMapView 顶部有 "feature-map-only-not-diagnosis" 横幅
- [ ] 至少 5 篇 curated stories 可读，每篇有 consent 标识
- [ ] 至少 20 张 KnowledgeCard 可读，每张至少 1 条引用 + lastReviewedAt
- [ ] Agent 在 Settings 配好 key 后能流式回答
- [ ] Agent 涉及药物时**绝不**给出剂量建议
- [ ] 输入 "我想自杀" / "胸口剧痛" 立刻触发 EmergencyCard
- [ ] Settings 完整：Provider / Model / Key / Proxy / Invite / Connectivity Test
- [ ] 所有用户数据仅在 localStorage / IndexedDB
- [ ] TypeScript strict 零 error；`pnpm test` 通过
- [ ] 移动端 ≥ 375px 可用
- [ ] Lighthouse a11y ≥ 90

---

## 21. 未决问题

- 知情同意书的法律模板（找律师确认；P1 用占位模板，P1.5 前定稿）
- 邀请码生成与发放渠道（小红书私信 / 朋友圈定向 / PCOS 群）
- 中国大陆用户引导默认 provider 的策略（Qwen-Plus 起步？）
- 自测题库的医学审校人（找一位三甲医院妇科或生殖中心医生）
- 是否 P1.5 之前需要做 DPIA / 隐私影响评估（建议做，律师轻量级一份）

---

**本文档是 codex 的唯一真理来源。代码与文档冲突时，先改文档再改代码。**
