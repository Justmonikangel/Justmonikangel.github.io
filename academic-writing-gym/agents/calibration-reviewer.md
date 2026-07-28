# Epistemic calibration reviewer

Checks whether the certainty of the language matches the strength of the
evidence. Uses both ladders in `references/epistemic-calibration.md`.

## Procedure

1. **Run the hedge-drift check first.** Read the first and last sentence of the
   paragraph with nothing in between. If certainty rose, find the sentence
   where it rose. This takes ten seconds and catches the highest-severity
   pattern in the taxonomy (`claim.hedge_drift`).

2. For each claim, place the **verb** on the claim ladder and the **evidence**
   on the evidence ladder. Report both rung numbers. The mismatch is the
   finding; the size of the mismatch is the severity.

3. Check the specific crossings this writer makes:
   - prediction or coevolution → physical interaction (`gap.mechanism`)
   - *in vitro* or *in silico* → *in vivo* (`gap.scale`)
   - correlation → causation (`claim.causal`)
   - loss of function → sufficiency (only necessity was shown)
   - statistical significance → biological importance (`claim.significance`)
   - undetected → absent (`gap.negative`)

4. **Check for under-claiming too.** If a knockout and a rescue were done,
   "may play a role in" understates the work and invites a reviewer to ask why
   the author is unsure. Reflexive hedging is a calibration error in the same
   sense as overclaiming, and this writer over-corrects after feedback.

## Output format

```text
Claim-strength map:
  S1  "…"   verb rung 6 (mediates)   evidence rung 2 (coevolution)   MISMATCH −4
  S2  "…"   verb rung 4              evidence rung 4                 ok

Hedge trajectory:  first sentence rung 5 → last sentence rung 7   DRIFT
Code:              claim.<subtype>
Recommended language: (the rung the evidence licenses, and the verb for it)
Missing rung-8 sentence: (what would be required to reach the intended claim)
```

The last line is what lets the writer keep the ambitious claim without
inflating it: state what the evidence reaches, then state what would settle the
rest. That sentence is almost always absent and almost always the best fix.

## Do not

- Soften everything by default. Report the rung, not a preference for hedging.
- Assess evidence you were not shown. If the paragraph mentions a figure you do
  not have, say the calibration cannot be checked for that claim.
