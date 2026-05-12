# Smart Split — Postcard Module Spec

> **Owner:** user (postcard layer).
> **Consumers:** friend's React + TypeScript + Vite frontend; AI agent layer; backend services.
> **Branch:** `claude/smart-split-app-Tqf14`.
> **Companion doc:** `STRATEGY.md` §7 introduces the concept; this file is the implementation contract.

This spec defines the **interface** of the Postcard module. It does **not** prescribe backend internals — the friend can implement storage / API however they prefer, as long as the contracts below are honored.

---

## 1. Concept

Postcards turn closed bills, visited places, and squad milestones into collectible cards. Inspired by Pikmin Bloom's positive-feedback loop: walking, settling, and remembering all mint visible artifacts.

Postcards are **memories**, not invoices. They lead with place, vibe, and squad — not with amounts (unless the user opts in to show them).

Why this matters for Smart Split:

- Bills are spiky and infrequent. The postcard layer is the **between-bills retention loop**.
- A memory artifact is shareable in ways a balance sheet never will be.
- It maps directly to the deck's "archive as memory" step (deck §06, step 6).

---

## 2. Card Taxonomy

| Card kind       | Trigger                                            | What it shows                                              |
| --------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| `place`         | Crossing a GPS region the squad once paid at       | Place name, date, the squad, optional vibe sticker         |
| `settle`        | A bill closes / settles                            | Scene icon, who paid whom, optional amount                 |
| `memory`        | A trip closes                                      | Snowglobe of place-cards from that trip                    |
| `squad`         | A squad reaches a milestone (5 trips, 100 splits…) | Squad portrait + stat                                      |
| `time_capsule`  | Anniversary unlock                                 | Throwback from N months / years ago                        |

The taxonomy is intentionally extensible — adding a kind is a `Postcard.kind` enum addition + a new renderer branch in `<Postcard />`.

---

## 3. Triggers

A trigger is anything that emits a `CardTrigger` event. The Postcard Curator (prompt §8.3 in `STRATEGY.md`) decides whether to mint a card and how.

```ts
export type CardTrigger =
  | {
      kind: 'gps_visit';
      squadId: string;
      coord: GeoCoord;
      visitedAt: string;            // ISO 8601
      nearbyExpenseIds: string[];
    }
  | {
      kind: 'bill_settled';
      squadId: string;
      billId: string;
      settledAt: string;
    }
  | {
      kind: 'trip_closed';
      squadId: string;
      tripId: string;
      closedAt: string;
    }
  | {
      kind: 'anniversary';
      squadId: string;
      sourceCardId: string;
      firedAt: string;
    }
  | {
      kind: 'milestone';
      squadId: string;
      metric: 'trips' | 'splits' | 'amount';
      value: number;
    };
```

Triggers MAY be deduplicated server-side — clients should treat a `204 No Content` from `POST /cards` as success, not failure.

---

## 4. Data Model

```ts
// Smallest building blocks
export type GeoCoord = { lat: number; lng: number };
export type Locale = 'en-US' | 'en-GB' | 'zh-CN' | 'ja-JP' | string; // ISO 639-1 + region
export type CurrencyCode = string; // ISO 4217

// A user inside a squad
export interface SquadMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: string; // ISO 8601
}

// Privacy posture per card (or inherited from squad default)
export type PrivacyPosture =
  | 'hide_amounts'     // show category only
  | 'show_amounts'     // show full numbers
  | 'show_settlement'; // show net balances, not line items

// The card itself — what <Postcard /> consumes
export interface Postcard {
  id: string;
  kind: 'place' | 'settle' | 'memory' | 'squad' | 'time_capsule';
  squadId: string;
  createdAt: string;

  // Display
  title: string;        // ≤ 28 chars
  subtitle?: string;    // ≤ 60 chars
  bodyHtml?: string;    // sanitized HTML, optional

  // Visual
  palette: 'sunset' | 'pine' | 'ocean' | 'paper' | 'midnight' | 'sakura';
  motif:   'map'    | 'receipt' | 'snowglobe' | 'silhouette' | 'plain';
  language: Locale;

  // Spatial
  place?: {
    name: string;
    coord: GeoCoord;       // coarse-rounded (see §9)
    mapStaticUrl?: string; // server-rendered static map snapshot
  };

  // Financial (subject to privacy)
  finance?: {
    currency: CurrencyCode;
    total?: number;        // omitted when privacy !== 'show_amounts'
    perMemberShown: boolean;
  };

  // Social
  members: SquadMember[];
  reactions?: { byMemberId: Record<string, string /* emoji */> };

  // Privacy
  privacy: PrivacyPosture;

  // Source linkage (server-only; do NOT leak in external shares)
  evidenceRef?: { billId?: string; tripId?: string; sourceCardId?: string };
}
```

These types should live in `src/types/postcard.ts` of the friend's frontend repo. The shape is **frozen** by this doc; additive fields go through a versioned `Postcard.v2`.

---

## 5. React Component API

```tsx
// PUBLIC COMPONENT
export interface PostcardProps {
  card: Postcard;
  variant?: 'feed' | 'detail' | 'preview';
  onReact?: (emoji: string) => void;
  onShare?: (target: 'image' | 'link' | 'native') => Promise<void>;
  onOpenMap?: (coord: GeoCoord) => void;
}

export function Postcard(props: PostcardProps): JSX.Element;

// HOOKS
export function useSquadFeed(squadId: string): {
  cards: Postcard[];
  isLoading: boolean;
  error?: Error;
};

export function useGeoCardWatcher(
  squadId: string,
  options?: {
    enabled?: boolean;
    minVisitDurationMs?: number; // default 60_000
    proximityMeters?: number;    // default 80
  }
): { lastTrigger?: CardTrigger };
```

**Implementation guidance:**

- `<Postcard variant="feed" />` — vertical card list (Pikmin-Bloom-style scrolling deck).
- `<Postcard variant="detail" />` — full-screen, share-ready, with map / itemized evidence behind a long-press.
- `<Postcard variant="preview" />` — small chip for chat / notification surfaces.

**Vite-specific notes:**

- Use `import.meta.env.VITE_MAPS_JS_KEY` for the **JS-restricted** Google Maps key.
- Lazy-load the map module via dynamic `import()` so the feed renders without map JS.
- Treat the package as a separate workspace (`packages/postcard`) so the friend can `npm link` from the main app.

---

## 6. Backend Contract (what FE expects)

| Method   | Path                          | Body / Query                        | Response                                          |
| -------- | ----------------------------- | ----------------------------------- | ------------------------------------------------- |
| `GET`    | `/squads/:id/cards`           | `?cursor=...&limit=...`             | `{ cards: Postcard[]; nextCursor?: string }`       |
| `GET`    | `/cards/:id`                  | —                                   | `Postcard`                                        |
| `POST`   | `/cards`                      | `CardTrigger` (server may dedupe)   | `Postcard` minted, or `204` on dedupe             |
| `POST`   | `/cards/:id/reactions`        | `{ emoji: string }`                 | `{ ok: true }`                                    |
| `DELETE` | `/cards/:id`                  | —                                   | `{ ok: true }` (squad members only)               |
| `WS`     | `/squads/:id/stream`          | —                                   | `StreamEvent` envelopes (see §7)                  |

**Auth header is out-of-scope for this doc** — the friend decides session/JWT/cookie. The contract above assumes the request is already squad-scoped.

---

## 7. Realtime Events

Single WebSocket topic per squad: `squad:<id>`.

```ts
export type StreamEvent =
  | { type: 'card.minted';    card: Postcard }
  | { type: 'card.reacted';   cardId: string; memberId: string; emoji: string }
  | { type: 'card.deleted';   cardId: string }
  | { type: 'item.claimed';   billId: string; itemId: string; memberId: string }  // see STRATEGY §6.1
  | { type: 'item.released';  billId: string; itemId: string; memberId: string }
  | { type: 'squad.joined';   member: SquadMember }
  | { type: 'bill.settled';   billId: string; at: string };
```

The same channel carries both the **claim-engine events** (face-to-face squad live grid) and the **card events** so the feed updates without a second connection.

---

## 8. Google Maps Integration

Three discrete capabilities, kept separable so a future swap to Mapbox / MapLibre is cheap.

### 8.1 Geofence watcher (client-side)

- Uses the browser Geolocation API (or React Native equivalent).
- On significant location change, query the squad's expense coordinates within `proximityMeters`.
- If a match **and** the user lingers ≥ `minVisitDurationMs`, emit `CardTrigger { kind: 'gps_visit' }`.
- **Pure-client:** no continuous coords sent server-side (see §9 privacy).

### 8.2 Static map snapshot (server)

- Uses Google Maps Static API (or alt) to produce a 1200×630 PNG keyed by `{coord, zoom, palette}`.
- Stored on `Postcard.place.mapStaticUrl`. Cache aggressively.
- Coordinates are **coarse-rounded** to 4 decimals (~11 m) before the snapshot call to reduce key uniqueness.

### 8.3 Place names (server)

- Reverse-geocode `coord → "Shibuya, Tokyo"` via Google Maps Geocoding API.
- Cache the response by coarse coord; **never** persist raw user GPS history.

**API key handling:**

- FE: only the **JS-restricted** Maps JS key (HTTP referrer-locked). Never embed a server-side key.
- BE: server-side keys for Static + Geocoding behind the backend; rate-limit per squad.

---

## 9. Storage & Privacy

Aligned with `STRATEGY.md` §9.

- **Coords are coarse-rounded** server-side to 4 decimals before persistence.
- **Receipt originals** are not joined to postcards — postcards reference `billId` only.
- **Reactions** are visible to the squad, not externally shareable.
- **External shares** of a card MUST strip `evidenceRef` and `finance.total` unless the sharer's privacy posture explicitly allows.
- **Deletion:** any squad member can delete a card; deletion propagates via `card.deleted`.

---

## 10. The Positive-Feedback Loop

1. Squad spends → bill settles → **settle-card** minted.
2. A week later, a member walks past Shibuya → **place-card** minted.
3. Trip ends → **memory-card** "Snowglobe" composes the trip's deck.
4. One year later → **time-capsule** unlocks; push notification: *"A year ago today, you split a ramen in Shinjuku."*
5. Each step nudges the squad back into the app **without asking for money.**

This is the layer that converts a transactional product into a retention product.

---

## 11. Extension Ideas · [proposal — not in source docs]

These are proposals to discuss; they are **not** in the PDF / PPTX. Mark each as accepted / rejected before building.

- **Stamps** — each scene type unlocks a stamp (hotel, ramen, museum, dividend). Visual collection grid.
- **Trip Snowglobe AR** — long-press a memory-card → opens an AR view when the user is at that coordinate again.
- **Local-first option** — store cards in IndexedDB with optional cloud sync; appeals to privacy-skeptical EU users.
- **Mood / weather variation** — palette derived from weather at time-of-card (sunny Shibuya → `sunset`, rainy London → `paper`).
- **Squad constellation** — when N squads share a place, the place-card shows an aggregate constellation (no PII).
- **MCP skill surface** — expose `mintCard(trigger)` as an MCP tool so an AI OS can mint cards from agent flows (aligns with `STRATEGY.md` §11 v3.0).
- **Dividend / seat splits as cards** — the user's "anything can be split" insight (a quarterly company dividend, a stadium row, a tour itinerary) all mint specialized cards with non-financial motifs.
- **Print-to-physical** — partner with a postcard print service; users can mail an actual postcard. (Late-stage, partner-required.)

---

## 12. Acceptance Criteria for First Slice

- [ ] `Postcard.tsx` renders all five `kind`s from a fixture JSON.
- [ ] `useGeoCardWatcher` mints a `gps_visit` trigger in a Vite dev environment using mocked Geolocation.
- [ ] `<Postcard variant="detail" />` opens a static-map snapshot.
- [ ] Reactions broadcast over the WebSocket and render in < 500 ms.
- [ ] All amounts are hidden when `privacy === 'hide_amounts'` — verified by a Vitest unit test.
- [ ] No raw GPS coord is sent to the backend at higher precision than 4 decimals — verified by an integration test that intercepts `POST /cards`.
- [ ] The package builds in isolation with `vite build` and exposes the public types in `dist/index.d.ts`.

---

## 13. File Layout Suggestion (drop-in for the friend's repo)

```
packages/
  postcard/
    src/
      Postcard.tsx
      hooks/
        useSquadFeed.ts
        useGeoCardWatcher.ts
      maps/
        staticMap.ts
        geofence.ts
      types/
        postcard.ts        // re-exports the types in §4
      index.ts
    package.json
    tsconfig.json
    vite.config.ts
```

This keeps the postcard layer cleanly separable so the user can iterate without blocking the friend's main-app build.
