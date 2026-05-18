import { NavLink } from "react-router-dom";

const STEPS = [
  { n: 1, to: "/", label: "Problem" },
  { n: 2, to: "/capture", label: "Capture" },
  { n: 3, to: "/squad", label: "Squad" },
  { n: 4, to: "/allocate", label: "Allocate" },
  { n: 5, to: "/settle", label: "Settle" },
];

export function PitchStrip() {
  return (
    <nav className="pitch-strip" aria-label="Pitch flow">
      {STEPS.map((s) => (
        <NavLink
          key={s.n}
          to={s.to}
          end={s.to === "/"}
          className={({ isActive }) => `step${isActive ? " active" : ""}`}
        >
          <span className="num">{s.n}</span>
          <span>{s.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
