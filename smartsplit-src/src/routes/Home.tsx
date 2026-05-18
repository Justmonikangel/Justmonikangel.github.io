import { Link } from "react-router-dom";
import { useStore } from "../lib/storage";
import { fmt } from "../lib/split";

export default function Home() {
  const { state, reset } = useStore();
  const empty = state.history.length === 0;

  return (
    <>
      <section>
        <p className="eyebrow">The problem</p>
        <h1 className="h1">Still digging through chat history to figure out who paid?</h1>
        <p className="subtle" style={{ marginTop: 10 }}>
          SmartSplit snaps the receipt, reads it, and pins the memory to the place — so a trip,
          a household, or a single dinner settles in seconds and lives on as a shared timeline.
        </p>
      </section>

      <Link to="/capture" className="btn primary block">
        📸 Snap a receipt to start
      </Link>

      <section>
        <p className="eyebrow">Your memory</p>
        <h2 className="h2">Past splits</h2>
        {empty ? (
          <div className="empty">
            <div className="icon">🗒️</div>
            <div>No splits yet. The first photo creates your first memory.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {state.history.map((h) => (
              <div key={h.id} className="card">
                <div className="row between">
                  <strong>{h.title}</strong>
                  <span className="price">{fmt(h.totalCents)}</span>
                </div>
                <div className="subtle" style={{ marginTop: 4 }}>
                  {h.placeName ?? "—"} · {new Date(h.settledAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            <button className="btn ghost" onClick={() => { if (confirm("Reset all data?")) reset(); }}>
              Reset demo data
            </button>
          </div>
        )}
      </section>
    </>
  );
}
