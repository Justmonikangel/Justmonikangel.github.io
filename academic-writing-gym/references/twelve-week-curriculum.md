# The twelve-week curriculum

The curriculum controls **what gets introduced**. The scheduler controls **what
gets reviewed**. They do not compete: `curriculum_week` in `profile.yaml` is an
unlock gate, and within the unlocked pool `awgym next` picks by which error
cards are due. A writer in week 9 still gets pulled back to a week-2 verb
exercise whenever `claim.overclaim` comes up.

Advance a week when the week's own codes have all reached at least
`self_fixed` once. Weeks are not deadlines; a stuck week is information.

---

## Phase I · Sentence function and precision (weeks 1–4)

Goal: know what each sentence is doing before arguing about whether it is doing
it well.

| Week | Focus | Codes introduced | Bank |
|---|---|---|---|
| 1 | Sentence function mapping | `cohesion.drift`, `cohesion.known_new` | `fn-map-01` |
| 2 | Verbs against evidence | `sentence.weak_verb`, `claim.overclaim` | `verb-ladder-01` |
| 3 | One sentence, one job | `sentence.overload`, `sentence.noun_chain` | `split-01` |
| 4 | Cohesion and stable terms | `cohesion.referent`, `cohesion.terminology`, `gap.definition` | `referent-01` |

Week 1 exists to build the labelling vocabulary the later reviewers use.
Label every sentence as one of: context, gap, aim, method, observation,
comparison, interpretation, mechanism, qualification, limitation, implication.
If a sentence needs two labels, that is `sentence.overload` or
`cohesion.drift` — found a week early, which is fine.

---

## Phase II · Paragraph architecture and section boundaries (weeks 5–8)

Goal: make the observation/interpretation boundary automatic, and make the
missing inferential step visible. **This is the phase that addresses the core
pattern.** Expect to spend longer than four weeks here.

| Week | Focus | Codes introduced | Bank |
|---|---|---|---|
| 5 | Results from a figure | `boundary.interp_in_results`, `claim.significance`, `gap.negative` | `fig2res-01`, `fig2res-02` |
| 6 | Discussion from the same figure | `boundary.results_in_discussion`, `claim.hedge_drift` | `res2disc-01` |
| 7 | Claim–Evidence–Reasoning alignment | `gap.warrant`, `gap.mechanism`, `gap.scale` | `cer-01`, `cer-02` |
| 8 | Alternatives and uncertainty | `boundary.no_alternative`, `boundary.no_limitation`, `gap.temporal`, `gap.population` | `alt-01`, `alt-02` |

Weeks 5 and 6 must use the **same figure**. Writing Results and Discussion from
one stimulus is what makes the boundary concrete: the same fact, twice, with
different permissions.

Week 7 is the centre of the whole programme. Build the argument table before
writing prose — the reasoning column literally contains the sentences that
would otherwise be missing. See `step-ladder.md`.

The paragraph model throughout:

- **Claim** — the single point of this paragraph
- **Evidence** — the result, number, figure or citation that supports it
- **Reasoning** — why that evidence supports that claim, written out
- **Implication** — what follows, including what would be needed to go further

Reasoning is the move that gets skipped. Draft it first.

---

## Phase III · Reconstruction of your own work (weeks 9–12)

Goal: transfer. Exercises stop being synthetic.

| Week | Focus | Codes introduced | Bank |
|---|---|---|---|
| 9 | Abstract reconstruction | `claim.novelty`, `gap.quantifier` | `abstract-01` |
| 10 | Results subsection | — (all Results codes reviewed) | `own-results-01` |
| 11 | Discussion subsection | — (all Discussion codes reviewed) | `own-disc-01` |
| 12 | Argument map and reviewer simulation | — (everything reviewed) | `argmap-01` |

Week 12 produces the report: recurring patterns, interval growth per code,
what is still unresolved, and what the next cycle should target. Generate the
numbers with `awgym report` and `learner/sessions.jsonl`; write the narrative
by hand.

---

## After week 12

The curriculum ends; the scheduler does not. `curriculum_week: 99` unlocks the
whole bank and sessions become purely review-driven. Severity-3 codes keep
surfacing at most 45 days apart indefinitely — see `docs/memory-design.md` for
why that ceiling exists.
