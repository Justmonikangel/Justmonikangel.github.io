# Cyster P1.4 + P1.5 Implementation Prompt for Gemini

> Paste this whole document into a new Gemini session along with read
> access to the repo branch `claude/pcos-market-analysis-rIU1Q`.
> Do not summarize. Do not skip sections.

---

## 1. What Cyster is, in one paragraph

Cyster is a static SPA hosted under `/pcos/` on a Jekyll GitHub Pages
site. It is **NOT** a diagnosis platform, **NOT** a prescription tool,
**NOT** a doctor-on-demand service. It is a PCOS-awareness, report-
literacy, and curated-community tool. Three things are sacred:

1. Output never says "确诊" / "confirmed" / "你是 PCOS".
2. AI never recommends specific drug dose, frequency, or duration.
3. Red-flag user input (suicide / heavy bleeding / chest pain / acute
   abdomen) short-circuits before any LLM call.

If a change you're about to make conflicts with these three, stop and
ask the owner.

---

## 2. Reading order (do this before touching code)

In this order:

1. `pcos/ARCHITECTURE-v2.md` — full v2 spec. Pay special attention to
   §10 (types), §12 (Agent / PromptBlock), §13 (OCR pipeline), §16
   (Content Governance hard rules), §19 (phase plan).
2. `pcos/MIGRATION-v1-to-v2.md` — what was renamed / removed since v1.
3. `pcos/DECISIONS.md` — 18 ADR entries explaining why current shape
   exists. D-003, D-004, D-006, D-007, D-008, D-009, D-010, D-011,
   D-014 are most relevant to this work.
4. `pcos/P1-GATE-REVIEW.md` — especially §14, which is the canonical
   file list and acceptance criteria for what you're about to build.
5. `pcos/STATUS-P1.md` — what's already shipped.

If anything in this prompt contradicts those docs, **the docs win**.
Update the doc in the same PR rather than diverging silently.

---

## 3. Branch + environment

```bash
git checkout claude/pcos-market-analysis-rIU1Q
cd pcos/_src
pnpm install      # picks up idb-keyval, no tanstack
pnpm test         # must print 19 passing before you start
pnpm build        # must succeed before you start
```

If any of those three commands fail, stop and tell the owner. Do not
attempt to "fix" the baseline.

Open a fresh feature branch off the current branch:

```bash
git checkout -b gemini/p1.4-p1.5-mock-wiring
```

---

## 4. Scope: what you're building

Two phases, **both mock-first**. You will NOT make any real network
call to Anthropic / OpenAI / any LLM. Everything goes through a mock
adapter that reads canned fixtures already committed under
`pcos/_src/src/mocks/fixtures/`.

### P1.4 — Report Literacy

Files **already** drafted for you (read-only; do not edit content):

- `src/mocks/fixtures/reportOcr/index.json` — fixture manifest.
- `src/mocks/fixtures/reportOcr/clean-hormones.json`
- `src/mocks/fixtures/reportOcr/ultrasound-afc.json`
- `src/mocks/fixtures/reportOcr/partial-ambiguous.json`

Files you need to **create or replace**:

| Path | Role |
|---|---|
| `src/lib/llm/mock.ts` | `createMockLlmClient()` exporting an `LlmClient`. `chat` and `vision` both honor fixtures from `src/mocks/fixtures/*`. |
| `src/lib/ocr.ts` | Replace the current `throw 'P5'` body. If a real Anthropic key is present in settings AND `import.meta.env.PROD`, future-you will call the real client; for P1.4 the implementation MUST always go through the mock client, gated behind a `USE_MOCK_LLM = true` constant at the top so it can be flipped later. |
| `src/lib/llm/prompts/reportOcr.ts` | OCR system prompt + a zod schema for the tool-call response. Schema must match `HormonePanel + MetabolicPanel + UltrasoundFindings + { cycleDay?, notes? }`. |
| `src/components/report/upload/Dropzone.tsx` | Real dropzone using `lib/image/validateUpload`. Accepts only image/jpeg, image/png, image/webp. Max 5 files. |
| `src/components/report/upload/OcrProgress.tsx` | Step progression UI: validating → compressing → sending → parsing. Show one row per step with a small spinner + ✓ on done. |
| `src/components/report/upload/OcrPreview.tsx` | `react-hook-form` + `zod` form rendering every extracted field. Every field is editable. Footer shows the fixture's filename heuristic note when applicable. |
| `src/components/report/literacy/ReportCard.tsx` | Tiny preview card for the report list. |
| `src/components/report/literacy/HormonePanel.tsx` | One row per hormone: value + unit + ref range + flag + link to relevant KnowledgeCard. |
| `src/components/report/literacy/MetabolicCard.tsx` | Renders metabolic panel + computed HOMA-IR from lib/pcos.homaIR. |
| `src/components/report/literacy/UltrasoundCard.tsx` | AFC + ovarian volume; highlight when AFC ≥ 20 / OV ≥ 10. |
| `src/components/report/literacy/FeatureMapView.tsx` | Visualize the PcosFeatureMap (replaces v1's DiagnosisCriteria). Banner at the top: "这是特征图谱，不是诊断结论". Render `literacyOutput.summary`, `consistentFeatures`, `inconclusiveFeatures`. |
| `src/components/report/literacy/MissingExclusions.tsx` | Render `literacyOutput.missingExclusions` as a checklist with hints linking to /knowledge/pcos-2023-criteria. |
| `src/components/report/literacy/DoctorQuestions.tsx` | Render `literacyOutput.suggestedDoctorQuestions` with editable list — user can add / remove. Persists into a draft CareNote when the user clicks "保存到看医生准备". |
| `src/routes/Report.tsx` | List view of useReports. Replace placeholder. |
| `src/routes/Upload.tsx` | Orchestrate Dropzone → OcrProgress → OcrPreview → write to useReports + compute featureMap → redirect to `/report/:id`. |
| `src/routes/ReportDetail.tsx` | Stack of HormonePanel / MetabolicCard / UltrasoundCard / FeatureMapView / MissingExclusions / DoctorQuestions. |
| `src/test/ocr.test.ts` | Mock client smoke + zod schema check for each fixture. |
| `src/test/featureMapView.test.ts` | DOM snapshot assertion: rendered output never contains "确诊" / "confirmed". |

### P1.5 — Agent

Files **already** drafted for you (read-only):

- `src/mocks/fixtures/agentStreams/index.json`
- `src/mocks/fixtures/agentStreams/amh-explanation.json`
- `src/mocks/fixtures/agentStreams/irregular-cycles.json`
- `src/mocks/fixtures/agentStreams/metformin-info.json`
- `src/mocks/fixtures/agentStreams/crisis-escalation.json`

Files you need to **create or replace**:

| Path | Role |
|---|---|
| `src/lib/llm/mock.ts` (extend from P1.4) | Add `chat(opts)` that streams the fixture matching the first user message. Streaming cadence ~40 ms per `text-delta`. `tool-call` events fire immediately followed by their `tool-result` event. End with `done`. |
| `src/lib/agent/loop.ts` | The agent driver. Step 1: `lib/safety/detect.detectRedFlag(userInput)`. If matched → push SafetyEvent, render EmergencyCard, return early. Step 2: call `client.chat({ system: buildSystemPromptBlocks(userCtx), messages, tools })`. Step 3: dispatch tool calls into `lib/tools/index.TOOLS`. Cap at 5 turns. |
| `src/components/agent/ChatStream.tsx` | Render `useAgent.activeSession.messages`. Streaming bubble updates in place. |
| `src/components/agent/MessageBubble.tsx` | User / assistant / tool variants. Markdown render via react-markdown for assistant. |
| `src/components/agent/ToolCallView.tsx` | Collapsed card showing tool name + args summary. Expandable to show full result. |
| `src/components/agent/PromptChips.tsx` | Read `mocks/fixtures/agentStreams/index.json`, render 3 chips for fixtures where `needsLlm === true`. The crisis fixture is NOT exposed as a chip. |
| `src/components/agent/ContextDrawer.tsx` | Show the current `PromptBlock[]` that would be sent. Each block expandable. Default closed. |
| `src/components/layout/AgentPanel.tsx` (replace placeholder body) | Mount `<ChatStream>` inside the existing slide-in panel shell. |
| `src/routes/Agent.tsx` (replace placeholder) | Full-screen `<ChatStream>`. |
| `src/store/agent.ts` (extend) | Add `startSession()`, `appendMessage(sessionId, msg)`, `appendDelta(sessionId, msgId, delta)`. Persist to localStorage under `cyster.agent.v1`. |
| `src/test/agent.loop.test.ts` | Per-fixture invariant tests using the `invariants` object in each fixture JSON. |
| `src/test/safety.escalation.test.ts` | The crisis fixture path renders EmergencyCard, writes a SafetyEvent, and never calls the mock client's chat method. |

---

## 5. Critical invariants (will block PR if violated)

These are enforced by tests; treat them as compile-time constraints.

### Layer: pure functions

- `lib/pcos.pcosFeatureMap()` already exists. Do not modify. Existing
  tests in `src/test/pcos.test.ts` already assert `summary.not.toContain('确诊')`.

### Layer: agent loop

- `lib/agent/loop.ts` MUST call `lib/safety/detect.detectRedFlag(userInput)`
  before invoking `client.chat`. There is no path that bypasses this
  check. The crisis fixture exists specifically to assert this.
- Tool dispatch goes through `lib/tools/index.TOOLS` — do not invent new
  tools. If you need a new tool, name it explicitly in this prompt and
  the owner must approve.
- Loop turn cap = 5. After 5 LLM↔tool turns, return with a "对话超长"
  message and let the user start a new session.

### Layer: prompts

- `lib/llm/prompts/blocks.ts::buildSystemBlocks()` already builds the
  4-block array (safety / pcos-knowledge / tools-spec / user-context).
  Do NOT modify the content of those blocks. If you think safety.ts
  needs new copy, file a separate PR for review.
- `lib/llm/prompts/safety.ts` carries Content Governance §16.3 verbatim.
  If you change a comma here, also change ARCHITECTURE-v2.md §16.3.

### Layer: tools

- `lookup_medication_info` returns mechanism + group evidence + side
  effects + doctor-discussion notes. It does NOT return dose,
  frequency, duration, "适合你", or any individualized fit verdict.
  The metformin fixture exists to validate this.
- `compute_feature_map` is a pure mapping; never call it with
  pre-classified data that you fabricated. Inputs come from either the
  OCR preview (P1.4) or the user-confirmed self-assessment (P1.2).

### Layer: UI

- FeatureMapView MUST display the literal `disclaimer:
  'feature-map-only-not-diagnosis'` banner at the top.
- Care Notes UI MUST keep all medication fields as plain text inputs.
  No autocomplete dropdown that suggests drugs. No "推荐" / "适合你" /
  "建议服用" / "建议你用" / "你应该用" anywhere.
- ConsentNotice MUST appear on every story card and detail page.

### Layer: secrets

- `lib/storage.writeProviderKey` / `readProviderKey` already obfuscate
  via base64 + XOR. Do NOT swap to plaintext. Do NOT log the key.
- No network call to `api.openai.com` / `api.anthropic.com` / any
  origin OTHER than what the user explicitly typed into the Proxy URL
  field in Settings. P1.5 still uses the mock client, so this is a
  future hardening — but `USE_MOCK_LLM` is the guard rail.

---

## 6. Acceptance criteria (verbatim from P1-GATE-REVIEW.md §14)

### P1.4 mock-only happy path

- [ ] User uploads `clean-hormones.jpg` (any image with that filename
      heuristic) and sees a populated OCR Preview form with 12 hormone
      fields + 4 metabolic fields + cycleDay = 3.
- [ ] User edits any field and the form updates.
- [ ] User submits and is redirected to `/report/:id`.
- [ ] Report detail page renders FeatureMapView with the literal
      `feature-map-only-not-diagnosis` disclaimer banner.
- [ ] Page never renders "确诊" / "你被诊断为 PCOS" anywhere.
- [ ] Missing exclusions panel surfaces when fixture has unchecked
      TSH/PRL (test with `partial-ambiguous.jpg`).
- [ ] DoctorQuestions panel produces a usable list and writes a draft
      CareNote when saved.
- [ ] An image larger than 5 MB shows the `validateUpload` rejection
      reason inline.
- [ ] No Anthropic key required.

### P1.5 mock-only happy path

- [ ] User clicks the "我 AMH 7.1 是不是很糟糕？" prompt chip and sees
      text stream in character-by-character (~40 ms cadence).
- [ ] The streamed assistant message references
      `/knowledge/amh-and-pcos` via a markdown link.
- [ ] `ToolCallView` appears inline showing `search_knowledge` ran,
      with collapsed args + expandable result.
- [ ] The "我想了解二甲双胍" fixture never outputs a dose; instead it
      points to "看医生准备" for prescribed-meds logging.
- [ ] The crisis fixture path (test only, not exposed as chip):
  - [ ] `detectRedFlag` matches `rf-mental-suicide`.
  - [ ] `<EmergencyCard match={pattern}/>` renders in the panel.
  - [ ] A SafetyEvent is pushed into useSafety.
  - [ ] The mock client's chat method is never called.
- [ ] ContextDrawer reveals 4 PromptBlocks (safety / pcos-knowledge /
      tools-spec / user-context) in the right order.
- [ ] AgentPanel can be opened from the dock and via `/agent` route.

---

## 7. How to verify before opening the PR

```bash
cd pcos/_src

# 1. types + lint
pnpm exec tsc --noEmit
pnpm exec eslint src --ext .ts,.tsx

# 2. unit tests
pnpm test                # must show 19 + new tests, all passing

# 3. build
pnpm build

# 4. dev server smoke (manual)
pnpm dev
# Open http://localhost:5173/pcos/
# Click through:
#   - / (AmITheOne) -> upload report -> see preview
#   - /report (list) -> click into detail
#   - /agent -> click a prompt chip -> see stream
#   - Type "我想自杀" in the agent input -> see EmergencyCard
```

If anything in steps 1–3 fails, do not push.

---

## 8. Commit + PR conventions

- One commit per logical unit (mock client / ocr lib / upload UI /
  literacy components / agent loop / agent UI / safety escalation).
- Commit body lists files touched + the §6 checkboxes you can tick.
- PR title: `Phase P1.4 + P1.5: mock-first wiring`.
- PR body links back to `pcos/P1-GATE-REVIEW.md §14` and
  `pcos/ARCHITECTURE-v2.md §12 §13`.
- Do not push directly to `claude/pcos-market-analysis-rIU1Q`. Push
  your branch and open a PR for owner review.

---

## 9. Hard "no" list

You will be rejected for any of these:

- ❌ Replacing fixture content with AI-generated alternatives. If you
  think a fixture is wrong, comment on the PR; do not edit the JSON.
- ❌ Adding any network call that's not gated by `USE_MOCK_LLM = false`.
- ❌ Modifying `lib/llm/prompts/safety.ts` or the Content Governance
  rules without a separate owner-approved PR.
- ❌ Adding a "推荐你" / "适合你" / "建议服用" / "你应该用" anywhere in
  the UI copy.
- ❌ Making the FeatureMapView render a `confidence: 0.9` number, a
  percentage, or any phrasing that looks like a diagnostic score.
- ❌ Bypassing the red-flag check, even for "quick demo testing". The
  crisis fixture is the only legitimate way to exercise that path.
- ❌ Touching files outside the lists in §4. If you find a typo in
  ARCHITECTURE-v2.md, fix it in a separate commit, not bundled with
  feature work.

---

## 10. When you finish

Open the PR. In the description:

1. ✅ check off every box from §6.
2. List which files you added / modified / deleted.
3. Paste the output of `pnpm test`.
4. Paste a screenshot or screen-recording of the upload happy path
   and the agent stream happy path.
5. Confirm `USE_MOCK_LLM = true` is still the only state code path
   in `lib/ocr.ts` and `lib/llm/mock.ts`.

Then ping the owner. Real-Anthropic-key validation comes after this
PR is merged.

---

*Generated by Claude in handoff to Gemini. Branch:
`claude/pcos-market-analysis-rIU1Q`. Fixtures committed at HEAD.*
