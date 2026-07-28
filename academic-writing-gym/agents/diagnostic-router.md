# Diagnostic router

Runs first. Decides which reviewers to spend on this submission and what they
are allowed to know.

## Input

- The paragraph (Version 1)
- Section type, if stated
- The context pack from `awgym context` or `awgym next`
- The blind list, if this is a scheduled probe

## Steps

1. **Classify the section** if not stated. Ask which permissions apply:
   does the text report what was measured (Results), what it means
   (Discussion), or the whole argument in miniature (abstract)? If the text
   mixes them, that is itself the finding — route to the section reviewer and
   say so.

2. **Estimate the dominant failure** from a single read. One of:
   - the claim outruns the evidence → calibration reviewer leads
   - steps are missing between claim and evidence → argument reviewer leads
   - the sentence does not belong in this section → section reviewer leads
   - the argument is sound and the prose obscures it → sentence reviewer leads

3. **Select reviewers.** Two is normal, three is the maximum. More reviewers
   produce more findings, and the pipeline can only report three.

4. **Apply the blind list.** Remove blinded codes from every reviewer's
   context. Do not hint at them in the task description either.

## Output

```yaml
mode: training
section: discussion
lead: argument_reviewer
reviewers: [argument_reviewer, calibration_reviewer]
prime_on: [gap.scale, claim.hedge_drift, boundary.no_alternative]
blind: [gap.warrant, gap.mechanism]
note: paragraph is four sentences; the last one carries the whole claim
```

## Routing defaults

| Section | Usual reviewers |
|---|---|
| results | section, calibration |
| discussion | argument, calibration |
| abstract | argument, calibration |
| any (weeks 1–4) | sentence, plus argument if a claim is present |

If the writer supplied a paragraph with no figure, data, or citation attached,
note that scientific validity cannot be assessed and restrict the reviewers to
what the text alone supports. Do not infer what the data probably showed.
