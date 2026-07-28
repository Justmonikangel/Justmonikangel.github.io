"""Dual-memory core for Academic Writing Gym.

Two memories, two opposite decision rules:

  Layer A - scheduling memory.  Tracks how likely the writer is to still
  avoid an error unprompted.  When retrievability decays, the error must be
  *re-tested sooner*.  Decay promotes.

  Layer B - context memory.  Tracks how relevant an error pattern is to the
  reviewer's current prompt.  When salience decays, the pattern is *dropped
  from the prompt* to keep the context budget spent on live patterns.
  Decay demotes.  This layer follows the Ombre-Brain score shape.

Both read and write the same on-disk card (Markdown + YAML-ish frontmatter,
one file per error pattern, under learner/errors/).  No third-party deps.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field, asdict
from datetime import date, timedelta
from enum import IntEnum
from pathlib import Path

GYM_ROOT = Path(__file__).resolve().parent.parent
ERRORS_DIR = GYM_ROOT / "learner" / "errors"

# --- Layer A constants -------------------------------------------------------

TARGET_RETENTION = 0.85   # recall probability at the moment an item comes due
EASE_MIN, EASE_MAX = 1.3, 3.0
EASE_START = 2.1
INTERVAL_MIN = 1.0

# A severity-3 error never leaves the rotation: even at full mastery it is
# re-probed at least this often (days).  Scientific-integrity errors are not
# allowed to be "graduated" the way a vocabulary card is.
INTERVAL_CEILING = {1: 180.0, 2: 90.0, 3: 45.0}

# First interval after a fresh card is graded, by grade.
FIRST_INTERVAL = {1: 1.0, 2: 2.0, 3: 3.0}

# --- Layer B constants (Ombre-Brain shape) -----------------------------------

SALIENCE_LAMBDA = 0.05    # Ombre-Brain default decay rate, per day
ACTIVATION_EXP = 0.30     # Ombre-Brain activation_count^0.3
STAKES_BASE, STAKES_BOOST = 0.7, 0.6   # stands in for Ombre-Brain's arousal term
OFF_SECTION_PENALTY = 0.4
RETIRED_PENALTY = 0.1
CONTEXT_PACK_SIZE = 7


class Grade(IntEnum):
    """How much prompting the writer needed before the error was repaired.

    The grade is the hint-ladder level that finally worked, inverted.  See
    references/hint-ladder.md.  Grading on *prompt dependence* rather than on
    error presence is what makes this a skill scheduler and not a bug counter.
    """

    LAPSE = 0       # needed L3 (missing step shown), or never repaired
    COACHED = 1     # repaired after the error was named (L2)
    SELF_FIXED = 2  # repaired after the location was pointed at (L1)
    CLEAN = 3       # the trap was set and the writer walked past it unprompted


GRADE_NAMES = {g.name.lower(): g for g in Grade}


@dataclass
class ErrorCard:
    code: str
    title: str
    severity: int = 2                 # 1-3, from references/error-taxonomy.md
    sections: list[str] = field(default_factory=list)   # where it bites
    stakes: float = 0.0               # 0-1: did this cost something real?
    interval_days: float = 0.0        # Layer A state
    ease: float = EASE_START
    reps: int = 0
    lapses: int = 0
    last_review: date | None = None   # last graded probe
    last_seen: date | None = None     # last time it appeared in any session
    activations: int = 0              # Layer B: how often it has surfaced
    retired: bool = False
    created: date | None = None
    note: str = ""                    # free Markdown body: examples, V1/V2

    # -- Layer A: scheduling ------------------------------------------------

    def retrievability(self, today: date) -> float:
        """P(writer avoids this unprompted today), 0-1.

        Defined so that R == TARGET_RETENTION exactly on the due date:
            R(dt) = theta ** (dt / interval)
        This is Ombre-Brain's exponential decay with a *per-item* rate.  The
        single most important change from a fixed lambda is that the rate has
        to shrink as the writer masters the item -- a global lambda=0.05 says
        every pattern has the same 14-day half-life forever, which makes
        mastery unrepresentable.
        """
        if self.last_review is None or self.interval_days <= 0:
            return 0.0
        dt = max(0, (today - self.last_review).days)
        return TARGET_RETENTION ** (dt / self.interval_days)

    def due_on(self) -> date | None:
        if self.last_review is None or self.interval_days <= 0:
            return None
        return self.last_review + timedelta(days=round(self.interval_days))

    def is_due(self, today: date) -> bool:
        if self.retired:
            return False
        due = self.due_on()
        return True if due is None else today >= due

    def priority(self, today: date) -> float:
        """Higher = more urgent to probe.  Overdue and severe wins."""
        if self.retired:
            return 0.0
        return (1.0 - self.retrievability(today)) * self.severity

    def grade(self, g: Grade, today: date) -> None:
        """Apply an outcome and reschedule."""
        if g == Grade.LAPSE:
            self.lapses += 1
            self.ease = _clamp(self.ease - 0.25, EASE_MIN, EASE_MAX)
            # Partial reset, not a full one: a relapse after six clean probes
            # is not the same as never having learned it.
            self.interval_days = max(INTERVAL_MIN, self.interval_days * 0.4)
        else:
            self.ease = _clamp(
                self.ease + {Grade.COACHED: -0.10,
                             Grade.SELF_FIXED: 0.0,
                             Grade.CLEAN: 0.12}[g],
                EASE_MIN, EASE_MAX,
            )
            if self.reps == 0 or self.interval_days <= 0:
                self.interval_days = FIRST_INTERVAL[int(g)]
            else:
                mult = {Grade.COACHED: 1.2,
                        Grade.SELF_FIXED: self.ease,
                        Grade.CLEAN: self.ease * 1.25}[g]
                self.interval_days *= mult

        self.interval_days = min(self.interval_days,
                                 INTERVAL_CEILING.get(self.severity, 90.0))
        self.reps += 1
        self.last_review = today
        self.touch(today)

    # -- Layer B: context salience -----------------------------------------

    def salience(self, today: date, section: str | None = None) -> float:
        """Ombre-Brain-style relevance score, used only to fill the prompt.

        base = severity * (1+activations)^0.3 * e^(-lambda*days) * stakes_term
        """
        anchor = self.last_seen or self.created or today
        days = max(0, (today - anchor).days)
        score = (
            self.severity
            * (1 + self.activations) ** ACTIVATION_EXP
            * math.exp(-SALIENCE_LAMBDA * days)
            * (STAKES_BASE + STAKES_BOOST * _clamp(self.stakes, 0.0, 1.0))
        )
        if section and self.sections and section not in self.sections:
            score *= OFF_SECTION_PENALTY
        if self.retired:
            score *= RETIRED_PENALTY
        return score

    def touch(self, today: date) -> None:
        self.last_seen = today
        self.activations += 1

    # -- Persistence --------------------------------------------------------

    @property
    def path(self) -> Path:
        return ERRORS_DIR / f"{self.code.replace('.', '-')}.md"

    def to_markdown(self) -> str:
        fm = {
            "code": self.code,
            "title": self.title,
            "severity": self.severity,
            "sections": self.sections,
            "stakes": round(self.stakes, 2),
            "interval_days": round(self.interval_days, 2),
            "ease": round(self.ease, 2),
            "reps": self.reps,
            "lapses": self.lapses,
            "last_review": self.last_review,
            "last_seen": self.last_seen,
            "activations": self.activations,
            "retired": self.retired,
            "created": self.created,
        }
        return f"---\n{_dump_frontmatter(fm)}---\n\n{self.note.strip()}\n"

    def save(self) -> Path:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(self.to_markdown(), encoding="utf-8")
        return self.path

    @classmethod
    def from_markdown(cls, text: str) -> "ErrorCard":
        fm, body = _split_frontmatter(text)
        return cls(
            code=str(fm.get("code", "")),
            title=str(fm.get("title", "")),
            severity=int(fm.get("severity", 2)),
            sections=list(fm.get("sections", []) or []),
            stakes=float(fm.get("stakes", 0.0)),
            interval_days=float(fm.get("interval_days", 0.0)),
            ease=float(fm.get("ease", EASE_START)),
            reps=int(fm.get("reps", 0)),
            lapses=int(fm.get("lapses", 0)),
            last_review=_as_date(fm.get("last_review")),
            last_seen=_as_date(fm.get("last_seen")),
            activations=int(fm.get("activations", 0)),
            retired=bool(fm.get("retired", False)),
            created=_as_date(fm.get("created")),
            note=body,
        )

    @classmethod
    def load(cls, path: Path) -> "ErrorCard":
        return cls.from_markdown(path.read_text(encoding="utf-8"))


# --- Deck-level operations ---------------------------------------------------

def load_deck(errors_dir: Path | None = None) -> list[ErrorCard]:
    d = errors_dir or ERRORS_DIR
    if not d.exists():
        return []
    return sorted((ErrorCard.load(p) for p in d.glob("*.md")),
                  key=lambda c: c.code)


def due_cards(deck: list[ErrorCard], today: date) -> list[ErrorCard]:
    return sorted((c for c in deck if c.is_due(today)),
                  key=lambda c: c.priority(today), reverse=True)


def context_pack(deck: list[ErrorCard], today: date, section: str | None = None,
                 k: int = CONTEXT_PACK_SIZE,
                 blind: frozenset[str] = frozenset()) -> list[ErrorCard]:
    """The error patterns worth spending reviewer-prompt tokens on.

    `blind` drops codes the reviewer must NOT be primed on.  During a
    scheduled probe the due code is withheld: a reviewer told to look for an
    overclaim will find one whether or not it is there, and the grade would
    then measure the reviewer's suggestibility rather than the writer's skill.
    """
    candidates = [c for c in deck if c.code not in blind]
    return sorted(candidates, key=lambda c: c.salience(today, section),
                  reverse=True)[:k]


RECENCY_PENALTY = 2.5   # per-exercise, decaying over the last few sessions


def select_exercise(bank: list[dict], deck: list[ErrorCard], today: date,
                    section: str | None = None,
                    week: int | None = None,
                    recent: list[str] | None = None
                    ) -> tuple[dict | None, list[str]]:
    """Greedy pick: the exercise whose traps cover the most urgent due errors.

    `recent` is exercise ids from newest to oldest.  Without it the same
    exercise comes back every day until its top code clears, which stops
    being a probe after the second run -- the writer remembers the trap.

    Returns (exercise, covered_codes).  `covered_codes` is what the grader
    will ask about afterwards, and what `context_pack` should be blind to.
    """
    due = {c.code: c.priority(today) for c in due_cards(deck, today)}
    recent = recent or []
    best, best_score, best_hits = None, -1e9, []
    for ex in bank:
        if section and ex.get("section") not in (section, "any"):
            continue
        if week is not None and ex.get("week") and ex["week"] > week:
            continue
        hits = [c for c in ex.get("affords", []) if c in due]
        score = sum(due[c] for c in hits)
        # Mild pull towards the current curriculum week.
        if week is not None and ex.get("week"):
            score -= 0.05 * abs(week - ex["week"])
        if ex.get("id") in recent:
            score -= RECENCY_PENALTY / (1 + recent.index(ex["id"]))
        if score > best_score:
            best, best_score, best_hits = ex, score, hits
    return best, best_hits


# --- Minimal frontmatter I/O (no PyYAML dependency) --------------------------

_FM_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?(.*)\Z", re.S)


def _split_frontmatter(text: str) -> tuple[dict, str]:
    m = _FM_RE.match(text)
    if not m:
        return {}, text
    fm: dict = {}
    for line in m.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, _, raw = line.partition(":")
        fm[key.strip()] = _parse_scalar(raw.strip())
    return fm, m.group(2)


def _parse_scalar(raw: str):
    if raw in ("", "null", "~"):
        return None
    if raw.startswith("[") and raw.endswith("]"):
        inner = raw[1:-1].strip()
        return [s.strip().strip("\"'") for s in inner.split(",") if s.strip()]
    low = raw.lower()
    if low in ("true", "false"):
        return low == "true"
    try:
        return int(raw)
    except ValueError:
        pass
    try:
        return float(raw)
    except ValueError:
        pass
    return raw.strip("\"'")


def _dump_frontmatter(d: dict) -> str:
    out = []
    for k, v in d.items():
        if v is None:
            out.append(f"{k}:")
        elif isinstance(v, bool):
            out.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, list):
            out.append(f"{k}: [{', '.join(str(x) for x in v)}]")
        elif isinstance(v, date):
            out.append(f"{k}: {v.isoformat()}")
        else:
            out.append(f"{k}: {v}")
    return "\n".join(out) + "\n"


def _as_date(v) -> date | None:
    if v in (None, "", "null"):
        return None
    if isinstance(v, date):
        return v
    return date.fromisoformat(str(v).strip())


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))
