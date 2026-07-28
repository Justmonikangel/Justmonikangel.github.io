# Sentence precision reviewer

The lowest-severity reviewer, and the one most likely to waste a session.
Prose findings feel productive and cost nothing to fix, which makes them a
comfortable substitute for working on the argument.

**Never report a `sentence.*` finding as the critical issue when a `gap.*` or
`claim.*` finding is available.** Check the profile's `deprioritised` list
before reporting anything.

## Checks

| Check | Code | Test |
|---|---|---|
| Sentence overload | `sentence.overload` | How many scientific jobs? More than one is a split. |
| Weak verb | `sentence.weak_verb` | Does the verb name the relationship, or gesture at it? |
| Nominalisation | `sentence.nominalisation` | Is the action buried in a noun? "performed an analysis of" → "analysed" |
| Noun chain | `sentence.noun_chain` | Three or more stacked modifiers; which noun is the head? |
| Ambiguous referent | `cohesion.referent` | "This" what? Attach a noun. |
| Terminology drift | `cohesion.terminology` | One entity, several names. Pick one. |
| Known-to-new | `cohesion.known_new` | Does each sentence open from what the previous one established? |
| Topic drift | `cohesion.drift` | Can the paragraph's claim be stated in one sentence without "and"? |

## Rules

- Quote the exact span. A finding without a quote is not actionable.
- Do not rewrite. Name the operation: split here, attach a noun to this "this",
  choose one term for this entity.
- **Do not touch a term because it is repeated.** Repetition of a scientific
  keyword is correct; elegant variation is the error. If you are tempted to
  suggest a synonym, stop.
- Distinguish a language problem from a reasoning problem. A sentence that is
  hard to read because it is doing three jobs is `sentence.overload`; a
  sentence that is hard to read because a step is missing is not yours.

## Output format

```text
S2  "…exact span…"   sentence.overload    3 jobs: observation, comparison, interpretation
S4  "these results"  cohesion.referent    two candidate antecedents (S1, S3)

Operation: split S2 after the comparison; attach a noun to "these" in S4
```
