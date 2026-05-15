# Cyster P0.5 + P1 Progress Snapshot

> Self-run handoff doc. Generated during the auto-run session that
> followed `pcos/ARCHITECTURE-v2.md` cutover.

---

## What's done

### P0.5 v2 cutover (complete · 4 commits)

- Code cleanup: 15-route HashRouter with legacy redirects, AppShell
  skeleton, layout TODO notes, shadcn half-stubs now throw, hormones
  expanded to 12 fields × 4 phases, `cycle.cyclePhase` +
  `fertileWindow` + `cycleDayFromDate`, `lib/api.ts` deleted, common
  `createPlaceholderClient` factory, `agent.test.ts` → `storage.test.ts`,
  `@tanstack/react-query` dropped.
- v2 type & module rename: `DiagnosisResult` → `PcosFeatureMap`,
  `TherapyPlan` → `CareNote`, `Medication` → `PrescribedMedication`,
  `ChatOpts.system` → `PromptBlock[]`, new `types/{common, care, stories,
  knowledge, selfAssessment, safety}.ts`, `pcos.rotterdam` →
  `pcos.pcosFeatureMap` with 2023 Intl PCOS Guideline + adult/adolescent
  split, `tools/rotterdamCheck` → `computeFeatureMap`, `tools/lookupDrug`
  → `lookupMedicationInfo`, new mocks for stories / knowledgeCards /
  selfAssessmentQuestions / redFlagPatterns / medicationInfo, deleted
  orphans (Dashboard.tsx, Community.tsx, PostDetail.tsx, Therapy.tsx,
  components/{dashboard,therapy,community}/).
- New libs: `lib/safety/{redFlags,detect,escalation}.ts`, `lib/image/
  {compress,fileToVisionInput,validateUpload}.ts`, `lib/knowledge/
  index.ts`, `lib/citations.ts`, `lib/indexedDb.ts`, `lib/llm/prompts/
  {blocks,safety,medicalKnowledge,userContext}.ts`. New tools:
  `searchKnowledge`, `generateDoctorQuestions`.
- New components: `components/safety/{EmergencyCard,RedFlagNotice}.tsx`,
  `components/{amitheone,knowledge,cycle}/*` scaffold.
- Build artifacts regenerated; pnpm-lock.yaml in sync (idb-keyval added,
  TanStack Query removed).

### P1 (in progress · 7/8 sub-phases done)

| Sub-phase | Status | Notes |
|---|---|---|
| **P1.1** AppShell + Rail + Sidebar + AgentDock + AgentPanel | done | Three-column desktop layout. Mobile collapses Rail/Sidebar (P1.8 will add a top bar / hamburger). Agent panel is hand-rolled (no shadcn Sheet dep). |
| **P1.2** AmITheOne | done | 7-question self-assessment, per-kind counts, next-step CTAs into upload/stories/care/knowledge. 5 unit tests. |
| **P1.3** Knowledge Cards | done | Category-grouped index + markdown detail; 3 seed cards. Need ≥ 17 more cards to hit the v2 §11.4 target. |
| **P1.4** Report Literacy | **not done** | Upload, OCR, FeatureMapView all still stubs. The OCR pipeline lib exists (`lib/image/*` + `lib/ocr.ts`) but isn't wired into a UI. Needs Anthropic key to fully test. |
| **P1.5** Agent | **not done** | `AgentDock` toggles `AgentPanel`, but the panel body is placeholder. PromptBlock builders exist (`lib/llm/prompts/blocks.ts`). The Anthropic adapter is still `createPlaceholderClient('anthropic', 'P4')`. Needs API key to test. |
| **P1.6** Stories | done | Theme filter chips, two seed stories (granted-with-name + granted-anonymous). Detail page renders markdown + ConsentNotice block + related knowledge links. |
| **P1.7a** Settings | done | Provider / Model dropdowns, API Key (obfuscated), Proxy URL, disabled Invite Code, 600ms simulated Connectivity Test, "保留报告原图" toggle, full data export, gated clear-all. |
| **P1.7b** Profile / Doctors / DoctorDetail | done | Profile reads useUser + useSelfAssessment; computes BMI + cycle day + phase + next start. Doctors list + detail from mocks. |
| **P1.7c** Care Notes | done (minimal) | doctor-prep checklist (default template) + medication log (user-entered drug/dose/frequency only). visit-log / follow-up flows deferred to P1.8. |
| **P1.7d** Cycle | done | SVG `CycleRing` with phase-colored arc + current-day marker, fertile-window + next-start prediction, per-day SymptomLog (mood/cramps/acne/flow/sleep/note), short history list. |
| **P1.8** Polish + a11y + mobile | not started | Defer until P1.4/P1.5 land — visual polish is cheaper after content surfaces are real. |

### Tests / Build

- `pnpm test`: **19 passing** across 5 files:
  - `pcos.test.ts` (6 cases — legacy helpers + 4 `pcosFeatureMap` paths)
  - `safety.test.ts` (6 cases — one per red-flag category + multi-match)
  - `selfAssessment.test.ts` (5 cases including "never outputs 确诊")
  - `storage.test.ts` (1 case — provider key obfuscation round-trip)
  - `hormones.test.ts` (1 case — FSH follicular range)
- `pnpm build`: succeeds. Main bundle ~111 kB / 38 kB gzipped. Largest
  lazy chunk is KnowledgeDetail (~160 kB / 47 kB gz) due to
  react-markdown + remark-gfm — will revisit chunk strategy in P1.8.

---

## What's not done — and how to pick it up

### P1.4 Report Literacy

Files that still need real bodies:

- `routes/Upload.tsx` (currently RoutePlaceholder)
- `routes/Report.tsx` (currently RoutePlaceholder)
- `routes/ReportDetail.tsx` (currently RoutePlaceholder)
- `components/report/{upload,literacy}/*` (mostly empty)
- `lib/ocr.ts` (currently `throw 'P5'`)

Pipeline outline already supported by libs:
1. `validateUpload(files)` (✅ exists in `lib/image/validateUpload.ts`)
2. `fileToVisionInput(file)` → `{ mimeType, data }` (✅ exists)
3. `llmClient.vision({ system: OCR_PROMPT, images: [...], schema })` —
   needs `lib/llm/prompts/reportOcr.ts` + zod schema + Anthropic adapter
   `vision()` method (currently throws placeholder).
4. Parsed `HormonePanel / MetabolicPanel / UltrasoundFindings` populates
   a draft `Report`; UI form lets user correct values.
5. On submit, run `computeFeatureMap` and persist both `Report` and
   `PcosFeatureMap` to stores.

Anthropic adapter `vision()` is the missing core. With a real API key
from Settings, it should:

```ts
const client = new Anthropic({
  apiKey: readProviderKey('anthropic'),
  baseURL: settings.proxyUrl || undefined,
  dangerouslyAllowBrowser: true,
});

const result = await client.messages.create({
  model: settings.model,
  max_tokens: 2000,
  tools: [{ name: 'emit_report', input_schema: ReportZodSchema }],
  tool_choice: { type: 'tool', name: 'emit_report' },
  system: [
    { type: 'text', text: OCR_PROMPT, cache_control: { type: 'ephemeral' } },
  ],
  messages: [
    { role: 'user', content: images.map((img) => ({ type: 'image', source: { type: 'base64', media_type: img.mimeType, data: img.data } })) },
  ],
});
```

### P1.5 Agent

Files needing bodies:

- `lib/llm/anthropic.ts` chat method — currently
  `createPlaceholderClient('anthropic', 'P4')`. Implement
  Anthropic-streaming with `messages.stream` and the `PromptBlock[]` →
  Anthropic content-blocks translation (cache_control on `safety` /
  `medical-knowledge` / `tool-spec`, no cache on `user-context`).
- `components/agent/{ChatStream,MessageBubble,PromptChips,ToolCallView,
  ContextDrawer}.tsx` (currently `return null`).
- Wire `AgentPanel` body to render `ChatStream` using
  `useAgent.activeSession`.
- Agent loop: detect red-flag FIRST (`lib/safety/detect`), then call
  LLM with tools, dispatch tool calls into `lib/tools/index.TOOLS`,
  feed tool results back, cap at 5 turns.

### P1.8 Polish (do last)

- Mobile top bar / hamburger to open Rail/Sidebar
- A11y audit (focus rings, aria-live for streaming, keyboard nav of
  AgentDock + AgentPanel)
- Lighthouse perf pass (lazy-load react-markdown, dedupe chunks)
- Empty-state copy for every list when filtered
- Loading skeletons for OCR / agent stream

---

## How to resume

```bash
git checkout claude/pcos-market-analysis-rIU1Q
cd pcos/_src
pnpm install   # picks up idb-keyval, drops tanstack
pnpm test      # should print 19 passing
pnpm build     # should produce pcos/index.html + pcos/assets/
```

The site is live at `/pcos/` on the gh-pages domain (whatever the user
serves). Navigate the 15 hash routes to spot-check each surface.

Next session checklist:
- [ ] User confirms whether to keep auto-pushing into P1.4 / P1.5 or
      direct manually
- [ ] If continuing: wire `lib/llm/anthropic.ts` chat + vision properly,
      then P1.4 Upload flow, then P1.5 Agent body
- [ ] Schedule a fresh red-flag pattern review (mocks/redFlagPatterns.json
      is owner-curated — needs medical reviewer eyes before any beta)

---

*Last sync: end of P1.7 batch. Branch `claude/pcos-market-analysis-rIU1Q`
is current; latest commit is the P1.7c Care Notes merge.*
