# Error taxonomy

Stable codes shared by the reviewer prompts, the learner's error cards, the
exercise bank, and the scheduler. `scripts/taxonomy.py` is the source of truth;
this file explains each code. A test fails if the two drift apart.

Severity is calibrated for this writer, not universally:

| Severity | Meaning | Scheduler consequence |
|---|---|---|
| 3 | Damages the scientific claim — a reviewer would challenge it | Re-probed at least every 45 days, forever |
| 2 | Damages the reader's ability to follow the claim | At least every 90 days |
| 1 | Damages the prose only | May space out to 180 days |

A severity-3 pattern is never retired. Mastery buys longer gaps, never exemption.

---

## `gap.*` — the missing inferential step

The primary family for a writer whose reasoning is sound but whose prose
compresses it. The author performs the intermediate step mentally and does not
write it down, so the reader has to reconstruct it — and a reviewer who
reconstructs it differently reads the paragraph as unsupported.

The test for every code in this family is the same: **name the sentence the
reader must supply for themselves.** If you can write that sentence, it belongs
in the paragraph.

### `gap.warrant`

Evidence and claim are both present; the rule that licenses moving from one to
the other is not. Toulmin's warrant.

> A coevolutionary signal was detected between residues X and Y. These proteins
> therefore interact.

The missing warrant is *why* coevolution bears on interaction at all — that
residues in contact tend to co-vary under structural constraint. State it, and
the strength of the inference becomes visible and arguable.

### `gap.mechanism`

An association, a correlation, or a structural prediction is reported, and the
next sentence describes a mechanism. Nothing in between tested the mechanism.

> Expression of A and B is correlated across tissues. A therefore drives
> transcription of B.

### `gap.scale`

The inference crosses a level of biological organisation without a bridging
argument: *in silico* → *in vitro* → cell → tissue → organism → population.
Each crossing needs either evidence or an explicit assumption.

> The compound inhibits the enzyme at 10 µM in a cell-free assay and is
> therefore a candidate therapeutic.

Skipped: cell permeability, off-target effects, pharmacokinetics, the
concentration reachable *in vivo*.

### `gap.population`

The sample and the subject of the claim are not the same set. Mouse → human,
one cell line → the cell type, one cohort → the disease.

### `gap.temporal`

Cross-sectional or steady-state data read as a sequence of events. Ordering
claims — "precedes", "leads to", "initiates", "downstream" — require a design
that resolves time.

### `gap.definition`

A term means one thing when introduced and a slightly different thing when used
to conclude. "Interaction" as *predicted contact* in sentence 2 and as *physical
complex* in sentence 5. The argument is valid only if the term is held constant.

### `gap.quantifier`

Quantifier or modality strengthens silently across sentences. "Several strains"
becomes "strains"; "may contribute" becomes "contributes"; "in this dataset"
disappears. Each step looks small; the paragraph as a whole has moved a long way.

### `gap.negative`

Absence of evidence reported as evidence of absence, without establishing that
the method could have detected the thing. "No interaction was observed"
is only informative alongside a positive control and a detection limit.

---

## `claim.*` — epistemic calibration

Whether the certainty of the language matches the strength of the evidence.
See `epistemic-calibration.md` for the ladder.

### `claim.overclaim`

The verb or adverb sits higher on the claim ladder than the evidence supports.
"Demonstrates" where "is consistent with" is licensed.

### `claim.causal`

Causal language without a causal design. Something must have been perturbed —
knockout, knockdown, mutation, dose, randomisation — for "causes", "drives",
"induces", "mediates", or "regulates" to be earned.

### `claim.novelty`

"First", "novel", "unprecedented" without stating the comparison class and how
it was searched.

### `claim.hedge_drift`

The paragraph opens hedged and closes unhedged. The reader remembers the last
sentence. Especially common where a Discussion paragraph ends on an implication:
the hedge is present in the interpretation and gone from the significance
statement. Check the first and last sentence against each other before anything
else.

### `claim.significance`

A p-value treated as a measure of importance. Report the effect size and say
whether it is biologically meaningful; "significantly increased" without a
magnitude is not a result the reader can use.

---

## `boundary.*` — section function

### `boundary.interp_in_results`

A sentence in Results that could be wrong even if the data are right. That is
the operational test: an observation fails only if the measurement is wrong; an
interpretation can fail while the measurement stands.

### `boundary.results_in_discussion`

Discussion sentences that restate numbers instead of adding inference. One
restatement of the headline finding is appropriate; a second pass through the
figures is not.

### `boundary.no_alternative`

An interpretation is offered as though it were the only one available. At least
one alternative — biological, methodological, or statistical — should be named
and addressed.

### `boundary.no_limitation`

No limitation, or a limitation so generic it costs nothing ("further work is
needed"). A real limitation identifies which specific claim is weakest and why.

---

## `cohesion.*` — reader tracking

### `cohesion.referent`

"This", "these", "it" with more than one possible antecedent. Cheapest fix in
scientific writing: attach a noun. "This" → "this coevolutionary signal".

### `cohesion.terminology`

One entity, several names. Elegant variation is a habit from literary prose and
is actively harmful here — the reader cannot tell whether two terms denote the
same object.

### `cohesion.drift`

The paragraph serves more than one claim. Symptom: you cannot state its point in
one sentence without using "and".

### `cohesion.known_new`

New information arrives before the anchor it attaches to. Each sentence should
open with something the previous sentence established and close with what is new.

---

## `sentence.*` — prose only

Real but cheap to fix, and deliberately low severity: fixing prose feels like
progress and is the easiest way to spend a session without touching the argument.

### `sentence.overload`

One sentence carrying several scientific jobs — observation, comparison, and
interpretation at once.

### `sentence.weak_verb`

The verb does not name the relationship: *show*, *affect*, *relate to*, *have*,
*make*. Replace with the verb the evidence licenses (`epistemic-calibration.md`
has the ladder).

### `sentence.nominalisation`

The action is buried in a noun. "Performed an analysis of" → "analysed".

### `sentence.noun_chain`

Three or more stacked modifiers: "membrane protein complex assembly defect
phenotype". The reader cannot tell which noun is the head until the end.
