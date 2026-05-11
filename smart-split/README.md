# Smart Split — Prototype Presentation (BEX5413)

Two synchronized formats of the same 10-minute pitch, built on the **Prototype Presentation Canvas** and framed with **Verganti** (design-driven / meaning innovation) and **Balfour** (Four Fits).

| File | What it is | When to use it |
|---|---|---|
| `index.html` | Reveal.js slide deck, self-contained (CDN-loaded). Hosted at `<your-domain>/smart-split/`. | Live presenting in a browser. Press `s` for speaker notes, `e` to enter print/PDF mode. |
| `slides.md` | Marp-flavoured markdown of the same deck. | Convert to `.pptx` / `.pdf` via the Marp CLI or VS Code Marp plugin. Edit content as plain text. |

## Slide map (matches the canvas)

1. Title — venture, prototype tested, target user, feedback requested
2. Roadmap — 2/3/3/2-minute structure + theory frame
3. Canvas A · Category · Who · Urgent problem
4. Canvas A · Motivations · Current alternatives · Switching forces
5. Canvas A · Success trigger · New meaning · Innovation position
6. **Verganti** — 2×2 matrix, Smart Split placed in the meaning-driven quadrant
7. **Verganti** — Old meaning → New meaning (the actual shift)
8. Prototype & value — core VP, hook, time to value, stickiness
9. **Balfour** — Four Fits applied, with tightest + loosest fit named
10. Customer evidence — segment / said / did / learned
11. Validation signal · Contradiction · Behaviour to watch next
12. Feedback ask — riskiest assumption + what we want from peers
13. Decision rules (persevere / refine / pivot) + one-week iteration commitment
14. Q & A — listener principle + sentence starter
15. Appendix — blank peer-feedback capture sheet

## Run locally

**HTML deck**

```sh
# from this folder
python3 -m http.server 8080
# open http://localhost:8080/
```

Or just open `index.html` directly in a browser.

**Markdown → PPTX / PDF**

```sh
npm install -g @marp-team/marp-cli
marp slides.md -o smart-split.pptx
marp slides.md --pdf -o smart-split.pdf
```

## Edit checklist (before presenting)

- [ ] Confirm team name on slide 1.
- [ ] Replace customer-evidence rows on slide 10 with **your** interview data.
- [ ] Update the validation / contradiction counts on slide 11 to your real numbers.
- [ ] Tighten the riskiest assumption (slide 12) — only one, in one sentence.
- [ ] Re-state the *persevere / refine / pivot* thresholds (slide 13) in your own metrics.
- [ ] Rehearse against the canvas timings: 2 / 3 / 3 / 2 = 10 minutes.
