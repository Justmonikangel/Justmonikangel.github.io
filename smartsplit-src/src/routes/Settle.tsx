import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, newId } from "../lib/storage";
import { computeSplit, fmt } from "../lib/split";

export default function Settle() {
  const { state, update } = useStore();
  const nav = useNavigate();
  const [placeName, setPlaceName] = useState(state.receipt?.placeName ?? "");
  const [depositCents, setDepositCents] = useState(state.receipt?.prepaidDepositCents ?? 0);
  const [depositPersonId, setDepositPersonId] = useState<string | "">(
    state.receipt?.prepaidByPersonId ?? "",
  );

  const result = useMemo(() => {
    if (!state.receipt) return null;
    const draft = {
      ...state.receipt,
      placeName,
      prepaidDepositCents: depositCents,
      prepaidByPersonId: depositPersonId || undefined,
    };
    return computeSplit(draft, state.squad);
  }, [state.receipt, state.squad, placeName, depositCents, depositPersonId]);

  if (!state.receipt || !result) {
    return (
      <div className="empty">
        <div className="icon">🧾</div>
        <p>Nothing to settle yet.</p>
        <button className="btn primary" onClick={() => nav("/capture")}>
          Start a split
        </button>
      </div>
    );
  }

  function settle() {
    if (!state.receipt || !result) return;
    update((s) => ({
      ...s,
      receipt: null,
      history: [
        {
          id: newId("h"),
          title: state.receipt!.title,
          placeName: placeName || undefined,
          settledAt: new Date().toISOString(),
          totalCents: result.totalCents,
          perPerson: result.perPerson,
        },
        ...s.history,
      ],
    }));
    nav("/");
  }

  return (
    <>
      <section>
        <p className="eyebrow">Settle</p>
        <h1 className="h1">Every cent accounted for.</h1>
        <p className="subtle" style={{ marginTop: 10 }}>
          Pin this receipt to a place — it'll show up on your shared timeline.
        </p>
      </section>

      <section className="card">
        <label style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>Place</label>
        <input
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="e.g. Shibuya, Tokyo"
          style={{
            width: "100%",
            padding: "10px 0",
            border: 0,
            borderBottom: "1px solid var(--line)",
            background: "transparent",
            fontSize: 16,
          }}
        />
      </section>

      <section className="card">
        <div className="stat-row">
          <span className="label">Items subtotal</span>
          <span className="value">{fmt(result.itemsSubtotalCents)}</span>
        </div>
        <div className="stat-row">
          <span className="label">Service fee</span>
          <span className="value">{fmt(result.serviceFeeCents)}</span>
        </div>
        <div className="stat-row total">
          <span className="label">Total</span>
          <span className="value">{fmt(result.totalCents)}</span>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Prepaid deposit (optional)</p>
        <div className="row" style={{ gap: 8, marginTop: 6 }}>
          <select
            value={depositPersonId}
            onChange={(e) => setDepositPersonId(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--paper)",
            }}
          >
            <option value="">No prepayer</option>
            {state.squad.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={depositCents / 100}
            onChange={(e) =>
              setDepositCents(Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100)))
            }
            placeholder="0.00"
            style={{
              width: 100,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--paper)",
              textAlign: "right",
            }}
          />
        </div>
      </section>

      <section>
        <p className="eyebrow">Each person owes</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {result.perPerson.map((row) => (
            <div key={row.personId} className="item-row">
              <div>
                <div className="name">{row.name}</div>
                {row.creditCents > 0 && (
                  <div className="qty">credit {fmt(row.creditCents)}</div>
                )}
              </div>
              <div className="price">{fmt(row.owedCents)}</div>
            </div>
          ))}
        </div>
      </section>

      <button className="btn primary block" onClick={settle}>
        Settle & save to memory
      </button>
    </>
  );
}
