# The hint ladder

The single mechanism that makes this a training system rather than an editing
service. Every diagnosis enters at L0 and descends one rung at a time, only on
request.

The writer's problem is not that she cannot see the missing step. It is that
she does not write it down. So the measurement that matters is not *did the
error occur* — it is **how much prompting did she need before the step
appeared on the page**.

---

## The rungs

### L0 — existence

> This paragraph has one critical issue. Take another look.

Nothing else. No location, no category, no count of secondary issues.

Give the writer at least thirty seconds of genuine search here. Most of the
learning happens on this rung: it is the only one that trains the writer to
run the check herself.

### L1 — location

> The issue is between sentence 2 and sentence 3.

Point at the seam, not at the error. For a `gap.*` finding the location is
always *between* two sentences — that is where the missing step goes.

Still no category name.

### L2 — category

> `gap.mechanism` — an association was reported and the next sentence describes
> a mechanism, but nothing in between tested the mechanism.

Name the code, give the one-line definition and the probe question from
`error-taxonomy.md`. Do not apply it to her text. She now knows what to look
for and still has to find it.

### L3 — demonstration

> The step you skipped is: *coevolving residues tend to be in physical contact
> because a substitution in one is compensated by a substitution in the other,
> which is why the signal bears on interaction at all.*

Only reached when L2 did not produce a repair, or when the writer explicitly
asks to be shown. This rung is instruction, not assessment — the item is graded
`lapse` regardless of how good the resulting revision is.

---

## Rules

1. **One rung per request.** Never volunteer two. If the writer says "I don't
   see it", that buys exactly one descent.
2. **Never skip to L3** because the paragraph is bad. A bad paragraph is more
   reason to make her work, not less.
3. **No reference revision before Version 2 exists.** Not a sentence of one.
   If she asks for a rewrite before submitting V2, restate the revision
   objective instead and offer L2.
4. **Deadline Mode suspends the ladder**, and says so out loud: *"Deadline
   Mode — this session will not be graded."* No card is updated. A session run
   under deadline pressure measures the deadline, not the writer.
5. **The ladder applies to the critical issue only.** Secondary issues may be
   named at L2 immediately; they are not being graded.

---

## Grading

The grade is the rung at which the repair happened, inverted.

| Rung reached | Grade | Value | Meaning |
|---|---|---|---|
| Never needed — trap avoided | `clean` | 3 | The pattern did not appear on a task designed to elicit it |
| Repaired after L1 | `self_fixed` | 2 | She can find it once she knows where to look |
| Repaired after L2 | `coached` | 1 | She can fix it once it is named |
| Needed L3, or unrepaired | `lapse` | 0 | The check is not internalised yet |

Record it:

```bash
python3 scripts/awgym.py log --code gap.mechanism --grade self_fixed --session cer-01
```

`clean` requires that the exercise actually afforded the error — check
`affords` in `exercises/bank.jsonl`. Grading `clean` on a task where the error
was impossible inflates the interval and hides a live weakness. When in doubt,
do not log it at all.

Add `--stakes 0.9` when the error was caught by a real reviewer or supervisor
rather than by this system. That raises how long the pattern stays in the
reviewer's context pack.

---

## What progress looks like

Not "fewer errors". The exercise bank keeps difficulty roughly constant, so raw
error counts are noisy. The signal is the ladder position drifting up over
repeated encounters with the *same code*:

```
gap.warrant   L3 → L3 → L2 → L2 → L1 → L2 → L1 → L1 → clean → clean
```

The single L2 relapse at position 6 is normal and is exactly what the partial
interval reset is designed to absorb. `awgym report` shows this as the interval
column growing; `learner/sessions.jsonl` has the raw sequence.
