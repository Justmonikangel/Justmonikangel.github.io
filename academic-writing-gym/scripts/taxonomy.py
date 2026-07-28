"""Canonical error codes.

This module is the single source of truth.  references/error-taxonomy.md
explains each code in prose; test_memory.py checks the two do not drift.

Severity is calibrated for *this* writer, not universally:
  3 = damages the scientific claim (a reviewer would challenge it)
  2 = damages the reader's ability to follow the claim
  1 = damages the prose only
"""

from __future__ import annotations

from dataclasses import dataclass

RESULTS = "results"
DISCUSSION = "discussion"
ABSTRACT = "abstract"
INTRO = "introduction"
ALL_SECTIONS = [ABSTRACT, INTRO, RESULTS, DISCUSSION]


@dataclass(frozen=True)
class ErrorType:
    code: str
    title: str
    severity: int
    sections: tuple[str, ...]
    probe: str      # the one question that detects it


TAXONOMY: tuple[ErrorType, ...] = (
    # -- gap.*: the missing inferential step.  Primary target for this writer.
    ErrorType("gap.warrant", "Unstated warrant between evidence and claim", 3,
              (RESULTS, DISCUSSION, ABSTRACT),
              "What sentence would a sceptical reader have to write for "
              "themselves to get from the evidence to this claim?"),
    ErrorType("gap.mechanism", "Association or structure jumped to mechanism", 3,
              (DISCUSSION, ABSTRACT),
              "Which experiment in this work tested the mechanism, as opposed "
              "to being consistent with it?"),
    ErrorType("gap.scale", "Inference crossed a scale without a bridge", 3,
              (DISCUSSION, ABSTRACT),
              "In silico, in vitro, cell, tissue, organism: which one was "
              "measured, and which one does the claim describe?"),
    ErrorType("gap.population", "Sample generalised beyond what was sampled", 2,
              (DISCUSSION, ABSTRACT),
              "Who or what was actually measured, and who does the claim "
              "now cover?"),
    ErrorType("gap.temporal", "Cross-sectional evidence read as a sequence", 3,
              (RESULTS, DISCUSSION),
              "Does the design establish which event came first?"),
    ErrorType("gap.definition", "A term changed meaning mid-argument", 2,
              ALL_SECTIONS,
              "Does this term mean the same thing in the last sentence as it "
              "did in the first?"),
    ErrorType("gap.quantifier", "Quantifier or modality strengthened silently", 2,
              ALL_SECTIONS,
              "Did 'some' become 'all', or 'may' become 'does', between two "
              "sentences?"),
    ErrorType("gap.negative", "Absence of evidence read as evidence of absence", 3,
              (RESULTS, DISCUSSION),
              "Was the assay powered to detect the thing reported as absent?"),

    # -- claim.*: epistemic calibration
    ErrorType("claim.overclaim", "Certainty language exceeds the evidence", 3,
              ALL_SECTIONS,
              "Rank the verb on the claim ladder; rank the evidence. Do they "
              "sit at the same rung?"),
    ErrorType("claim.causal", "Causal verb without a causal design", 3,
              (RESULTS, DISCUSSION, ABSTRACT),
              "Was anything perturbed, or only observed?"),
    ErrorType("claim.novelty", "Novelty asserted without a comparison", 1,
              (ABSTRACT, INTRO, DISCUSSION),
              "First compared to what, exactly?"),
    ErrorType("claim.hedge_drift", "Hedge introduced early, dropped later", 3,
              (DISCUSSION, ABSTRACT),
              "The paragraph opens with 'may'. What does the last sentence "
              "say?"),
    ErrorType("claim.significance", "Statistical significance read as importance", 2,
              (RESULTS, DISCUSSION),
              "What is the effect size, and is it biologically meaningful?"),

    # -- boundary.*: section function
    ErrorType("boundary.interp_in_results", "Interpretation inside Results", 2,
              (RESULTS,),
              "Could this sentence be wrong even if the data are right?"),
    ErrorType("boundary.results_in_discussion", "Results replayed in Discussion", 1,
              (DISCUSSION,),
              "Does this sentence add an inference, or repeat a number?"),
    ErrorType("boundary.no_alternative", "No alternative explanation offered", 2,
              (DISCUSSION,),
              "What else could produce this result?"),
    ErrorType("boundary.no_limitation", "Limitation missing or generic", 2,
              (DISCUSSION, ABSTRACT),
              "What is the strongest objection a reviewer would raise?"),

    # -- cohesion.*: reader tracking
    ErrorType("cohesion.referent", "Ambiguous this / these / it", 2,
              ALL_SECTIONS, "This what?"),
    ErrorType("cohesion.terminology", "One entity, several names", 2,
              ALL_SECTIONS,
              "Are these two terms the same object, and if so which one "
              "will you keep?"),
    ErrorType("cohesion.drift", "Paragraph serves more than one claim", 2,
              ALL_SECTIONS,
              "Can you state the paragraph's single claim in one sentence "
              "without using 'and'?"),
    ErrorType("cohesion.known_new", "New information before its anchor", 2,
              ALL_SECTIONS,
              "Does each sentence start from something the previous sentence "
              "established?"),

    # -- sentence.*: prose only
    ErrorType("sentence.overload", "One sentence, several scientific jobs", 1,
              ALL_SECTIONS, "How many claims are in this sentence?"),
    ErrorType("sentence.weak_verb", "Verb does not name the relationship", 1,
              ALL_SECTIONS, "Which precise verb does the evidence license?"),
    ErrorType("sentence.nominalisation", "Action buried in a noun", 1,
              ALL_SECTIONS, "Who does what to whom?"),
    ErrorType("sentence.noun_chain", "Three or more stacked modifiers", 1,
              ALL_SECTIONS, "Which noun is the head?"),
)

BY_CODE = {e.code: e for e in TAXONOMY}
FAMILIES = ("gap", "claim", "boundary", "cohesion", "sentence")


def get(code: str) -> ErrorType:
    try:
        return BY_CODE[code]
    except KeyError:
        raise KeyError(
            f"unknown error code {code!r}; known codes: "
            + ", ".join(sorted(BY_CODE))
        ) from None


def family(code: str) -> str:
    return code.split(".", 1)[0]
