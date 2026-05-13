# Cyster Architecture Decisions Log

> ADR-style 决策日志，记录从 v1 到 v2 的关键架构与产品决策。
> 三方 review：Claude（架构作者）/ Gemini（技术细节）/ GPT（产品边界与医学合规）。
>
> 格式：Status / Context / Decision / Consequences / Sources

---

## D-001 · 产品定位收紧为"觉知 + 识读 + 共同体"

- **Status:** Accepted (2026-05-13)
- **Context:** v1 架构漂移到 "PCOS 智能咨询平台"，包含 DiagnosisResult、
  TherapyPlan、lookupDrug 等模块。这接近受监管的医疗产品，超出单人 vibe coding
  能承载的合规与责任范围。
- **Decision:** Cyster Phase 1 显式**不**做诊断、不做治疗、不推荐药物。核心价值是：
  (a) 帮助女性识别"我感觉糟糕可能是 PCOS，不是我的人格问题"
  (b) 把医学报告翻译成可理解的语言
  (c) 用真实故事建立"我不是一个人"的共同体
- **Consequences:** 所有 "Therapy" / "Diagnosis" / "Drug recommendation" 实体
  重命名或删除。产品定位类比 ADHD 觉知工具（How to ADHD / Inflow / Numo），
  不是临床决策支持。
- **Sources:** 用户原话 "让大家知道...不是我这个人的问题"；GPT review §1；三方共识

---

## D-002 · 用 2023 国际 PCOS 指南替代 Rotterdam 2003

- **Status:** Accepted (2026-05-13)
- **Context:** v1 用 Rotterdam 2003（三选二，无强制排除）。当前临床共识是 2023 国际
  PCOS 指南（Monash 牵头），明确要求排除其他病因，并且 AMH 可替代超声做 PCOM 证据。
  青少年完全不应用超声/AMH 诊断。
- **Decision:** 所有 feature-mapping 逻辑使用 2023 指南：
  - 成人：3 选 2（雄激素过多 / 排卵障碍 / PCOM-on-US 或 AMH-elevated）
  - AMH 可在成人替代超声
  - 青少年：仅雄激素过多 + 排卵障碍，禁用超声 / AMH
  - 强制排除项：TSH / 催乳素 / 17-OHP / FSH / Cushing / 雄激素分泌肿瘤
- **Consequences:** `DiagnosisResult` 重构为 `PcosFeatureMap`，不输出 confirmed。
  青少年分支单独处理。
- **Sources:** GPT review §3；ESHRE/AE-PCOS 2023 monograph；Endocrine Society 2023

---

## D-003 · AI 输出绝对不含确诊、处方、剂量建议

- **Status:** Accepted (2026-05-13)
- **Context:** AI 医疗建议存在监管与安全风险。单人 vibe coding 不能承载诊疗责任。
- **Decision:** System prompt 与 tool 层硬规则：
  - 禁止 "confirmed" / "确诊" 字眼
  - 禁止具体药物剂量、给药频率、用药时长建议
  - 禁止 "X 药适合你" 框架
  - 治疗讨论必须以"和医生讨论"收尾
- **Consequences:** `lookupDrug` → `lookupMedicationInfo`（仅科普）。
  `TherapyPlan` → `CareNote`（用户录入，非 AI 生成方案）。
- **Sources:** GPT review §2；Content Governance §16.3；PIPL + NMPA 精神

---

## D-004 · PromptBlock[] 替代单字符串 system prompt

- **Status:** Accepted (2026-05-13)
- **Context:** Anthropic prompt caching 基于内容块前缀匹配。把动态用户上下文插入
  单一字符串 system 导致 cache hit 率为 0。
- **Decision:** `ChatOpts.system: PromptBlock[]`，每块带 `kind`（safety / medical-knowledge /
  tool-spec / user-context / task）和 `cache?: 'ephemeral' | false`。
  Adapter 层翻译为 provider 特定的 cache_control 标记。
- **Consequences:** 预期多轮对话 cache hit > 80%，输入 token 成本降 90%。
- **Sources:** GPT review §5；Gemini review §3；Anthropic prompt caching docs

---

## D-005 · BYOK 仅服务于 dev/eval；P1.5 引入 Cloudflare Worker 代理

- **Status:** Accepted (2026-05-13)
- **Context:** BYO API key 模式对评估者可行，对真实 PCOS 患者用户不可行
  （注册、绑卡、风控门槛高，覆盖率 < 1%）。
- **Decision:** 三段式上线：
  - P1：BYOK（开发者、朋友、demo）
  - P1.5：Cloudflare Worker proxy + 邀请码（20–50 个 beta 患者）
  - P2：真后端 + 账户系统 + 支付
- **Consequences:** Worker 持有真实 API key，执行邀请码校验 + 用户级 rate limit。
  前端继续 GitHub Pages 静态部署。Beta 用户体验为"填邀请码"，看不到 API key。
- **Sources:** Gemini review §2；GPT review §1；Claude 战略问题回应

---

## D-006 · 图片必须在调 vision API 前压缩

- **Status:** Accepted (2026-05-13)
- **Context:** Anthropic vision API 每图限 ~5MB（base64 后）。手机原图 3–8MB，
  base64 +33% 膨胀。直接上传会失败或超时。
- **Decision:** Canvas 压缩：max width 1600px，JPEG quality 0.8，
  目标产物 < 2MB，单 session 最多 5 张图。
- **Consequences:** 新增 `lib/image/compress.ts`。PDF 支持延后至 P1.5（pdfjs-dist 太重）。
- **Sources:** Gemini review §2；Anthropic vision API 限制

---

## D-007 · 原图默认不进 localStorage

- **Status:** Accepted (2026-05-13)
- **Context:** localStorage 配额 ~5–10MB 总量。把报告原图存 data URL 2–3 张就爆。
- **Decision:** Pipeline：压缩 → 送 vision → 仅存结构化结果。可选 opt-in 把原图存
  IndexedDB（配额更大）。
- **Consequences:** `Report.rawFiles` 字段删除，新增 `originalImageRefs?: string[]`
  指向 IndexedDB key。引入 `idb-keyval` 依赖。
- **Sources:** GPT review §4

---

## D-008 · P1 使用 curated KnowledgeCard，RAG 延后至 P2

- **Status:** Accepted (2026-05-13)
- **Context:** 公开数据库 RAG（PubMed Central、Cochrane、指南）技术上有价值，
  但引入许可复杂性、向量存储运维、内容质量 QA。P1 不应承担。
- **Decision:** P1 ship hand-curated KnowledgeCard registry，引用硬编码静态。
  P1.5 加 local full-text search。P2 引入 RAG（PMC OA subset + 开放指南语料），
  必须 license-aware。
- **Consequences:** 类型 `KnowledgeCard.citations: Citation[]` 现在静态，
  P2 接 RAG 时无需 schema 变更。
- **Sources:** GPT review §7

---

## D-009 · P1 社区仅 curated，不开放 UGC 发帖/评论

- **Status:** Accepted (2026-05-13)
- **Context:** 开放发帖需要内容审核、法律责任处理（同伴间的医疗建议）、垃圾过滤等。
  冷启动问题让空 UGC 比无 UGC 更糟。
- **Decision:** P1 curated stories only：
  - 产品 owner 撰写
  - 邀请的 PCOS 朋友撰写（书面知情同意书归档）
  - 严禁从小红书 / Reddit r/PCOS / 微博 / 知乎 未经授权转载
- **Consequences:** 新 `CommunityStory` 含 `consentStatus`、`anonymous`、
  `anonymizationLevel`、`withdrawable`、`aiAssistKind` 元数据。
  P1 无 PostComposer / CommentThread。
- **Sources:** GPT review §3；D-001 衍生

---

## D-010 · Red-flag 安全升级机制必要

- **Status:** Accepted (2026-05-13)
- **Context:** 用户可能报告严重症状（大出血、胸痛、自杀念头）。AI 必须升级，
  不可诊断或抚慰。
- **Decision:** `lib/safety/redFlags.ts` 维护 regex 类别：
  - 急性大出血
  - 心血管
  - 心理危机
  - 急腹症（PCOS 卵巢扭转风险）
  命中后 agent 停止常规流程，渲染 `EmergencyCard`，包含 120 / 110 / 12320 / 010-82951332。
- **Consequences:** 所有用户输入管道（chat / 自测 / story upload）先经
  red-flag 检测再进 LLM。
- **Sources:** GPT review Content Governance R-1..R-5

---

## D-011 · AFC / AMH 是 literacy 锚点而非诊断阈值

- **Status:** Accepted (2026-05-13)
- **Context:** 我先前把 AFC 定位为"主诊断锚点"。即便用"诊断"字眼也越线。
- **Decision:** AFC ≥ 20/卵巢、AMH 升高被描述为"AI 最易解释的指标，因为是具体数字"，
  作为 literacy 内容组织的脊柱，不作为诊断触发条件。
- **Consequences:** `pcosFeatureMap()` 输出特征是否存在，不输出分数。
  文案禁止"AFC 提示 PCOS"。
- **Sources:** GPT review §6

---

## D-012 · TanStack Query 移出 P1，P1.5+ 视需要回归

- **Status:** Accepted (2026-05-13)
- **Context:** P1 全部 mock + localStorage。Zustand 处理所有本地状态。
  TanStack Query 在真实网络调用落地前是死重量。
- **Decision:** P1 依赖移除 `@tanstack/react-query`。P1.5 接 Worker 代理时再考虑。
- **Consequences:** 更小 bundle，更简单的 dev 心智。`main.tsx` 删除 `QueryClientProvider`。
- **Sources:** Gemini review §1；GPT review "我会删/延后的东西"

---

## D-013 · 技术栈基础保留（HashRouter / Vite / Zustand / shadcn）

- **Status:** Reaffirmed (2026-05-13)
- **Context:** 部分 reviewer 提议迁 Next.js / Astro。
- **Decision:** 保留 Vite + React + HashRouter（GitHub Pages 兼容）。
  Zustand 仍为主状态管理。
- **Consequences:** 无 SSR / RSC 复杂度。构建目标不变。
- **Sources:** GPT review §8

---

## D-014 · AI 不能"生成"虚构患者故事

- **Status:** Accepted (2026-05-13)
- **Context:** AI 生成的"案例"风险：失去真实性、可能编造医学事实、损害社区信任。
- **Decision:** AI 仅协助 polish / anonymize / structure / translate。
  所有 `CommunityStory` 必须有 `aiAssistKind` 元数据明示。AI 生成虚构故事 = 禁止。
- **Consequences:** 新增 `CommunityStory.aiAssisted: boolean` 与
  `aiAssistKind: ('polish' | 'anonymize' | 'structure' | 'translate')[]`。
  P1 全部原始内容由 owner 与邀请的患者撰写。
- **Sources:** GPT review Content Governance S-6

---

## D-015 · KnowledgeCard 必有 lastReviewedAt

- **Status:** Accepted (2026-05-13)
- **Context:** 医学知识会过时。3 年前审过的卡片不该静默看起来权威。
- **Decision:** `KnowledgeCard.lastReviewedAt` 必填。超过 18 个月的卡片在 UI
  显示"需重审"badge。
- **Consequences:** 编辑流程必须包含定期复审。
- **Sources:** GPT review Content Governance K-2

---

## D-016 · Curated Stories 来源仅 owner-written + 邀请制 + 知情同意

- **Status:** Accepted (2026-05-13)
- **Context:** Story 来源候选：(A) owner-written + invited, (B) 小红书/Reddit 转载,
  (C) AI 生成。GPT 与 Claude 均推荐 A。
- **Decision:** P1 stories 仅来自：
  - 产品 owner（你）撰写
  - 邀请的 PCOS 朋友撰写，必须书面知情同意，consentDocumentRef 归档
  - 严禁 B / C
- **Consequences:** 知情同意书法律模板列入未决事项。P1 数量目标 5–10 篇。
- **Sources:** GPT review §3 + 用户拍板 "A"

---

## D-017 · Settings 必须暴露 Provider / Model / Proxy / Connectivity Test

- **Status:** Accepted (2026-05-13)
- **Context:** 仅一个 API Key 字段无法满足中国大陆用户与多 provider 切换需求。
- **Decision:** Settings 完整字段：
  - Provider 下拉（5 个）
  - Model 下拉（按 provider 动态）
  - API Key
  - Proxy URL（可选）
  - Invite Code（P1.5 启用）
  - Connectivity Test 按钮
  - Save original images toggle
  - Export / Clear local data 按钮
- **Consequences:** `routes/Settings.tsx` 新建。`useUi` store 字段扩展。
- **Sources:** Gemini review §3；Claude review

---

## D-018 · 首页换为 AmITheOne 自测

- **Status:** Accepted (2026-05-13)
- **Context:** v1 首页是 Dashboard，假设用户已经知道自己是 PCOS。
  实际目标用户是 "不知道自己可能是 PCOS" 的人。
- **Decision:** `/` 路由是 `AmITheOne` 自测漏斗。Dashboard 删除。
- **Consequences:** 路由表重排。`Cycle` / `Today` widgets 各归各位。
- **Sources:** GPT review §1；D-001 衍生

---

## 评审者归因总结

| 决策 | Claude | Gemini | GPT |
|---|---|---|---|
| D-001 产品定位 | partial | — | **lead** |
| D-002 2023 指南 | — | partial | **lead** |
| D-003 输出禁区 | — | partial | **lead** |
| D-004 PromptBlock[] | — | partial | **lead** |
| D-005 P1.5 Worker | partial | **lead** | partial |
| D-006 图片压缩 | — | **lead** | partial |
| D-007 原图不入 localStorage | — | — | **lead** |
| D-008 P1 curated cards / P2 RAG | partial | — | **lead** |
| D-009 P1 curated stories | — | — | **lead** |
| D-010 Red-flag | — | — | **lead** |
| D-011 AFC/AMH 锚点 | wrong-then-corrected | — | **lead** |
| D-012 砍 TanStack Query | partial | **lead** | **lead** |
| D-013 保留 stack | **lead** | — | partial |
| D-014 AI 不生成故事 | — | — | **lead** |
| D-015 lastReviewedAt | — | — | **lead** |
| D-016 Stories 来源 | partial | — | **lead** + owner 拍板 |
| D-017 Settings 完整化 | partial | **lead** | — |
| D-018 AmITheOne 首页 | partial | — | **lead** |

**统计：** GPT 主导 14 条，Gemini 主导 3 条，Claude 主导 1 条。GPT 在医学边界与产品
定位上提供了最大增益。Gemini 在技术细节（图片、缓存）上敏锐。Claude 在 codex
实施层 review（router、AppShell、shadcn 半残）上独家。
