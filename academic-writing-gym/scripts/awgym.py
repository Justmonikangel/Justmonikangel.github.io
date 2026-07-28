#!/usr/bin/env python3
"""Academic Writing Gym CLI.

  awgym seed [CODE ...]        create error cards (default: profile focus list)
  awgym due                    what is ready to be re-probed today
  awgym next [--section S]     choose the next exercise and set its traps
  awgym log --code C --grade G record an outcome and reschedule
  awgym context [--section S]  the reviewer's context pack for this session
  awgym report                 mastery overview
  awgym forecast [--days N]    review load for the coming weeks

Every command takes --json for machine-readable output, and --date
YYYY-MM-DD to run as if today were another day (used by the tests).
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import taxonomy  # noqa: E402
from memory import (  # noqa: E402
    GYM_ROOT, ERRORS_DIR, Grade, GRADE_NAMES, ErrorCard,
    context_pack, due_cards, load_deck, select_exercise,
)

BANK_PATH = GYM_ROOT / "exercises" / "bank.jsonl"
PROFILE_PATH = GYM_ROOT / "learner" / "profile.yaml"
LOG_PATH = GYM_ROOT / "learner" / "sessions.jsonl"

DEFAULT_FOCUS = [
    "gap.warrant", "gap.mechanism", "gap.scale", "gap.quantifier",
    "claim.overclaim", "claim.causal", "claim.hedge_drift",
    "boundary.interp_in_results", "cohesion.referent", "sentence.overload",
]


# --- commands ---------------------------------------------------------------

def cmd_seed(args) -> int:
    codes = args.codes or _profile_focus() or DEFAULT_FOCUS
    made, skipped = [], []
    for code in codes:
        et = taxonomy.get(code)
        card = ErrorCard(
            code=et.code, title=et.title, severity=et.severity,
            sections=list(et.sections), created=args.today,
            note=_starter_note(et),
        )
        if card.path.exists():
            skipped.append(code)
            continue
        card.save()
        made.append(code)
    _emit(args, {"created": made, "existing": skipped},
          lambda d: f"created {len(d['created'])} card(s), "
                    f"{len(d['existing'])} already present\n"
                    + "".join(f"  + {c}\n" for c in d["created"]))
    return 0


def cmd_due(args) -> int:
    deck = load_deck()
    due = due_cards(deck, args.today)
    payload = [_card_row(c, args.today) for c in due]

    def render(rows):
        if not rows:
            return "nothing due today\n"
        out = [f"{len(rows)} due  (R = P(you avoid it unprompted today))\n"]
        for r in rows:
            out.append(
                f"  [{r['severity']}] {r['code']:<32} "
                f"R={r['retrievability']:.2f}  "
                f"overdue {r['overdue_days']}d  "
                f"reps={r['reps']} lapses={r['lapses']}\n"
            )
        return "".join(out)

    _emit(args, payload, render)
    return 0


def cmd_next(args) -> int:
    deck = load_deck()
    bank = _load_bank()
    ex, covered = select_exercise(bank, deck, args.today,
                                  section=args.section, week=args.week,
                                  recent=_recent_sessions())
    if ex is None:
        _emit(args, {"exercise": None},
              lambda _: "no exercise in the bank matches those filters\n")
        return 1

    blind = frozenset(covered)
    pack = context_pack(deck, args.today, section=ex.get("section"), blind=blind)
    payload = {
        "exercise": ex,
        "traps": covered,
        "blind_to_reviewer": sorted(blind),
        "context_pack": [c.code for c in pack],
    }

    def render(d):
        e = d["exercise"]
        out = [f"# {e['id']} — {e['title']}\n",
               f"section: {e.get('section')}   week: {e.get('week')}   "
               f"~{e.get('minutes', 20)} min\n\n",
               f"{e.get('stimulus', '').strip()}\n\n",
               f"## Task\n{e.get('task', '').strip()}\n\n",
               "## Traps set (do not read before you submit V1)\n"]
        out += [f"  - {c}\n" for c in d["traps"]] or ["  - (none due; free practice)\n"]
        out.append("\n## Reviewer primes on\n")
        out += [f"  - {c}\n" for c in d["context_pack"]]
        out.append("\nWithheld from the reviewer: "
                   + (", ".join(d["blind_to_reviewer"]) or "(nothing)") + "\n")
        return "".join(out)

    _emit(args, payload, render)
    return 0


def cmd_log(args) -> int:
    grade = _parse_grade(args.grade)
    path = ERRORS_DIR / f"{args.code.replace('.', '-')}.md"
    if path.exists():
        card = ErrorCard.load(path)
    else:
        et = taxonomy.get(args.code)
        card = ErrorCard(code=et.code, title=et.title, severity=et.severity,
                         sections=list(et.sections), created=args.today,
                         note=_starter_note(et))
    before = card.interval_days
    if args.stakes is not None:
        card.stakes = args.stakes
    card.grade(grade, args.today)
    card.save()
    _append_log({
        "date": args.today.isoformat(), "code": card.code,
        "grade": grade.name.lower(), "session": args.session,
        "interval_before": round(before, 2),
        "interval_after": round(card.interval_days, 2),
    })
    payload = _card_row(card, args.today) | {"grade": grade.name.lower()}
    _emit(args, payload,
          lambda d: f"{d['code']}: {d['grade']} — next probe "
                    f"{d['due']} (interval {d['interval_days']}d, "
                    f"ease {d['ease']})\n")
    return 0


def cmd_context(args) -> int:
    deck = load_deck()
    blind = frozenset(args.blind or [])
    pack = context_pack(deck, args.today, section=args.section, blind=blind,
                        k=args.k)
    payload = [{"code": c.code, "title": c.title, "severity": c.severity,
                "salience": round(c.salience(args.today, args.section), 3),
                "probe": taxonomy.get(c.code).probe if c.code in taxonomy.BY_CODE
                else ""}
               for c in pack]

    def render(rows):
        out = ["# Live error patterns for this writer\n\n"
               "Check these first. Report at most one critical and two "
               "secondary issues.\n\n"]
        for r in rows:
            out.append(f"- **{r['code']}** (severity {r['severity']}) — "
                       f"{r['title']}\n  - probe: {r['probe']}\n")
        return "".join(out)

    _emit(args, payload, render)
    return 0


def cmd_report(args) -> int:
    deck = load_deck()
    rows = [_card_row(c, args.today) for c in deck]
    fams: dict[str, list] = {}
    for c in deck:
        fams.setdefault(taxonomy.family(c.code), []).append(c)
    summary = {
        f: {
            "cards": len(cs),
            "mean_interval": round(sum(c.interval_days for c in cs) / len(cs), 1),
            "lapses": sum(c.lapses for c in cs),
            "due": sum(1 for c in cs if c.is_due(args.today)),
        }
        for f, cs in sorted(fams.items())
    }

    def render(_):
        out = ["# Mastery report\n\n"]
        for f, s in summary.items():
            out.append(f"{f:<10} cards={s['cards']:<3} "
                       f"mean interval={s['mean_interval']:>6}d  "
                       f"lapses={s['lapses']:<3} due={s['due']}\n")
        out.append("\ncard                              R     interval  reps  lapses\n")
        for r in sorted(rows, key=lambda r: -r["interval_days"]):
            out.append(f"{r['code']:<33} {r['retrievability']:.2f}  "
                       f"{r['interval_days']:>7}d  {r['reps']:>4}  "
                       f"{r['lapses']:>6}\n")
        return "".join(out)

    _emit(args, {"families": summary, "cards": rows}, render)
    return 0


def cmd_forecast(args) -> int:
    deck = load_deck()
    buckets: dict[str, list[str]] = {}
    for c in deck:
        d = c.due_on() or args.today
        if d <= args.today + timedelta(days=args.days):
            buckets.setdefault(max(d, args.today).isoformat(), []).append(c.code)

    def render(b):
        if not b:
            return f"nothing due in the next {args.days} days\n"
        return "".join(f"{day}  {len(codes):>2}  {', '.join(sorted(codes))}\n"
                       for day, codes in sorted(b.items()))

    _emit(args, buckets, render)
    return 0


# --- helpers ----------------------------------------------------------------

def _card_row(c: ErrorCard, today: date) -> dict:
    due = c.due_on()
    return {
        "code": c.code, "title": c.title, "severity": c.severity,
        "retrievability": round(c.retrievability(today), 3),
        "interval_days": round(c.interval_days, 1),
        "ease": round(c.ease, 2), "reps": c.reps, "lapses": c.lapses,
        "due": due.isoformat() if due else "now",
        "overdue_days": max(0, (today - due).days) if due else 0,
        "priority": round(c.priority(today), 3),
    }


def _parse_grade(raw: str) -> Grade:
    key = str(raw).strip().lower()
    if key in GRADE_NAMES:
        return GRADE_NAMES[key]
    try:
        return Grade(int(key))
    except (ValueError, KeyError):
        raise SystemExit(
            f"bad grade {raw!r}; use 0..3 or "
            + "/".join(GRADE_NAMES)
        ) from None


def _load_bank() -> list[dict]:
    if not BANK_PATH.exists():
        return []
    out = []
    for i, line in enumerate(BANK_PATH.read_text(encoding="utf-8").splitlines(), 1):
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError as e:
            raise SystemExit(f"{BANK_PATH}:{i}: {e}") from None
    return out


def _recent_sessions(limit: int = 5) -> list[str]:
    """Exercise ids from the grade log, newest first, de-duplicated."""
    if not LOG_PATH.exists():
        return []
    ids: list[str] = []
    for line in reversed(LOG_PATH.read_text(encoding="utf-8").splitlines()):
        if not line.strip():
            continue
        try:
            sid = json.loads(line).get("session")
        except json.JSONDecodeError:
            continue
        if sid and sid not in ids:
            ids.append(sid)
        if len(ids) >= limit:
            break
    return ids


def _profile_focus() -> list[str]:
    """Read `focus:` list items out of profile.yaml without a YAML dep."""
    if not PROFILE_PATH.exists():
        return []
    codes, inside = [], False
    for line in PROFILE_PATH.read_text(encoding="utf-8").splitlines():
        if line.startswith("focus:"):
            inside = True
            continue
        if inside:
            stripped = line.strip()
            if stripped.startswith("- "):
                codes.append(stripped[2:].split("#")[0].strip())
            elif stripped and not line.startswith((" ", "\t")):
                break
    return [c for c in codes if c in taxonomy.BY_CODE]


def _starter_note(et: taxonomy.ErrorType) -> str:
    return (f"**Probe question.** {et.probe}\n\n"
            "## Instances\n\n"
            "<!-- append: date, V1 sentence, diagnosis, V2 sentence -->\n")


def _append_log(entry: dict) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")


def _emit(args, payload, render) -> None:
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2, default=str))
    else:
        sys.stdout.write(render(payload))


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="awgym", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--json", action="store_true")
    p.add_argument("--date", dest="today", type=date.fromisoformat,
                   default=date.today())
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("seed"); s.add_argument("codes", nargs="*"); s.set_defaults(fn=cmd_seed)
    s = sub.add_parser("due"); s.set_defaults(fn=cmd_due)
    s = sub.add_parser("next")
    s.add_argument("--section"); s.add_argument("--week", type=int)
    s.set_defaults(fn=cmd_next)
    s = sub.add_parser("log")
    s.add_argument("--code", required=True); s.add_argument("--grade", required=True)
    s.add_argument("--stakes", type=float); s.add_argument("--session", default="")
    s.set_defaults(fn=cmd_log)
    s = sub.add_parser("context")
    s.add_argument("--section"); s.add_argument("--k", type=int, default=7)
    s.add_argument("--blind", nargs="*"); s.set_defaults(fn=cmd_context)
    s = sub.add_parser("report"); s.set_defaults(fn=cmd_report)
    s = sub.add_parser("forecast")
    s.add_argument("--days", type=int, default=28); s.set_defaults(fn=cmd_forecast)
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    raise SystemExit(main())
