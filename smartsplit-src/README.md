# SmartSplit

> Snap the receipt. Keep the memory.

Mobile-first React SPA. One photo → AI-parsed items → per-item × per-person split → settled tab pinned to a place.

## Run

```bash
npm install
cp .env.example .env.local   # paste your MiniMax key (optional)
npm run dev
```

Dev server: http://localhost:5173 — open it on your phone (same wifi) for the real demo flow.

Capture uses a **two-stage pipeline**:

1. **Tesseract.js** runs locally in the browser → raw OCR text from the receipt photo.
2. **MiniMax-M2.7** (text-only chat) structures that raw text into JSON items.

Without a MiniMax key, stage 2 falls back to a regex-based local parser; if you also don't take a photo, the app uses a built-in sample receipt. Either way the rest of the flow works.

> Why this pipeline? MiniMax's chat models are text-only, so vision stays in the browser and the LLM does the semantic heavy lifting. This also doubles as the "parallel agents" talking point in the deck — pixels and language are handled by specialist agents in parallel.

## Pitch flow (also the user flow)

| # | Route        | What the audience sees                              |
|---|--------------|-----------------------------------------------------|
| 1 | `/`          | Problem framing + memory timeline                   |
| 2 | `/capture`   | Real photo → MiniMax → itemised list in seconds     |
| 3 | `/squad`     | Pick who participated                               |
| 4 | `/allocate`  | Tap who had each item (the differentiator)          |
| 5 | `/settle`    | Final amounts, pinned to a place, saved to memory   |

The `PitchStrip` at the top makes the step you're on obvious during a live pitch.

## Architecture

```
src/
  main.tsx           — entry, wraps app in <StoreProvider>
  App.tsx            — routes
  components/        — TopBar, PitchStrip
  routes/            — Home, Capture, Squad, Allocate, Settle
  lib/
    types.ts         — domain types
    split.ts         — pure integer-cent split math
    storage.tsx      — React Context + localStorage persistence
    minimax.ts       — vision API client w/ sample fallback
  styles/theme.css   — single CSS file, cream/coral/teal palette
```

State lives in one React Context (`useStore`), persisted to `localStorage`
on every change. No backend.

## Why this is different from Splitwise

- **Splitwise:** type every line item by hand. We: one shutter click.
- **Splitwise:** flat balances. We: per-item × per-person ledger, integer cents.
- **Splitwise:** money math only. We: every receipt is a place + time on a shared memory timeline.

## Build

```bash
npm run build    # tsc -b && vite build
```

## Roadshow deck

`SmartSplit_Roadshow.pptx` lives at the repo root — 10 slides covering problem,
insight, FFB, numbers, tech, go/no-go, and the ask.
