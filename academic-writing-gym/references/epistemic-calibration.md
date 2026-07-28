# Epistemic calibration

Whether the certainty of the language matches the strength of the evidence.
Two ladders that must be read at the same rung.

---

## The claim ladder

| Rung | Level | What it asserts | Typical verbs |
|---|---|---|---|
| 1 | Observation | This was measured | detected, observed, measured, recorded |
| 2 | Description | This is what the data look like | contained, exhibited, displayed, comprised |
| 3 | Association | These vary together | correlated with, associated with, co-occurred |
| 4 | Interpretation | This is what it plausibly means | is consistent with, suggests, indicates |
| 5 | Hypothesis | This is what we propose to test | we hypothesise, we propose, may contribute to |
| 6 | Mechanistic claim | This is how it works | mediates, requires, is necessary for |
| 7 | Causal claim | This makes that happen | causes, drives, induces, regulates |
| 8 | Validation requirement | This is what would settle it | would require, remains to be tested |

Rung 8 is not weaker than rung 7 — it is the sentence that lets you *keep* a
rung-5 claim without inflating it. A paragraph that ends at rung 5 and then
states rung 8 is complete. A paragraph that ends at rung 7 with rung-4 evidence
is an overclaim regardless of hedging.

---

## The evidence ladder

| Rung | Evidence | Highest claim it licenses |
|---|---|---|
| 1 | Sequence or structure prediction (AlphaFold, HMM) | 4 — interpretation |
| 2 | Coevolution, co-occurrence, phylogenetic signal | 4 — interpretation |
| 3 | Correlation in observational data | 3–4 |
| 4 | *In vitro* binding or activity, purified components | 5 — hypothesis about *in vivo* |
| 5 | Co-localisation, co-IP in cells | 5 |
| 6 | Loss of function (knockout, knockdown, mutation) | 6 — necessity |
| 7 | Gain of function or rescue | 6–7 |
| 8 | Perturbation with dose-response and rescue, or randomisation | 7 — causation |

**Read both ladders and compare the rung numbers.** The mismatch is the finding.
A rung-2 evidence base under a rung-6 verb is `claim.overclaim`; if the verb is
specifically causal it is `claim.causal`.

---

## Verb substitutions

Not softening for its own sake. Each row moves the sentence to the rung its
evidence occupies — which sometimes means moving **up**.

| Instead of | When evidence is | Use |
|---|---|---|
| shows | prediction or correlation | is consistent with, indicates |
| demonstrates | loss of function only | is required for |
| proves | anything | provides evidence that (nothing proves) |
| affects | measured direction | increases, reduces, delays, abolishes |
| relates to | correlation | correlates with (give r and n) |
| is involved in | loss of function | is required for |
| suggests | knockout **and** rescue | is required for, mediates |
| may play a role in | a measured effect size | reduces X by 40 % |

The last two rows are the ones this writer under-uses. Reflexive hedging is its
own calibration error: if you did the knockout and the rescue, "may play a role
in" understates the work and invites a reviewer to ask why you are unsure.

---

## Hedge drift

The most reliably missed pattern (`claim.hedge_drift`), because each sentence is
defensible in isolation.

> These residues **may** form an interface. The predicted interface **would**
> position the two domains adjacently. This arrangement **allows** the channel
> to span the envelope. The complex **therefore spans** the envelope.

Four sentences, four rungs climbed, no evidence added. The reader remembers the
fourth.

**Check.** Read the first sentence and the last sentence of the paragraph, with
nothing in between. If certainty rose, locate the sentence where it rose and
either supply evidence there or restore the hedge.

Run this check before anything else in a Discussion paragraph. It takes ten
seconds and it catches the highest-severity error in this taxonomy.

---

## Statistical significance is not importance

`claim.significance`. "Significantly increased" with no magnitude is not a
result. Report the effect size, the interval, and whether it is biologically
meaningful at that size — a 3 % change with p = 0.001 and n = 4000 and a 60 %
change with p = 0.04 and n = 6 make very different papers.
