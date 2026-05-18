import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, newId } from "../lib/storage";
import { extractReceiptFromImage, type ParsedReceipt } from "../lib/minimax";
import { fmt } from "../lib/split";
import type { Receipt } from "../lib/types";

export default function Capture() {
  const { update } = useStore();
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [stage, setStage] = useState<"" | "ocr" | "structure">("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);

  async function onFile(file: File) {
    setError(null);
    setParsed(null);
    setPreviewUrl(URL.createObjectURL(file));
    setParsing(true);
    setStage("ocr");
    setProgress(0);
    try {
      const result = await extractReceiptFromImage(file, (s, p) => {
        setStage(s);
        setProgress(p);
      });
      setParsed(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not read receipt");
    } finally {
      setParsing(false);
      setStage("");
    }
  }

  function confirmAndContinue() {
    if (!parsed) return;
    const receipt: Receipt = {
      id: newId("r"),
      title: parsed.title ?? "Receipt",
      placeName: parsed.placeName,
      capturedAt: new Date().toISOString(),
      serviceFeeRate: parsed.serviceFeeRate ?? 0,
      prepaidDepositCents: 0,
      items: parsed.items.map((it) => ({
        id: newId("it"),
        name: it.name,
        qty: it.qty,
        unitPriceCents: it.unitPriceCents,
        consumerIds: [],
      })),
    };
    update((s) => ({ ...s, receipt }));
    nav("/squad");
  }

  function useSample() {
    setParsing(true);
    setError(null);
    setPreviewUrl(null);
    extractReceiptFromImage(null).then((result) => {
      setParsed(result);
      setParsing(false);
    });
  }

  return (
    <>
      <section>
        <p className="eyebrow">Capture</p>
        <h1 className="h1">One photo. No typing.</h1>
        <p className="subtle" style={{ marginTop: 10 }}>
          Splitwise needs you to type every line. We just need a shutter click.
        </p>
      </section>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Receipt"
          style={{
            width: "100%",
            borderRadius: 14,
            border: "1px solid var(--line)",
            maxHeight: 280,
            objectFit: "cover",
          }}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      <div className="row" style={{ flexDirection: "column", gap: 10 }}>
        <button
          className="btn primary block"
          onClick={() => inputRef.current?.click()}
          disabled={parsing}
        >
          📸 {parsing ? "Reading receipt…" : previewUrl ? "Retake" : "Take photo / upload"}
        </button>
        {!previewUrl && !parsed && (
          <button className="btn ghost block" onClick={useSample} disabled={parsing}>
            Use sample receipt
          </button>
        )}
      </div>

      {parsing && (
        <div className="status">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>
              {stage === "ocr" ? "👁️  Reading pixels (local)" : "🧠  Structuring with MiniMax-M2.7"}
            </span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div style={{ height: 6, background: "var(--soft)", borderRadius: 999 }}>
            <div
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: "100%",
                background: stage === "ocr" ? "var(--coral)" : "var(--green)",
                borderRadius: 999,
                transition: "width 0.2s",
              }}
            />
          </div>
        </div>
      )}

      {error && <div className="status error">⚠️ {error}</div>}

      {parsed && (
        <section>
          <p className="eyebrow">
            Parsed in {parsed.elapsedMs}ms · {parsed.source === "minimax" ? "Tesseract + MiniMax" : parsed.source === "ocr-only" ? "Tesseract only" : "Sample"}
          </p>
          <h2 className="h2">{parsed.title ?? "Receipt"}</h2>
          {parsed.placeName && <p className="subtle">{parsed.placeName}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {parsed.items.map((it, i) => (
              <div key={i} className="item-row">
                <div>
                  <div className="name">{it.name}</div>
                  <div className="qty">× {it.qty}</div>
                </div>
                <div className="price">{fmt(it.qty * it.unitPriceCents)}</div>
              </div>
            ))}
          </div>
          {parsed.serviceFeeRate ? (
            <div className="stat-row">
              <span className="label">Service fee</span>
              <span className="value">{(parsed.serviceFeeRate * 100).toFixed(0)}%</span>
            </div>
          ) : null}
          <button className="btn primary block" style={{ marginTop: 16 }} onClick={confirmAndContinue}>
            Looks right → Pick the squad
          </button>
        </section>
      )}
    </>
  );
}
