/**
 * Two-stage receipt pipeline:
 *   1. Tesseract.js OCR runs in the browser on the receipt photo → raw text.
 *   2. MiniMax-M2.7 (text-only) turns raw OCR text → structured JSON items.
 *
 * MiniMax chat endpoint is text-only, so we keep vision local.
 * Pass `null` for `file` to skip both stages and return a canned sample.
 */
import Tesseract from "tesseract.js";

export interface ParsedItem {
  name: string;
  qty: number;
  unitPriceCents: number;
}

export interface ParsedReceipt {
  title?: string;
  placeName?: string;
  serviceFeeRate?: number;
  items: ParsedItem[];
  elapsedMs: number;
  source: "minimax" | "sample" | "ocr-only";
  /** OCR raw text — useful for the demo "show the AI's working" reveal. */
  rawText?: string;
}

const SAMPLE: Omit<ParsedReceipt, "elapsedMs" | "source"> = {
  title: "Unequal Dinner — Shibuya",
  placeName: "Shibuya, Tokyo",
  serviceFeeRate: 0.1,
  items: [
    { name: "Shared table charge", qty: 4, unitPriceCents: 1000 },
    { name: "Wagyu set", qty: 2, unitPriceCents: 6000 },
    { name: "Sashimi platter", qty: 1, unitPriceCents: 5000 },
    { name: "House wine", qty: 2, unitPriceCents: 3500 },
    { name: "Mocktails", qty: 2, unitPriceCents: 2000 },
    { name: "Dessert", qty: 4, unitPriceCents: 800 },
  ],
};

const SYSTEM_PROMPT = `You are a receipt-parsing assistant.
Input: raw OCR text from a restaurant or shop receipt (likely noisy).
Output: STRICT JSON ONLY, no prose, matching this exact shape:
{
  "title": string,
  "placeName": string | null,
  "serviceFeeRate": number,
  "items": [{ "name": string, "qty": integer, "unitPriceCents": integer }]
}
Rules:
- unitPriceCents = per-unit price in integer cents (e.g. $12.50 → 1250).
- serviceFeeRate is a decimal (0.10 for 10%, 0 if none).
- Drop any line that is clearly a subtotal / tax / total / payment.
- If a value isn't legible, omit the item rather than guess.
- Never include any text outside the JSON object.`;

async function runOcr(file: File, onProgress?: (p: number) => void): Promise<string> {
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) onProgress(m.progress);
    },
  });
  return data.text.trim();
}

async function structureWithMiniMax(rawText: string): Promise<Omit<ParsedReceipt, "elapsedMs" | "source" | "rawText">> {
  const key = import.meta.env.VITE_MINIMAX_KEY as string | undefined;
  if (!key) throw new Error("VITE_MINIMAX_KEY not set");

  const res = await fetch("https://api.minimax.io/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "MiniMax-M2.7",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `OCR text:\n\n${rawText}` },
      ],
      temperature: 0.1,
      top_p: 0.95,
      max_completion_tokens: 1024,
    }),
  });

  if (!res.ok) throw new Error(`MiniMax ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from MiniMax");

  // Be tolerant: model may wrap JSON in code fences.
  const jsonStr = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const obj = JSON.parse(jsonStr);

  return {
    title: obj.title ?? undefined,
    placeName: obj.placeName ?? undefined,
    serviceFeeRate: typeof obj.serviceFeeRate === "number" ? obj.serviceFeeRate : 0,
    items: Array.isArray(obj.items)
      ? obj.items
          .filter(
            (it: { name?: string; unitPriceCents?: number }) =>
              it && typeof it.name === "string" && typeof it.unitPriceCents === "number",
          )
          .map((it: { name: string; qty?: number; unitPriceCents: number }) => ({
            name: it.name,
            qty: Math.max(1, Math.floor(it.qty ?? 1)),
            unitPriceCents: Math.round(it.unitPriceCents),
          }))
      : [],
  };
}

/**
 * Heuristic fallback when MiniMax key is absent — parses OCR text alone.
 * Pulls lines that look like "<name> ... <price>".
 */
function structureLocally(rawText: string): Omit<ParsedReceipt, "elapsedMs" | "source" | "rawText"> {
  const items: ParsedItem[] = [];
  const lines = rawText.split(/\r?\n/);
  const priceRe = /\$?\s*(\d{1,4}(?:[.,]\d{2}))\s*$/;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^(sub\s*total|total|tax|gst|vat|cash|change|paid)/i.test(trimmed)) continue;
    const m = trimmed.match(priceRe);
    if (!m) continue;
    const cents = Math.round(parseFloat(m[1].replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents <= 0) continue;
    const name = trimmed.slice(0, trimmed.length - m[0].length).replace(/[.\s]+$/, "").trim();
    if (!name) continue;
    items.push({ name, qty: 1, unitPriceCents: cents });
  }
  return {
    title: "Receipt",
    placeName: undefined,
    serviceFeeRate: 0,
    items,
  };
}

export async function extractReceiptFromImage(
  file: File | null,
  onProgress?: (stage: "ocr" | "structure", progress: number) => void,
): Promise<ParsedReceipt> {
  const started = performance.now();

  if (!file) {
    await new Promise((r) => setTimeout(r, 600));
    return { ...SAMPLE, elapsedMs: Math.round(performance.now() - started), source: "sample" };
  }

  const rawText = await runOcr(file, (p) => onProgress?.("ocr", p));
  if (!rawText) throw new Error("OCR found no text. Try a clearer photo.");

  const hasKey = !!import.meta.env.VITE_MINIMAX_KEY;
  onProgress?.("structure", 0);

  if (!hasKey) {
    const local = structureLocally(rawText);
    if (local.items.length === 0) {
      throw new Error("Couldn't find priced items. Add VITE_MINIMAX_KEY for better parsing.");
    }
    onProgress?.("structure", 1);
    return {
      ...local,
      elapsedMs: Math.round(performance.now() - started),
      source: "ocr-only",
      rawText,
    };
  }

  const structured = await structureWithMiniMax(rawText);
  onProgress?.("structure", 1);
  if (structured.items.length === 0) throw new Error("No items detected — try a clearer photo");
  return {
    ...structured,
    elapsedMs: Math.round(performance.now() - started),
    source: "minimax",
    rawText,
  };
}
