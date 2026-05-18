import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/storage";
import { fmt } from "../lib/split";

export default function Allocate() {
  const { state, update } = useStore();
  const nav = useNavigate();
  const receipt = state.receipt;

  if (!receipt) {
    return (
      <div className="empty">
        <div className="icon">🧾</div>
        <p>No active receipt.</p>
        <button className="btn primary" onClick={() => nav("/capture")}>
          Capture one
        </button>
      </div>
    );
  }

  function togglePerson(itemId: string, personId: string) {
    update((s) => {
      if (!s.receipt) return s;
      return {
        ...s,
        receipt: {
          ...s.receipt,
          items: s.receipt.items.map((it) =>
            it.id !== itemId
              ? it
              : {
                  ...it,
                  consumerIds: it.consumerIds.includes(personId)
                    ? it.consumerIds.filter((id) => id !== personId)
                    : [...it.consumerIds, personId],
                },
          ),
        },
      };
    });
  }

  return (
    <>
      <section>
        <p className="eyebrow">Allocate</p>
        <h1 className="h1">Tap who had each item.</h1>
        <p className="subtle" style={{ marginTop: 10 }}>
          Skip an item → it's shared by the whole squad. That's the difference: a real ledger,
          not a flat average.
        </p>
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {receipt.items.map((it) => (
          <div key={it.id} className="card">
            <div className="row between" style={{ marginBottom: 10 }}>
              <div>
                <div className="name" style={{ fontWeight: 600 }}>{it.name}</div>
                <div className="qty" style={{ color: "var(--muted)", fontSize: 12 }}>
                  × {it.qty} · {fmt(it.unitPriceCents)} each
                </div>
              </div>
              <div className="price" style={{ fontWeight: 700 }}>
                {fmt(it.qty * it.unitPriceCents)}
              </div>
            </div>
            <div className="row wrap" style={{ gap: 6 }}>
              {state.squad.map((p) => {
                const on = it.consumerIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    className={`person-chip${on ? " on" : ""}`}
                    onClick={() => togglePerson(it.id, p.id)}
                    style={{ border: "1px solid var(--line)" }}
                  >
                    <span className="avatar">{p.emoji ?? p.name[0]}</span>
                    {p.name}
                  </button>
                );
              })}
            </div>
            {it.consumerIds.length === 0 && (
              <div className="subtle" style={{ marginTop: 8, fontSize: 12 }}>
                Shared by everyone
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="btn primary block" onClick={() => nav("/settle")}>
        Settle the tab →
      </button>
    </>
  );
}
