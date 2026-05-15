# Cyster P1 Gate Review

> Generated after the C-lite quick-fix batch (CycleRing copy / Settings
> privacy block / clear-all wiring / mobile audit notes).
>
> Reviewer: Claude (architect-mode, no new feature work).
> Scope: validate the current branch against the 15-item checklist from
> GPT's review reply, then classify findings as Blockers / Should Fix /
> Nice to Have.
>
> **Headline verdict:** No blockers. 13 items PASS, 2 items WARN (mobile
> nav + P1.4/P1.5 mock adapter plan-only). P1.4 + P1.5 implementations
> are still required before any beta, but the foundation is sound.

---

## 1. Route reachability + console-error sanity

**Result: PASS**

15 hash routes all configured in `router.tsx`, all reachable via
`HashRouter`:

| Route | Status | Notes |
|---|---|---|
| `#/` | full | AmITheOne self-assessment funnel |
| `#/report` | placeholder | RoutePlaceholder; lands in P1.4 |
| `#/report/upload` | placeholder | RoutePlaceholder; lands in P1.4 |
| `#/report/:id` | placeholder | RoutePlaceholder; lands in P1.4 |
| `#/stories` | full | curated list + theme filters |
| `#/stories/:slug` | full | markdown body + ConsentNotice block |
| `#/knowledge` | full | category-grouped grid |
| `#/knowledge/:slug` | full | markdown body + citations + lastReviewedAt |
| `#/care` | full | doctor-prep checklist + medication log |
| `#/cycle` | full | CycleRing + SymptomLog + history |
| `#/doctors` | full | static doctor list |
| `#/doctors/:id` | full | static doctor detail |
| `#/agent` | placeholder | RoutePlaceholder; lands in P1.5 |
| `#/profile` | full | user info + self-assessment history |
| `#/profile/settings` | full | provider/model/key/proxy/data |

Legacy v1 paths (`#/dashboard`, `#/community`, `#/therapy`, `#/upload`,
`#/settings`) all redirect via `<Navigate replace>`. Catch-all `*` falls
to `RoutePlaceholder`. No unbound routes.

Console-error sanity: build emits no errors. The 4 placeholder routes
above intentionally render a clean `RoutePlaceholder` rather than
crashing on missing data.

---

## 2. AmITheOne is the homepage (not Dashboard)

**Result: PASS**

- `router.tsx` registers `{ index: true }` → `routes/AmITheOne`.
- `routes/Dashboard.tsx` was deleted in P0.5 Commit 2.
- `#/dashboard` → `Navigate to="/"` redirect.
- AmITheOne route copy opens with: "你最近的「不对劲」，可能不是你的问题——可能是 PCOS"
  which matches the v2 §11.1 prescribed framing.

---

## 3. Every surface fits the v2 positioning (awareness + literacy + community)

**Result: PASS**

Reviewed page-by-page copy:

- **AmITheOne**: awareness framing ("可能不是你的问题"). Self-assessment
  is explicitly non-diagnostic (`disclaimer: 'self-assessment-not-diagnosis'`).
- **Knowledge**: literacy. Every card states "不构成医学建议" + cites
  primary sources.
- **Stories**: community. "你不是一个人" framing; every story rendered
  via `useStories` filter (consentStatus starts with "granted").
- **Care Notes**: doctor-prep framing, never authorial. Header: "Cyster
  不开处方、不调剂量".
- **Cycle**: explicit "PCOS 周期可能波动较大" + non-contraceptive copy.
- **Doctors**: "仅展示，不撮合".
- **Profile**: presents pcosStatus as a self-marker, not a diagnosis.
- **Settings**: pure tooling.

No page wanders into "platform" / "clinic" / "doctor-on-demand" framing.

---

## 4. Care Notes avoids AI-driven medication advice

**Result: PASS**

`routes/Care.tsx`:
- All medication fields are user-typed text inputs (`drug`, `dose`,
  `frequency`, `prescribedBy`, `startDate`, `notes`). No autocomplete,
  no AI completion, no preset list of doses.
- Default doctor-prep checklist has 5 generic items (symptoms /
  lifestyle / history / medications / questions). None of them tell the
  user what to take.
- Footer text directly under the medication form:
  > "剂量、频率、用药时长全部按医生处方填写。Cyster 永远不会建议你更改这些字段。"
- Card-level disclaimer:
  > "Cyster 不会修改这些字段，也不会推荐你换药或调整剂量。"

`types/care.ts` has no `rationale` / `treatmentStrategy` field. The
v1 fields that allowed AI-authored plans were dropped in P0.5 Commit 2.

---

## 5. Doctors module avoids referral / endorsement framing

**Result: PASS**

`routes/Doctors.tsx`:
- Header: "仅展示，不撮合"
- Subheader: "Cyster 不做在线问诊撮合，也不收取转诊费用——这只是个找人参考清单。
  最新信息以医院官网或 12320 卫生热线为准。"

`routes/DoctorDetail.tsx` footer:
- "Cyster 不代表这位医生提供任何在线服务，也不参与挂号转诊。
  就诊前请通过医院官网或 12320 核实出诊时间与挂号方式。"

No "推荐 / 最适合你 / 立即转诊 / AI 匹配医生" copy anywhere in the doctor
surfaces.

---

## 6. Cycle avoids fake precision

**Result: PASS** (after this batch's fixes)

Quick-fix #1 applied:
- `components/cycle/CycleRing.tsx` PHASE_LABELS for `ovulatory` changed
  from "排卵期" → "排卵窗口附近".
- Ring component now renders an inline footer:
  > "PCOS 周期可能波动较大。本估计仅用于自我观察，不用于避孕或备孕决策。"
- `routes/Cycle.tsx` summary card footer rewritten:
  > "基于你目前的记录做的粗略估计。PCOS 周期可能波动较大，此预测仅用于自我观察，
  > 不用于避孕或备孕决策。"

Ovulation is rendered as a 2-day arc segment + a fertile-window range
(5 days pre-ovulation + 1 day post). The marker dot still shows the
current day-of-cycle ("D14") which is a fact of the day, not a
prediction.

Page-level header was already explicit:
> "PCOS 患者的周期常常不规律，这里的推算仅供参考。Cyster 不替代体温法或排卵试纸，
> 也不用于避孕或备孕的精确判断。"

---

## 7. Stories carry ConsentNotice + no AI fake patient framing

**Result: PASS**

`components/stories/ConsentNotice.tsx` is rendered in two places:
- Each `StoryCard` in the index view shows the `badge` variant.
- `routes/StoryDetail.tsx` shows the `block` variant with
  anonymization level + withdrawal contract + aiAssistKind disclosure.

`store/stories.ts` filter:
```ts
.filter((s) => s.consentStatus === 'granted-with-name' || s.consentStatus === 'granted-anonymous')
```
Stories with `pending` / `withdrawn` status never reach the UI.

`types/stories.ts` documents the S-1..S-6 constraints:
- `withdrawable: true` is a literal type, can't be set false.
- `aiAssistKind` enumeration limited to `polish | anonymize | structure | translate`
  (no `generate`).
- The CommunityStory header comment names Content Governance D-014 ("AI
  不能生成虚构患者故事").

The 2 seed stories in `mocks/stories.json` use `granted-with-name` and
`granted-anonymous`. Both have `aiAssisted: true` with kind = `polish`
or `anonymize` — never `generate`.

---

## 8. Knowledge Cards each have citation + lastReviewedAt

**Result: PASS**

`types/knowledge.ts`:
- `citations: Citation[]` is required (not optional).
- `lastReviewedAt: string` is required.

`mocks/knowledgeCards.json` has 3 seed cards (pcos-2023-criteria,
amh-elevation, pcos-and-depression). All three have at least 1
citation and a `lastReviewedAt: "2026-05-13"`.

`lib/knowledge/index.ts::listStaleCards(staleAfterDays = 540)` exposes
the K-2 "needs review" check; `LastReviewedBadge` renders the warning
state in UI when applicable.

`components/knowledge/CitationList.tsx` treats `citations.length === 0`
as a data bug and renders a warning text — meeting K-1 enforcement at
the UI layer.

> Caveat: 3 of the target 20-30 cards. Quantity is "Should Fix" but the
> structural enforcement is in place.

---

## 9. Settings explains API key, local storage, and provider upload

**Result: PASS** (after this batch's fixes)

Quick-fix #2 applied. Settings now has a dedicated `隐私说明` card with
5 explicit bullets:

1. **本地存储**: lists every category (self-assessment / reports /
   care / cycle / story-marks / settings) that goes to localStorage,
   plus the opt-in IndexedDB path for original images.
2. **报告上传 / OCR** (bold): "图片或结构化内容会被发送到你选择的 LLM
   provider（默认 Anthropic）；如果填了 Proxy URL，会先经过你的代理。
   这是 Cyster 唯一离开你设备的数据。"
3. **Agent 对话**: warns that user input + the userContext block both
   go to provider; suggests against pasting national-ID-level PII.
4. **API Key**: explicitly says "base64 + XOR 混淆，不是真正的加密"
   to set expectations.
5. **网络**: "Cyster 不会主动联网。没有埋点、没有第三方分析、没有热更新拉取。"

---

## 10. Clear-data / export-data actually work

**Result: PASS** (after this batch's fixes)

`handleExport` produces a single JSON download containing user profile,
reports, story resonance markers, care notes, self-assessment sessions,
theme, and settings. The API key is intentionally NOT exported (lives
in a separate `cyster.provider-key.*` namespace and would be a security
foot-gun in a download).

Quick-fix #3 applied. `handleClearAll` is now async and:
1. Iterates all `cyster.*` localStorage keys and removes them.
2. Calls `listOriginalImageKeys()` + `deleteOriginalImage(id)` for every
   IndexedDB entry under the `cyster.original-image.*` namespace.
3. Reloads the page.

Button copy updated to "确认清空 (含原图)" so users know IndexedDB is
included. Disabled state + "清理中…" label while async work runs.

---

## 11. All medical output bans confirmed / prescription / dosage advice

**Result: PASS**

Layered enforcement:

| Layer | Mechanism |
|---|---|
| Type | `PcosFeatureMap.disclaimer` is a literal `'feature-map-only-not-diagnosis'`. `SelfAssessmentResult.disclaimer` is `'self-assessment-not-diagnosis'`. Both names embed the boundary. |
| Pure function | `lib/pcos.pcosFeatureMap()` never emits "confirmed". Test `pcos.test.ts` asserts `summary.not.toContain('确诊')`. Test `selfAssessment.test.ts` asserts the entire JSON output lacks `确诊 / confirmed / diagnosed`. |
| System prompt | `lib/llm/prompts/safety.ts` carries the A-1..A-6 ruleset verbatim into the cached safety block. Bans "确诊" / "你应该用 X 药" / "X 药适合你" / "推荐你..." / dosage advice; mandates "和医生讨论" close-out. |
| Tool registry | `lookupMedicationInfo` returns mechanism + group evidence + side effects + doctor-discussion notes only — no `dose`, no `适合你`. |
| UI copy grep | `grep -rE "推荐你|适合你|建议服用|建议你用|你应该用"` returns only the safety prompt's negation list and Care.tsx's "不会推荐你换药". No positive recommendation copy exists anywhere. |

---

## 12. Mobile 375px usability

**Result: WARN** (no blocker — app technically works, navigation is rough)

Static audit only (no real device test). Findings:

- ✅ Root layout collapses correctly: `AppShell` uses
  `grid-cols-1 md:grid-cols-[64px_240px_minmax(0,1fr)]`. Rail and Sidebar
  hide via `hidden md:flex`.
- ✅ Every route uses `mx-auto max-w-* px-6 py-10 lg:px-10` which is
  mobile-safe.
- ✅ Forms use `grid sm:grid-cols-2` which collapses to single column
  below `sm` (640 px).
- ✅ `CycleRing` default `size={220}` fits in a 375 px viewport with the
  px-6 padding.
- ⚠️ **No mobile nav**: with Rail + Sidebar hidden, the only way to
  switch routes on mobile is the URL bar or in-page NavLinks. There is
  no hamburger / drawer. Acceptable for P1; **must** be fixed before
  any patient beta. Move to P1.8.
- ⚠️ AgentDock is `fixed bottom-6 right-6`; on small mobile viewports
  this floats over the bottom of forms (e.g. the "添加这条处方" submit
  button in Care Notes). Likely fine but should be tested on a real
  iOS Safari for safe-area-inset.
- ⚠️ The Settings cards stack vertically OK, but the "测试连通性" row
  uses `flex items-center gap-3` and may wrap awkwardly under 360px
  with the long success message. Cosmetic.

None of these are blockers in this gate. They become P1.8 must-haves.

---

## 13. v1 naming residue

**Result: PASS**

`grep -rEn "DiagnosisResult|TherapyPlan|MedicationTracker|rotterdamCheck|lookupDrug" src` returns:
- `types/report.ts:10` — JSDoc comment "diagnosis (DiagnosisResult)
  replaced by featureMapId".
- `types/report.ts:69` — "v2 replacement for DiagnosisResult".
- `types/care.ts:4` — "v2 replacement for v1 TherapyPlan".

All three are migration-history comments inside doc blocks of v2 types.
No actual v1 symbol survives. The `MIGRATION-v1-to-v2.md` document
preserves the mapping for future reference.

---

## 14. P1.4 / P1.5 mock-first plan

**Result: WARN** (acknowledged; explicit plan below; no code yet)

The user's success criterion is "at least mock path plan". Here is the
plan, ready for the next session.

### P1.4 Report Literacy mock-first wiring

Files to add:

| File | Role |
|---|---|
| `src/lib/llm/mock.ts` | `createMockLlmClient(fixture)` exporting an `LlmClient` whose `chat` yields the canned events and `vision` returns the canned structured output. |
| `src/mocks/fixtures/reportOcr.json` | 3 fixtures: clean Chinese hormone panel, ultrasound report with AFC + ovarian volume, partial / ambiguous units. Each fixture is a `HormonePanel + MetabolicPanel + UltrasoundFindings` payload pre-structured. |
| `src/lib/ocr.ts` | replace `throw P5` with: if `useSettings.provider` has a real key → Anthropic vision; else → mock client returning a fixture chosen by upload filename heuristic. |
| `src/lib/llm/prompts/reportOcr.ts` | OCR system prompt + zod schema for the tool-call response. |
| `src/components/report/upload/Dropzone.tsx` | real dropzone (already has TODO stub). |
| `src/components/report/upload/OcrProgress.tsx` | step progression (validating / compressing / sending / parsing). |
| `src/components/report/upload/OcrPreview.tsx` | react-hook-form review of every extracted field, every editable. |
| `src/components/report/literacy/HormonePanel.tsx` | per-hormone row with flag + KnowledgeCard link. |
| `src/components/report/literacy/MetabolicCard.tsx` | derived HOMA-IR + BMI display. |
| `src/components/report/literacy/UltrasoundCard.tsx` | AFC + ovarian volume readout. |
| `src/components/report/literacy/FeatureMapView.tsx` | the PcosFeatureMap renderer — the non-diagnostic equivalent of v1's DiagnosisCriteria. |
| `src/components/report/literacy/MissingExclusions.tsx` | render `featureMap.literacyOutput.missingExclusions`. |
| `src/components/report/literacy/DoctorQuestions.tsx` | render `featureMap.literacyOutput.suggestedDoctorQuestions` with editable list. |
| `src/routes/Report.tsx` | replace placeholder with list. |
| `src/routes/Upload.tsx` | replace placeholder with `Dropzone -> Progress -> Preview`. |
| `src/routes/ReportDetail.tsx` | replace placeholder with the literacy panels + FeatureMapView. |
| `src/test/ocr.test.ts` | mock-client smoke test + fixture-shape zod check. |
| `src/test/featureMapView.test.ts` | snapshot that "confirmed" / "确诊" never appear in DOM. |

Acceptance criteria for P1.4 (mock-only run):

- [ ] User can upload a JPEG, see progress bar, see populated form.
- [ ] Every extracted field is editable.
- [ ] Submitting writes a Report + a PcosFeatureMap.
- [ ] Report detail page never renders "确诊" or "建议你用".
- [ ] Missing exclusions panel surfaces when fixture has unchecked TSH/PRL.
- [ ] DoctorQuestions panel produces a usable list.
- [ ] Image larger than 5 MB shows the validateUpload rejection reason.
- [ ] No Anthropic key required to run the full happy path.

### P1.5 Agent mock-first wiring

Files to add:

| File | Role |
|---|---|
| `src/mocks/fixtures/agentStreams/*.json` | 4 canned conversations: "AMH 高是什么意思", "我月经不规律是 PCOS 吗", "我想了解二甲双胍" (must end with "和医生讨论"), "我想自杀" (must short-circuit to EmergencyCard, no LLM call). |
| `src/lib/llm/mock.ts` | extended to stream ChatEvents with `text-delta`, `tool-call`, `tool-result`, `done` based on a fixture id. |
| `src/lib/agent/loop.ts` | the agent driver: red-flag first; then chat; then tool-call dispatch into `lib/tools/index.TOOLS`; 5-turn cap. |
| `src/components/agent/ChatStream.tsx` | render `useAgent.activeSession.messages`. |
| `src/components/agent/MessageBubble.tsx` | user / assistant / tool bubble. |
| `src/components/agent/ToolCallView.tsx` | collapsed tool-call card with status + result. |
| `src/components/agent/PromptChips.tsx` | 6 canned prompts including "解读最新报告" / "我 AMH 7.1 是不是很糟糕". |
| `src/components/agent/ContextDrawer.tsx` | shows the injected user-context PromptBlock so the user can audit what got sent. |
| `src/components/layout/AgentPanel.tsx` | swap placeholder body for `ChatStream`. |
| `src/routes/Agent.tsx` | replace placeholder with full-screen `ChatStream`. |
| `src/test/agent.fixtures.test.ts` | per-fixture invariants: no "确诊", no dose, ends with "和医生讨论" when treatment is discussed. |
| `src/test/safety.escalation.test.ts` | the suicide-fixture path renders EmergencyCard and writes a SafetyEvent before any LLM call. |

Acceptance criteria for P1.5 (mock-only run):

- [ ] User can pick a canned prompt from PromptChips, see streaming
      output appear character-by-character.
- [ ] At least one canned conversation triggers a tool call
      (`search_knowledge`) whose result renders as a `ToolCallView` and
      the assistant references the card in its next turn.
- [ ] The medication-related fixture never outputs a dose.
- [ ] The suicide fixture never reaches the LLM; the panel renders
      EmergencyCard.
- [ ] ContextDrawer shows the safety block + medical-knowledge block +
      user-context block so users can verify the prompt.

Once mock-first passes, plugging in real Anthropic key only requires
swapping the adapter and tuning prompt; no UI work.

---

## 15. Summary classification

### Blockers (must fix before P1 merge into main)

> _None._

### Should Fix (before patient beta — P1.8 or P1.5 follow-up)

- **Mobile navigation**: Rail + Sidebar hidden on `< md`, no hamburger
  fallback. Users on phones can only switch routes via in-page links
  or URL bar. (P1.8)
- **P1.4 Report Literacy not implemented**: this is the technical core
  of the product. Mock-first plan in §14. (P1.4)
- **P1.5 Agent not implemented**: this is the conversational core.
  Mock-first plan in §14. (P1.5)
- **Knowledge Cards count**: 3 of target 20-30. The structural
  enforcement is in place; content is the gap. Owner + invited doctors
  authoring.
- **Stories count**: 2 of target 5-10. Same as above.
- **AgentDock overlap**: floating button may obscure form CTAs on small
  viewports. Cosmetic but worth a safe-area test on real iOS.
- **`prebuild.mjs` clears only known paths**: if a future build emits a
  new top-level artifact under `pcos/`, prebuild won't remove it. Add a
  manifest-based cleanup. (P1.8)

### Nice to Have

- Lighthouse perf pass: dedupe react-markdown bundle (currently the
  KnowledgeDetail chunk pulls in 160 kB raw because of remark-gfm).
- A11y audit: focus trap on AgentPanel, aria-live for streaming output.
- `Test connectivity` button currently fakes a 600 ms delay; replace
  with a real `messages.create({ max_tokens: 1 })` ping once P1.5 is
  wired.
- Empty-state copy across every list (filter returns 0, mocks not
  seeded yet).
- Loading skeletons for OCR pipeline (Phase 1.4).
- Visit-log + follow-up flows in Care Notes (currently the kind enum
  supports them, UI does not).
- Cycle history graph (currently a text list; Recharts is already in
  dependencies).
- Export data should optionally include IndexedDB image blobs (large;
  off by default).

---

## Sign-off

**Tests:** 5 files / 19 cases / all passing.
**Build:** `pnpm build` exits 0; main bundle 111 kB / 38 kB gz; largest
lazy chunk 160 kB (KnowledgeDetail, markdown deps).
**Branch:** `claude/pcos-market-analysis-rIU1Q`.

**Next session direction:** P1.4 mock-first wiring per §14 plan, gated
on owner approval of fixture content and copy tone. No real Anthropic
key required for the mock-first pass; that comes after.

*— Claude, gate-review run, end of P1.7 + C-lite batch.*
