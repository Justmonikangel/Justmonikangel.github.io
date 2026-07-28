# Academic Writing Gym

A scientific writing coach that trains the writer instead of editing the text.

Most AI writing tools improve the paragraph and leave the writer unchanged.
This one diagnoses without rewriting, makes you revise, compares your two
versions, remembers what you got wrong, and schedules the next exercise to trap
that pattern again.

Built for one specific failure mode: **reasoning is sound, prose is compressed.**
The intermediate inferential steps are performed mentally and never written
down, so paragraphs read as unsupported to anyone who does not already share
the author's model. The system's job is to make the missing sentence visible
and then make you write it.

---

## Quick start

```bash
python3 scripts/awgym.py seed          # create error cards from profile.yaml
python3 scripts/awgym.py due           # what is ready to be probed
python3 scripts/awgym.py next --section discussion --week 7
```

Then open the repo with an agent that reads `SKILL.md` and hand it a paragraph.
After the session:

```bash
python3 scripts/awgym.py log --code gap.warrant --grade self_fixed --session cer-01
python3 scripts/awgym.py report
```

Tests: `python3 scripts/test_memory.py`. No third-party dependencies.

---

## How a session runs

1. The scheduler picks an exercise whose **traps** cover the error patterns
   that are due, and withholds those codes from the reviewer so the diagnosis
   is not primed.
2. You write Version 1.
3. The agent reports **one** critical issue at hint level L0 — *"there is one
   critical issue"* — and nothing else.
4. You ask for hints. Each request buys exactly one rung: location, then
   category, then the missing step written out.
5. You write Version 2. Only now can a reference revision be shown.
6. The rung you needed becomes the grade. Less prompting buys a longer gap
   before that pattern is probed again.

The measurement is **prompt dependence**, not error count. For a writer who
already knows what a warrant is, "did the error occur" is noise; "how much
prompting before the step appeared on the page" is the signal.

---

## Design decisions worth knowing

**Two memories, opposite rules.** A scheduling memory where decay means *probe
this sooner*, and a context memory where decay means *drop this from the
prompt*. Same exponential, opposite decisions. Conflating them produces a
system that stops checking the errors you are about to relapse into.
See `docs/memory-design.md`.

**Severity-3 patterns never graduate.** Overclaiming is not a skill you acquire
and keep; it is a behaviour that returns under deadline pressure. Mastery buys
a longer interval, capped at 45 days, forever.

**Reviewers are blind to what is being tested.** A reviewer told to look for an
overclaim will find one whether or not it is there.

**Prose findings cannot be the critical issue** when an argument finding is
available. Fixing sentences feels like progress and is the most comfortable way
to spend a session without touching the argument.

**The golden set contains a correct paragraph** that is under-claimed. An agent
that softens it has failed — reflexive hedging is a calibration error in the
same sense as overclaiming.

---

## Layout

```
SKILL.md                     agent entry point: modes, session protocol, hard rules
docs/memory-design.md        why the scheduler works this way
references/
  error-taxonomy.md          25 codes, severity, probe questions
  step-ladder.md             how to find the sentence that was never written
  hint-ladder.md             L0-L3 and grading
  epistemic-calibration.md   claim ladder vs evidence ladder
  twelve-week-curriculum.md  what unlocks when
agents/                      reviewer prompts (router, argument, calibration,
                             section, sentence, coach, reviewer simulator)
learner/
  profile.yaml               who is being trained, and the hard constraints
  errors/*.md                one card per pattern: scheduler state + instances
  sessions.jsonl             append-only grade history
exercises/bank.jsonl         exercises tagged with the errors they afford
evals/golden-paragraphs.jsonl  annotated paragraphs for measuring the reviewers
scripts/                     awgym.py (CLI), memory.py (dual memory),
                             taxonomy.py (codes), test_memory.py
```

Error cards are Markdown with YAML frontmatter, so they drop into an Obsidian
vault or an Ombre-Brain memory directory unchanged.

---

## Modes

**Training** (default) — never rewrites, always grades.
**Deadline** — rewrites with a change log, grades nothing. A session run under
time pressure measures the pressure.
**Manuscript** — whole-document architecture, terminology, reviewer simulation.

---

## Prior art

The design borrows deliberately and narrowly:

| Source | Borrowed |
|---|---|
| [Ombre-Brain](https://github.com/P0lar1zzZ/Ombre-Brain) (MIT) | Decay score shape, frontmatter card format, arousal→stakes weighting |
| [fluent](https://github.com/m98/fluent) | Spaced repetition and mastery-loop framing |
| [academic-writing-agents](https://github.com/andrehuang/academic-writing-agents) (MIT) | Parallel reviewer role separation |
| [sciwrite](https://github.com/labarba/sciwrite) (CC) | Sentence-level audit checks — ideas only, no text reused |
| [paper-writing-skill](https://github.com/SNL-UCSB/paper-writing-skill) | Manuscript-mode architecture |
| [anthropics/skills](https://github.com/anthropics/skills) | `SKILL.md` packaging convention |

Built here rather than borrowed: the step ladder, the hint ladder and its
grading, the dual-memory scheduler, the trap-tagged exercise bank, the
biomedical taxonomy, and the anti-ghostwriting constraints.
