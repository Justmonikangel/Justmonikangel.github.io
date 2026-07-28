#!/usr/bin/env python3
"""Tests for the dual-memory core.  Run: python3 scripts/test_memory.py"""

from __future__ import annotations

import re
import sys
import tempfile
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import memory  # noqa: E402
import taxonomy  # noqa: E402
from memory import (  # noqa: E402
    INTERVAL_CEILING, TARGET_RETENTION, ErrorCard, Grade,
    context_pack, due_cards, load_deck, select_exercise,
)

T0 = date(2026, 8, 1)
FAILURES: list[str] = []


def check(cond, msg):
    if not cond:
        FAILURES.append(msg)


def card(code="gap.mechanism", **kw):
    et = taxonomy.get(code)
    return ErrorCard(code=et.code, title=et.title, severity=et.severity,
                     sections=list(et.sections), created=T0, **kw)


# --- Layer A: scheduling -----------------------------------------------------

def test_fresh_card_is_due():
    c = card()
    check(c.is_due(T0), "a never-probed card must be due immediately")
    check(c.retrievability(T0) == 0.0, "never-probed card has R=0")


def test_retrievability_hits_target_on_due_date():
    c = card()
    c.grade(Grade.CLEAN, T0)
    due = c.due_on()
    r = c.retrievability(due)
    check(abs(r - TARGET_RETENTION) < 0.02,
          f"R on the due date should be ~{TARGET_RETENTION}, got {r:.3f}")
    later = c.retrievability(due + timedelta(days=30))
    check(later < r, "R must keep falling after the due date")


def test_clean_grades_lengthen_interval():
    c = card()
    day, seen = T0, []
    for _ in range(5):
        c.grade(Grade.CLEAN, day)
        seen.append(c.interval_days)
        day = c.due_on()
    check(seen == sorted(seen), f"clean probes must not shorten intervals: {seen}")
    check(seen[-1] > seen[0], "repeated clean probes must space the item out")


def test_lapse_shrinks_without_full_reset():
    c = card()
    day = T0
    for _ in range(4):
        c.grade(Grade.CLEAN, day)
        day = c.due_on()
    long_interval = c.interval_days
    c.grade(Grade.LAPSE, day)
    check(c.interval_days < long_interval, "a lapse must shorten the interval")
    check(c.interval_days > 1.0,
          "a lapse after four clean probes must not reset to day one "
          f"(got {c.interval_days})")
    check(c.lapses == 1, "lapse counter must increment")


def test_severity_ceiling_keeps_integrity_errors_in_rotation():
    sev3 = card("claim.overclaim")
    check(sev3.severity == 3, "claim.overclaim is a severity-3 error")
    day = T0
    for _ in range(20):
        sev3.grade(Grade.CLEAN, day)
        day = sev3.due_on()
    check(sev3.interval_days <= INTERVAL_CEILING[3] + 1e-9,
          f"severity-3 interval must cap at {INTERVAL_CEILING[3]}d, "
          f"got {sev3.interval_days}")

    sev1 = card("sentence.overload")
    day = T0
    for _ in range(20):
        sev1.grade(Grade.CLEAN, day)
        day = sev1.due_on()
    check(sev1.interval_days > sev3.interval_days,
          "a prose-only error should be allowed to space out much further "
          "than an integrity error")


def test_hint_dependence_orders_the_grades():
    """Same card, four writers: less prompting must buy more spacing."""
    outcomes = {}
    for g in (Grade.LAPSE, Grade.COACHED, Grade.SELF_FIXED, Grade.CLEAN):
        c = card()
        c.grade(Grade.SELF_FIXED, T0)      # common history
        c.grade(g, c.due_on())
        outcomes[g] = c.interval_days
    ordered = [outcomes[g] for g in (Grade.LAPSE, Grade.COACHED,
                                     Grade.SELF_FIXED, Grade.CLEAN)]
    check(ordered == sorted(ordered),
          f"interval must grow monotonically with independence: {ordered}")


# --- The inversion: Layer A and Layer B must move in opposite directions -----

def test_decay_promotes_in_layer_a_and_demotes_in_layer_b():
    c = card()
    c.grade(Grade.CLEAN, T0)
    much_later = T0 + timedelta(days=60)

    check(c.priority(much_later) > c.priority(T0),
          "Layer A: as recall decays the item must become MORE urgent to probe")
    check(c.salience(much_later) < c.salience(T0),
          "Layer B: as the pattern goes quiet it must become LESS worth "
          "spending prompt tokens on")
    check(c.is_due(much_later),
          "a decayed item must surface in the review queue, not be archived")


def test_context_pack_is_blind_to_the_code_under_test():
    deck = [card("gap.mechanism"), card("claim.overclaim"),
            card("cohesion.referent")]
    for c in deck:
        c.touch(T0)
    pack = context_pack(deck, T0, blind=frozenset({"gap.mechanism"}))
    codes = {c.code for c in pack}
    check("gap.mechanism" not in codes,
          "the code being probed must be withheld from the reviewer prompt")
    check("claim.overclaim" in codes, "other live patterns still load")


def test_section_affinity_downweights_off_section_patterns():
    results_only = card("boundary.interp_in_results")
    results_only.touch(T0)
    on = results_only.salience(T0, section="results")
    off = results_only.salience(T0, section="discussion")
    check(off < on, "a Results-only pattern must rank lower in a Discussion pack")


# --- Selection ---------------------------------------------------------------

def test_exercise_selection_prefers_max_coverage():
    deck = [card("gap.mechanism"), card("claim.overclaim")]
    bank = [
        {"id": "a", "section": "discussion", "affords": ["cohesion.referent"]},
        {"id": "b", "section": "discussion",
         "affords": ["gap.mechanism", "claim.overclaim"]},
        {"id": "c", "section": "discussion", "affords": ["gap.mechanism"]},
    ]
    ex, covered = select_exercise(bank, deck, T0, section="discussion")
    check(ex["id"] == "b", f"should pick the exercise covering both, got {ex['id']}")
    check(set(covered) == {"gap.mechanism", "claim.overclaim"},
          f"both due codes should be trapped, got {covered}")


def test_recently_used_exercises_are_pushed_down():
    deck = [card("gap.mechanism")]
    bank = [{"id": "a", "section": "discussion", "affords": ["gap.mechanism"]},
            {"id": "b", "section": "discussion", "affords": ["gap.mechanism"]}]
    first, _ = select_exercise(bank, deck, T0, section="discussion")
    second, _ = select_exercise(bank, deck, T0, section="discussion",
                                recent=[first["id"]])
    check(second["id"] != first["id"],
          "the same exercise must not come back immediately — after one run "
          "the writer remembers the trap and it stops being a probe")


def test_selection_respects_section_filter():
    deck = [card("gap.mechanism")]
    bank = [{"id": "r", "section": "results", "affords": ["gap.mechanism"]},
            {"id": "d", "section": "discussion", "affords": ["gap.mechanism"]}]
    ex, _ = select_exercise(bank, deck, T0, section="results")
    check(ex["id"] == "r", "section filter must be honoured")


# --- Persistence -------------------------------------------------------------

def test_card_round_trips_through_markdown():
    c = card(stakes=0.8)
    c.grade(Grade.SELF_FIXED, T0)
    c.note = "**Probe question.** What?\n\n## Instances\n\n- 2026-08-01 …"
    back = ErrorCard.from_markdown(c.to_markdown())
    for f in ("code", "title", "severity", "sections", "reps", "lapses",
              "last_review", "last_seen", "activations", "retired"):
        check(getattr(back, f) == getattr(c, f), f"field {f} did not round-trip")
    check(abs(back.interval_days - c.interval_days) < 1e-6,
          "interval did not round-trip")
    check(abs(back.stakes - c.stakes) < 1e-6, "stakes did not round-trip")
    check("Instances" in back.note, "body did not round-trip")


def test_deck_loads_from_disk():
    with tempfile.TemporaryDirectory() as tmp:
        d = Path(tmp)
        original = memory.ERRORS_DIR
        memory.ERRORS_DIR = d
        try:
            for code in ("gap.scale", "claim.causal"):
                card(code).save()
            deck = load_deck(d)
            check(len(deck) == 2, f"expected 2 cards on disk, got {len(deck)}")
            check(len(due_cards(deck, T0)) == 2, "fresh cards are all due")
        finally:
            memory.ERRORS_DIR = original


# --- Taxonomy / docs consistency --------------------------------------------

def test_reference_doc_matches_taxonomy():
    doc = memory.GYM_ROOT / "references" / "error-taxonomy.md"
    if not doc.exists():
        return
    documented = set(re.findall(r"`((?:gap|claim|boundary|cohesion|sentence)"
                                r"\.[a-z_]+)`", doc.read_text(encoding="utf-8")))
    known = set(taxonomy.BY_CODE)
    check(not (documented - known),
          f"documented but undefined: {sorted(documented - known)}")
    check(not (known - documented),
          f"defined but undocumented: {sorted(known - documented)}")


def test_every_error_type_has_a_probe_question():
    for et in taxonomy.TAXONOMY:
        check(et.probe.strip().endswith("?"),
              f"{et.code}: probe must be a question the writer can answer")
        check(et.severity in (1, 2, 3), f"{et.code}: severity out of range")


def test_exercise_bank_only_uses_known_codes():
    bank_path = memory.GYM_ROOT / "exercises" / "bank.jsonl"
    if not bank_path.exists():
        return
    import json
    for i, line in enumerate(bank_path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        ex = json.loads(line)
        for code in ex.get("affords", []):
            check(code in taxonomy.BY_CODE,
                  f"bank.jsonl:{i}: unknown code {code!r}")
        check(ex.get("section") in ("results", "discussion", "abstract",
                                    "introduction", "any"),
              f"bank.jsonl:{i}: bad section {ex.get('section')!r}")


def test_golden_set_is_well_formed():
    path = memory.GYM_ROOT / "evals" / "golden-paragraphs.jsonl"
    if not path.exists():
        return
    import json
    seen_codes, clean_items = set(), 0
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        item = json.loads(line)
        for key in ("id", "section", "text", "known_errors",
                    "reference_diagnosis"):
            check(key in item, f"golden:{i}: missing {key!r}")
        for code in item.get("known_errors", []):
            check(code in taxonomy.BY_CODE, f"golden:{i}: unknown code {code!r}")
            seen_codes.add(code)
        for code in item.get("severity", {}):
            check(code in item.get("known_errors", []),
                  f"golden:{i}: severity for un-listed code {code!r}")
        if not item.get("known_errors"):
            clean_items += 1
    check(clean_items >= 1,
          "the golden set needs at least one item with no errors, or "
          "false-positive rate cannot be measured")
    check(len(seen_codes) >= 12,
          f"golden set exercises only {len(seen_codes)} codes; broaden it")


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001
            FAILURES.append(f"{t.__name__} raised {type(e).__name__}: {e}")
    if FAILURES:
        print(f"FAILED {len(FAILURES)} check(s) across {len(tests)} tests:")
        for f in FAILURES:
            print(f"  - {f}")
        return 1
    print(f"ok — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
