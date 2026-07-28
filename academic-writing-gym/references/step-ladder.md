# The step ladder: finding the sentence that was never written

The primary diagnostic instrument for a writer whose reasoning is sound and
whose prose is compressed. Use it on any paragraph flagged for a `gap.*` code.

The premise: a skipped step is invisible to its author, because the author did
perform it. It exists in her head and nowhere on the page. So the diagnosis
cannot be "the logic is unclear" — the logic is fine. The diagnosis has to
**name the sentence that is missing**.

---

## Procedure

### 1. Decompose into propositions

Rewrite the paragraph as a numbered list of atomic propositions, in the order
the text presents them. One assertion per line. Strip hedges for now — they are
graded separately by the calibration reviewer.

> **Text.** AlphaFold predicted contacts between SpoIIIAA and SpoIIIAE.
> Coevolution analysis identified residue pairs in the same region. These
> proteins therefore form the transenvelope channel.

```
P1  AlphaFold predicts residue contacts between SpoIIIAA and SpoIIIAE.
P2  Coevolving residue pairs occur in the same region.
P3  SpoIIIAA and SpoIIIAE form the transenvelope channel.
```

### 2. Test every adjacent pair

For each step Pn → Pn+1 ask one question:

> **Is there a proposition a sceptical reader must supply for themselves to
> accept this move?**

If yes, write it. That is the gap.

```
P1 → P2   fine (two independent observations, no inference yet)
P2 → P3   GAP
```

### 3. Write the missing propositions explicitly

Do not describe them. Write them as sentences, in the writer's own domain
vocabulary.

```
M1  Coevolving residues tend to be in physical contact, because a
    substitution in one is compensated by a substitution in the other.
M2  Two independent signals pointing at the same interface is stronger
    evidence than either alone.
M3  A predicted interface is not an observed complex; nothing here was
    measured in a cell.
```

M1 and M2 are the steps she skipped. M3 is the step she skipped **past** —
the boundary of what the evidence reaches. Both kinds count.

### 4. Classify the gap

| The missing step is about… | Code |
|---|---|
| why this kind of evidence bears on this kind of claim | `gap.warrant` |
| how a correlation or structure becomes a mechanism | `gap.mechanism` |
| moving between *in silico*, *in vitro*, cell, organism | `gap.scale` |
| moving from the sample to a wider set | `gap.population` |
| establishing what happened first | `gap.temporal` |
| whether a term still means what it meant | `gap.definition` |
| how "some" or "may" became "all" or "does" | `gap.quantifier` |
| whether a null result could have been detected | `gap.negative` |

### 5. Hand back one repair objective

Not a rewrite. One instruction naming the step:

> Between the coevolution sentence and the channel claim, one proposition is
> missing: why coevolution bears on physical proximity at all. Write that
> sentence. Then check whether the claim it now supports is still "form the
> channel".

The second half matters. Writing the missing warrant usually reveals that the
conclusion was too strong — the gap and the overclaim are the same defect seen
from two ends. Repairing one exposes the other.

---

## The two shapes this writer produces

### Compression

Steps exist and are correct; two or three were performed in one sentence.
Signature: the paragraph is short, dense, and every sentence is true.

> The convergence of the two signals supports a physical interaction.

"Convergence" is doing the work of M1 and M2 at once. The fix is expansion:
one proposition per sentence at the joint.

### Overreach

The final step was never available at all — no amount of expansion reaches it.
Signature: the paragraph is fine until the last sentence.

> …and therefore mediates assembly of the transenvelope complex *in vivo*.

The fix is not more sentences, it is a shorter ladder: state what the evidence
reaches, then state what would be required to reach further. That is M3
promoted to a full sentence.

**These require opposite repairs, so classify before prescribing.** Telling a
writer to add reasoning when the real problem is overreach produces a longer
paragraph that is wrong in the same way.

---

## Worked example

**V1**

> The mutant strain showed reduced sporulation efficiency, confirming that
> SpoIIIAE is required for channel assembly.

```
P1  The mutant sporulates less efficiently than wild type.
P2  SpoIIIAE is required for channel assembly.

P1 → P2   GAP  (and the verb "confirming" claims there is none)
```

Missing:

```
M1  Sporulation requires a functional transenvelope channel.
M2  The strain differs from wild type only in spoIIIAE.
M3  A phenotype locates the requirement at the level of sporulation,
    not at the level of assembly — assembly was not observed.
```

Three steps between P1 and P2, none written, and M3 says the last one cannot be
walked at all with this evidence. This is the compression and the overreach
shapes in the same sentence, which is the common case.

**V2**

> The spoIIIAE mutant sporulated less efficiently than the isogenic wild type.
> Because sporulation depends on a functional transenvelope channel, this
> phenotype is consistent with a requirement for SpoIIIAE in channel function.
> Whether the protein is needed for assembly of the channel or for its activity
> once assembled cannot be distinguished by a sporulation assay, and would
> require direct visualisation of the complex in the mutant background.

Three sentences instead of one, and the claim is now smaller and defensible.
Note that the revision did not remove the idea — it made the idea arguable.
