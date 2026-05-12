# Smart Split — Product Strategy & Prompt Blueprint

> **Branch:** `claude/smart-split-app-Tqf14`
> **Sources:** pitch deck `20260511_smartsplit_V2_EN.pptx`, market memo `Smart_Split_市场调研与竞品分析报告初稿.pdf`, friend's frontend scaffold (`README.md` — React + TypeScript + Vite).
> **Intended use:** extract any sub-section as a system prompt for AI agents, PRDs, design briefs, or RFCs. Sections marked **[from deck]** / **[from memo]** are sourced; **[proposal]** sections are extensions that need user sign-off before becoming canon.

---

## 0. North Star · [from deck §08]

**When anything is shared, anything can be split.**
If it's shared, Smart Split it.

- AI-native — photo in, scene out.
- Universal fit — learn once, use anywhere.
- Trust by explanation — hand over harder bills.
- Compete on scene understanding, not on balance math.

---

## 1. The Thesis · [from deck §02 + memo §1]

Smart Split is an **AI-native shared-expense workspace** for friends, roommates, couples, and travel squads. We don't race Splitwise on ledger math — we build the wider road around it.

Three rhythms of use, one engine:

- **One-off** — a trip, a group buy, a crowdfund; settle and archive as group memory.
- **Recurring** — rent, utilities, subscriptions; rule reuses each cycle.
- **Relational** — couples, roommates, family, teams; long-term ledgers with fair drift.

**Market sizing (directional only, per memo §1):**

- Bill-splitting apps: ~$610M (2026) → ~$1.14B (2035). A second source cites ~$612M (2025) → ~$1.0B (2032).
- Digital wallets: 56% of global e-com value; 33% of POS value (Worldpay 2026 report cited in memo).
- Tourism: $11.6T GDP contribution; ~1.52B international arrivals in 2025 (WTTC / UN Tourism, cited in memo).

**Implication:** don't build a payment network. Ride Stripe / PayPal / Venmo / Revolut / Monzo rails and win on AI + scene intelligence.

---

## 2. The Scene Universe · [from deck §03]

Nine scenes, one engine:

1. **Travel groups** — by night, by leg, multi-currency.
2. **Rent & utilities** — monthly reuse, room weight.
3. **Couples & family** — long ledger, fair drift.
4. **Subscriptions** — auto-cycle (Netflix / GPT / Cloud).
5. **Crowdfunds & gifts** — by head, anonymous optional.
6. **Company reimbursement** — rule-based approval, export.
7. **Shared spaces** — common pool, auto-collect.
8. **Group buys** — claim items, even tax/tip.
9. **Agent-ready open scene** — custom rules via SDK.

**User-extended insight (your message) · [proposal]:** *anything that can be split, can be split here* — seats, chores, time slots, vacation days, quarterly company dividends. The engine is scene-agnostic; UI is scene-aware.

---

## 3. The Different Lane vs. Splitwise · [from deck §04 + memo §3–4]

| Dimension       | Splitwise            | Smart Split                              |
| --------------- | -------------------- | ---------------------------------------- |
| Positioning     | Balance calculator   | AI shared-expense workspace              |
| Data entry      | Manual amount entry  | Photo · screenshot · email → AI          |
| Scene scope     | Single ledger scene  | Travel / rent / subs / buys / reimb.…    |
| Split rules     | Equal · percentage   | By night / item / use / custom           |
| Multi-currency  | Manual conversion    | Auto FX with history                     |
| Group memory    | Transaction stream   | Reusable templates · long ledger · postcards |
| Settlement loop | Mark as paid         | PayPal / Venmo / Stripe handoff          |
| Explainability  | Numbers only         | Every cent justified, editable           |

**What we do *not* fight (memo §3):**

- We don't out-Venmo Venmo on payment rails.
- We don't out-Cino Cino on shared-card UX.
- We orchestrate above all of them as a **payment-agnostic coordination layer**.

---

## 4. Three Unfair Edges · [from deck §05]

1. **AI-native** — drop a receipt or chat screenshot; AI reads items, people, intent; proposes the split. Entry time ↓ 80%.
2. **Universal fit** — from a coffee to a world tour. One engine across 9+ scenes.
3. **Trust by explanation** — every split carries a "why." Evidence opens up; rules edit in place. 100% human-auditable.

---

## 5. The Six-Step Spine · [from deck §06]

Every scene runs the same pipeline:

1. **Capture** — receipt / screenshot / email / manual.
2. **AI parse** — scene, items, people.
3. **Propose** — by night / item / head / use.
4. **Explain** — why this split; evidence opens up.
5. **Approve** — edit, comment, lock.
6. **Settle** — payment handoff; archive as memory.

This is the contract every scene plug-in must implement.

---

## 6. Two Group Onboarding Modes · [your spec — proposal]

### 6.1 Face-to-Face Squad ("co-located mode")

- All members in the same room type the **same room code** (6-digit) into their device → joined.
- Any member can upload a receipt photo. The photo becomes a live "shopping cart" of items.
- Members **claim** items like checking out items in an e-commerce cart. Claimed items disappear (are "cleared") from the open pool.
- Every claim is **broadcast in realtime** so the squad watches each other's cart fill.
- Outcome: an itemized, fully-attributed split with near-zero typing.

**FE/BE handshake notes:**

- Realtime topic: `room:<code>` broadcasting `item.claimed`, `item.released`, `receipt.uploaded`, `squad.joined`.
- Conflict resolution: an item is **server-reserved** the moment someone claims (optimistic UI + reservation TTL), released on disconnect.
- Privacy: room code TTL — auto-expires when the bill closes.

### 6.2 Remote Squad ("anywhere mode")

- Members in different locations join via an invite link or QR code.
- Same item-claim mechanics, plus an explicit "I'm in" / "I'm out" toggle per expense (since you can't read the room visually).
- Asynchronous claims — the ledger reconciles when the bill is closed.
- Cross-region: **FX rate stamped at claim time** so a Tokyo dinner claimed by a London friend locks at that day's rate.

---

## 7. The Postcard Layer · [your spec — proposal]

Bills are forgettable. **Memories aren't.** The expressive layer turns every closed bill, every visited place, and every settled debt into a collectible **postcard** — Pikmin-Bloom-style positive feedback that pulls the squad back into the app between transactions.

Core triggers:

- **Place-anchored** — GPS-anchored: walking past a coordinate the squad once spent at → mint a place-card.
- **Settle-anchored** — the moment a bill closes → mint a settle-card with that scene's summary.
- **Memory-anchored** — trip end → auto-compile a "Trip Snowglobe" deck of all the squad's place-cards.
- **Time-anchored** — anniversaries (e.g. one year since the Bali trip) → unlock a time-capsule card.

Full data model, React component contract, and Google Maps integration spec live in **`POSTCARD_MODULE.md`** — designed to drop into the friend's React + TS + Vite frontend without coupling to backend internals.

---

## 8. AI / Agent Prompt Library

Copy these blocks directly as system prompts.

### 8.1 SYSTEM PROMPT · `SplitProposer`

```
You are Smart Split's AI Split Proposer. Given a parsed receipt (items, prices,
tax, tip) and a list of squad members with their tags ("vegetarian", "didn't
order", "stayed 2 nights", "did not ride", etc.), propose a fair split.

Rules:
1. Never invent prices, members, or rules. If data is missing, ask.
2. Output JSON in the SplitProposal schema below — no prose.
3. Every member's share must include a `reasons[]` array citing the rule and
   the line items applied.
4. Default rule: by participants. Override only when scene/tags justify it.
5. Round to the smallest currency unit. Surplus from rounding goes to the payer.
6. Never autonomously settle. Output is a *proposal* for human approval.

Schema:
{
  "scene": "travel.hotel" | "travel.ride" | "restaurant" | "ticket"
         | "utility" | "subscription" | "groupbuy" | "custom",
  "currency": "ISO-4217",
  "totals": { "gross": number, "tax": number, "tip": number },
  "shares": [
    { "memberId": string, "amount": number, "reasons": string[] }
  ],
  "evidence": [ { "itemId": string, "claimedBy": string[] } ],
  "warnings": string[]
}
```

### 8.2 SYSTEM PROMPT · `ReceiptParser`

```
You are Smart Split's Receipt Parser. Input: one or more images of a receipt,
hotel folio, ride screenshot, or activity confirmation email. Output: a
structured ReceiptParse JSON.

Rules:
1. Extract merchant, datetime (ISO 8601), currency (ISO 4217), each line item
   (name, qty, unit price, line total), subtotal, tax, tip, total, and a scene
   guess.
2. If the image is illegible, return a partial parse and set `confidence` per
   field. Do not hallucinate values.
3. Preserve original strings in a `raw` field alongside normalized values.
4. Do not OCR personally identifiable info beyond what's on the receipt; flag
   PII you do find in a `piiFlags` array.
```

### 8.3 SYSTEM PROMPT · `PostcardCurator`

```
You are Smart Split's Postcard Curator. Input: a CardTrigger event (place
visit, bill settled, trip end, anniversary, milestone) plus the squad's
privacy posture. Output: a Postcard JSON ready to be rendered by the React
component <Postcard />.

Rules:
1. Never include exact amounts unless privacy posture = "show_amounts".
2. The title must be ≤ 28 characters; the subtitle ≤ 60.
3. Pick `palette` and `motif` from the allowed enum only (see POSTCARD_MODULE).
4. Honor `language` from the squad's locale.
5. The card is a memory, not a receipt. Lead with place / vibe, not numbers.
```

### 8.4 SYSTEM PROMPT · `SettlementExplainer`

```
You are Smart Split's Settlement Explainer. Given a SplitProposal plus the
original parsed receipt, generate a 1–3 sentence explanation per share that a
non-technical user can audit at a glance. Always cite which line items and
which rule produced the number. No marketing fluff. No emojis unless the
caller opted in.
```

### 8.5 SYSTEM PROMPT · `SceneClassifier`

```
You are Smart Split's Scene Classifier. Given a receipt / screenshot / email,
return one of:
  travel.hotel | travel.ride | travel.flight | travel.activity
  restaurant | grocery | utility | subscription | groupbuy
  reimbursement | gift | custom
plus a confidence score in [0, 1] and a 1-sentence rationale. If the input
spans multiple scenes, return an array sorted by confidence.
```

---

## 9. Privacy Stance · [from memo §8]

Make privacy a **feature**, not a compliance afterthought.

- **Contacts** — never auto-uploaded; invite-by-link or nickname only.
- **Location** — log only the expense coordinate, not continuous tracking.
- **Receipts** — user can delete originals after OCR; offer on-device OCR for sensitive cases.
- **Bank data** — not in v1.
- **Card data** — never stored; hand off to Stripe / PayPal / Apple Pay / Google Pay.
- **Group ledgers** — private by default; trip-end auto-archive option.
- **AI training** — no private bills used for public-model training unless explicit opt-in.

Frame in product copy as "data minimization" (UK ICO) and "reasonably necessary" (AU OAIC APP 3) — both cited in memo §8.

---

## 10. Tech Compatibility · [from README scaffold + your spec]

Friend's frontend: **React + TypeScript + Vite** (per the supplied scaffold). To keep the user's part and the friend's part interoperable, this doc enforces:

- All cross-team contracts expressed as **TypeScript types**.
- All realtime events documented as `Event<topic, payload>` shapes.
- All backend endpoints documented as `METHOD /path → ResponseType`.
- **No assumptions** about backend internals (DB, queue, hosting) — backend is the friend's choice.

The postcard module (`POSTCARD_MODULE.md`) is the first concrete interface to be agreed on; future modules (e.g. realtime claim engine for face-to-face squads) follow the same pattern.

---

## 11. Roadmap · [from deck §07]

| Phase    | Window     | Focus                                                    |
| -------- | ---------- | -------------------------------------------------------- |
| **v1.0** | Q1–Q2      | AI Travel Split Workspace — trip groups, multi-FX, OCR.  |
| **v1.5** | Q3         | Rent + Subscriptions — templates, auto-cycle.            |
| **v2.0** | Q4         | Group buys / gifts / couples — social splits, long ledger. |
| **v2.5** | Next Q1    | B2B — reimbursement / projects, approvals, finance export. |
| **v3.0** | Next Q2+   | Agents · Open API — the everything-split network.        |

**Postcard layer is slotted into v1.0** alongside the travel workspace because it's the social loop that pulls users back between trips.

---

## 12. Business Model · [from memo §10]

Freemium + Pro. Avoid early payment take-rates (memo §10.2 — needs scale + compliance investment).

- **Free** — 1–2 active groups, basic manual entry, basic settlement.
- **Plus** (monthly / annual) — AI receipt parsing, unlimited groups, trip map, multi-currency.
- **Pro Trip Pack** — one-shot purchase for trip leads who hate subscriptions.
- **Household Plan** — recurring bills, monthly dashboard, utility templates.
- **B2B2C** — hostels, travel agencies, student housing, coworking, event organizers.

---

## 13. Risk Register · [from memo §12]

| Risk                       | Mitigation                                                       |
| -------------------------- | ---------------------------------------------------------------- |
| Seen as Splitwise clone    | Lead with AI + scene + postcard, never with "we calculate balances" |
| New-app friction           | Link-first; non-signups can view & confirm                       |
| Wallet incumbents          | Don't compete on payment; orchestrate across rails               |
| AI miscalculation          | AI proposes only; human approves; always editable                |
| Privacy concern            | Data minimization, local-first, private-by-default               |
| Travel low-frequency       | Expand into roommate / couple / recurring quickly                |
| Compliance creep           | v1 holds no funds, no card storage, no KYC                       |

---

## 14. Go-to-Market · [from memo §11]

**Beachhead users (priority order):**

1. 20–35 y/o multi-person travel groups.
2. Exchange / international students.
3. Digital nomads / backpackers.
4. Shared-housing roommates.
5. Urban young adults with frequent group dining / weekend outings.

**Launch channels (memo §11):**

- TikTok / Reels — map ledger + trip recap is highly visual.
- Reddit / Discord travel & roommate communities.
- International-student communities (high cross-border, multi-currency need).
- Hostel / group-tour partnerships.
- Product Hunt / indie-hacker / AI-tool directories.
- MCP / agent-marketplace listings (post-v2.5).

**Viral loop (memo §11):**
*One person creates a trip → invites friends → friends see what they owe → upload their own receipts → trip ends with a recap / map → next trip reuses it.*

---

## 15. Open Decisions (need user / friend alignment)

1. **Realtime transport** for face-to-face mode: WebSocket vs. WebRTC DataChannel vs. polling? (Drives backend choice.)
2. **OCR provider**: on-device (Tesseract / MLKit), Vision API, or in-house?
3. **Postcard storage**: server-canonical vs. local-first with sync?
4. **Maps provider lock-in**: Google Maps Platform vs. Mapbox vs. MapLibre + OSM tiles?
5. **Identity**: email passwordless, social login, or no-account (claim-link only)?
6. **Agent surface**: MCP server first vs. proprietary tool-use first? (memo §6.1 leans MCP.)

These are flagged so the user and the friend can pick before implementation locks in.
