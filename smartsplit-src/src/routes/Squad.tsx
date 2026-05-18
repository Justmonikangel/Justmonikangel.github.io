import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, newId } from "../lib/storage";

export default function Squad() {
  const { state, update } = useStore();
  const nav = useNavigate();
  const [newName, setNewName] = useState("");

  function addPerson() {
    const name = newName.trim();
    if (!name) return;
    update((s) => ({
      ...s,
      squad: [...s.squad, { id: newId("p"), name, emoji: "👤" }],
    }));
    setNewName("");
  }

  function removePerson(id: string) {
    update((s) => ({ ...s, squad: s.squad.filter((p) => p.id !== id) }));
  }

  if (!state.receipt) {
    return (
      <div className="empty">
        <div className="icon">🧾</div>
        <p>Capture a receipt first.</p>
        <button className="btn primary" onClick={() => nav("/capture")}>
          Back to capture
        </button>
      </div>
    );
  }

  return (
    <>
      <section>
        <p className="eyebrow">Squad</p>
        <h1 className="h1">Who shared this?</h1>
        <p className="subtle" style={{ marginTop: 10 }}>
          The split is per-item × per-person — not a flat average. Group the right people first.
        </p>
      </section>

      <section>
        <div className="row wrap" style={{ gap: 8 }}>
          {state.squad.map((p) => (
            <span key={p.id} className="person-chip on">
              <span className="avatar">{p.emoji ?? p.name[0]}</span>
              {p.name}
              <button
                aria-label={`Remove ${p.name}`}
                onClick={() => removePerson(p.id)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#fff",
                  marginLeft: 4,
                  padding: 0,
                  fontSize: 14,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      <section>
        <div className="row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a person…"
            onKeyDown={(e) => e.key === "Enter" && addPerson()}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "var(--paper)",
            }}
          />
          <button className="btn" onClick={addPerson}>
            + Add
          </button>
        </div>
      </section>

      <button
        className="btn primary block"
        disabled={state.squad.length < 2}
        onClick={() => nav("/allocate")}
      >
        Next → Tag who ate what
      </button>
    </>
  );
}
