---
marp: true
theme: default
size: 16:9
paginate: true
header: 'Smart Split · BEX5413 Prototype Presentation Canvas'
footer: 'Use · test · learn · iterate'
style: |
  :root {
    --navy: #14213d;
    --market: #e9edf3;
    --prototype: #e0ebda;
    --evidence: #fbd9b4;
    --feedback: #fff2cc;
    --accent: #2f6f4e;
    --line: #d8dde7;
    --ink: #1c2230;
    --muted: #5a6680;
  }
  section { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--ink); }
  h1, h2, h3 { color: var(--navy); letter-spacing: -0.01em; }
  h2 { border-bottom: 3px solid var(--navy); padding-bottom: 6px; }
  em { color: var(--navy); font-style: normal; font-weight: 600; }
  .strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .cols-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .card { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; font-size: 0.78em; }
  .market { background: var(--market); }
  .prototype { background: var(--prototype); }
  .evidence { background: var(--evidence); }
  .feedback { background: var(--feedback); }
  .pin { display: inline-block; background: var(--accent); color: #fff; padding: 2px 8px; border-radius: 999px; font-size: 0.65em; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 0.7em; }
  table th { background: var(--navy); color: #fff; padding: 8px 10px; text-align: left; }
  table td { border: 1px solid var(--line); padding: 8px 10px; vertical-align: top; }
  .starter { background: var(--feedback); border-left: 4px solid #d6b540; padding: 10px 14px; border-radius: 4px; font-size: 0.85em; }
---

<!-- _class: lead -->

# Smart Split
### From bookkeeping to togetherness — bill splitting, reframed.

A market-first, meaning-aware walkthrough using **Verganti's design-driven innovation** and **Balfour's Four Fits**.

| Team / venture | Prototype tested | Target user | Feedback requested |
|---|---|---|---|
| Smart Split | Concierge MVP v0.3 | Trip groups, 22–32 | Payment-trust + meaning shift |

<!--
Open by naming the problem in one breath:
"Splitting bills is the moment a friendship becomes accounting.
We are trying to make that moment disappear." 30 seconds.
-->

---

## Roadmap · 10 minutes total

<div class="strip">
<div class="card market"><b>1. Market &amp; problem</b><br><small>2 min</small><br>Category, who, urgent problem, motivations, current alternatives.</div>
<div class="card prototype"><b>2. Prototype &amp; value</b><br><small>3 min</small><br>Core value proposition, hook, time to value, stickiness.</div>
<div class="card evidence"><b>3. Customer evidence</b><br><small>3 min</small><br>Who engaged, what they did, what surprised us, what changed.</div>
<div class="card feedback"><b>4. Feedback ask &amp; next test</b><br><small>2 min</small><br>Riskiest assumption, what feedback we need, one-week commitment.</div>
</div>

**Presenter principle.** Market insight → product hypothesis → prototype → customer reaction → next experiment. We don't defend the solution; we name which assumption is still uncertain.

**Theory frame.** *Verganti* — meaning-driven innovation; we compete on what splitting *feels like*, not what features it has. *Balfour* — Four Fits: market ↔ product ↔ channel ↔ model must all align.

---

## Canvas A · Start with the market

<div class="cols-3">
<div class="card market">
<b>Category</b><br>
Group payments &amp; shared-money infrastructure.<br><br>
<small>Adjacent — but not — Splitwise (tracking), Venmo (P2P), QuickBooks (accounting). Smart Split = <em>togetherness infrastructure for shared money</em>.</small>
</div>
<div class="card market">
<b>Who</b><br>
Urban Gen-Z &amp; younger millennials, 22–32, in groups of 3–8 (eat out, travel, share housing).<br><br>
<small>Sub-segment first: <em>trip groups of 4–8</em> — peak pain density, peak repeat use.</small>
</div>
<div class="card market">
<b>Urgent problem</b><br>
Shared spend creates social friction. Existing tools track (Splitwise) <em>or</em> pay (Venmo) — never both with fairness intelligence.<br><br>
<small>Post-pandemic social re-emergence + inflation = more shared spend, less tolerance for friction.</small>
</div>
</div>

---

## Canvas A · Why it matters &amp; what they do today

<div class="cols-3">
<div class="card market">
<b>Motivations (JTBD)</b>
<ul>
<li><em>Emotional</em> — end the night without owing anyone.</li>
<li><em>Social</em> — protect group harmony.</li>
<li><em>Operational</em> — drop the mental ledger.</li>
<li><em>Economic</em> — stop quietly losing money in forgotten reimbursements.</li>
</ul>
<small><em>Job:</em> "Help me close the tab on this group, so we can keep being friends."</small>
</div>
<div class="card market">
<b>Current alternatives</b>
<ul>
<li>Splitwise — tracks, never settles.</li>
<li>Venmo / WeChat Pay — settles, never computes fairly.</li>
<li>Spreadsheets &amp; mental math — most common, lowest fidelity.</li>
<li>"One person eats it" — silent tax on the generous friend.</li>
</ul>
<small>71% of our 28 interviewees use ≥2 tools per trip.</small>
</div>
<div class="card market">
<b>Switching forces</b><br>
<em>Pushing away from old way:</em> cognitive load, embarrassment, lost money, broken evenings.<br><br>
<em>Anxiety / friction stopping adoption:</em>
<ul>
<li>Trust to connect a wallet.</li>
<li>"Is the split actually fair?"</li>
<li>Group adoption — no value if only one person uses it.</li>
</ul>
</div>
</div>

---

## Canvas A · Success, meaning, position

<div class="cols-3">
<div class="card market">
<b>Success trigger</b><br>
What we'll see when value lands:
<ul>
<li>"I forgot we even split it."</li>
<li>≥2 repeats within 7 days.</li>
<li>≥2 invites per active user.</li>
</ul>
</div>
<div class="card prototype">
<b>New meaning</b><br>
<em>Splitting is no longer accounting between friends.</em><br><br>
It is a quiet act of care that makes the money disappear so the relationship can stay.<br><br>
<small><em>Not just</em> "AI for receipts" — the feature is the enabler of a meaning shift.</small>
</div>
<div class="card feedback">
<b>Innovation position</b><br>
<em>Meaning-driven</em> (Verganti) with AI as enabler.<br><br>
<small>We are not racing Splitwise on features. We are reframing what splitting <em>means</em> — from ledger to togetherness — and using AI to make the new meaning frictionless.</small><br><br>
<span class="pin">Design-driven · radical meaning, incremental tech</span>
</div>
</div>

---

## Verganti · Where Smart Split sits

<div class="cols-2">

<div>

|  | Incremental tech | Radical tech |
|---|---|---|
| **Radical meaning** | ★ **Design-driven / Meaning-driven** ★ <br><small>Smart Split is here</small> | Technology epiphany <br><small>Apple-grade leaps</small> |
| **Incremental meaning** | Market-pull <br><small>Splitwise updates live here</small> | Technology-push <br><small>"AI for receipts" alone</small> |

</div>

<div class="card prototype">
<b>Why this quadrant</b><br>
The math of splitting was solved a decade ago — Splitwise nailed it. What's <em>not</em> solved is the social meaning <em>around</em> the math: the awkwardness, the unspoken debts, the friendship tax.<br><br>
Smart Split changes <em>meaning first</em>, then uses AI (OCR + group context) to make the new meaning frictionless.<br><br>
<small><em>Risk this frame surfaces:</em> if users only hear "AI receipt scanner," we collapse into the tech-push quadrant. Our pitch, onboarding, and metrics must protect the meaning frame.</small>
</div>

</div>

---

## The meaning shift, in one breath

<div class="cols-2">

<div class="card" style="background: #f2e9e4; border-color:#d8c7bd;">
<b>Old meaning</b><br>
<em>Splitting bills = bookkeeping between friends.</em>
<ul>
<li>Ledger</li>
<li>Debt</li>
<li>Fairness as math</li>
<li>Awkwardness</li>
</ul>
</div>

<div class="card prototype">
<b>New meaning</b><br>
<em>Splitting bills = a quiet act of care.</em>
<ul>
<li>Trust</li>
<li>Lightness</li>
<li>Fairness as feeling</li>
<li>Togetherness</li>
</ul>
</div>

</div>

**Why this matters (Verganti).** In mature categories, feature parity is cheap and copyable; meaning shifts are slow to build and hard to copy. Our moat is the meaning frame, defended by AI execution.

---

## Prototype &amp; value

<div class="cols-2">
<div class="card prototype">
<b>Core value proposition</b><br>
<em>"Snap, split, settled — in under 30 seconds, without a single 'how much do I owe you?'"</em><br><br>
<em>Hook:</em> one photo of the receipt; the group is settled before dessert arrives.
</div>
<div class="card prototype">
<b>What's in the prototype (v0.3)</b>
<ul>
<li>AI receipt OCR + line-item assignment.</li>
<li>Group-context model: "dinner crew" vs "trip crew."</li>
<li>One-tap settlement via wallet integration (concierge for v0.3).</li>
<li>Soft-closing nudge: "Everyone's even — close the trip?"</li>
</ul>
</div>
</div>

| Time to value | Settlement | Invites per user (target) |
|:---:|:---:|:---:|
| **&lt; 30 s** | **1 tap** | **N + 2** |

**Stickiness model.** Group memory (the crew remembers you) · settlement record (frictionless trust) · soft reputation (subtle karma score) · trip mode (high-frequency repeat surface).

---

## Balfour · The Four Fits, applied

| # | Fit | Smart Split's answer |
|---|---|---|
| 1 | **Market ↔ Product** | Trip groups, 22–32. High frequency, high social stakes. Product solves the emotional + operational problem — not just the math. |
| 2 | **Product ↔ Channel** | Product *is* the channel. Every split is a group invite. Viral coefficient is built into the JTBD; zero paid acquisition at seed. |
| 3 | **Channel ↔ Model** | Viral channels demand zero-friction monetisation → freemium. Free for casual groups; premium for multi-currency, AI auto-categorise, trip mode. |
| 4 | **Model ↔ Market** | $4–6/mo per power user matches young-pro willingness to pay for social peace. Transaction-fee tier for high-volume travel groups. |

<div class="cols-2">
<div class="card feedback">
<b>Tightest fit (today)</b><br>
<em>Product ↔ Channel.</em> Every successful split creates an invite event. Early evidence supports this (see customer evidence).
</div>
<div class="card evidence">
<b>Loosest fit (today)</b><br>
<em>Channel ↔ Model.</em> We don't yet know if freemium converts at the rate viral channels demand. Biggest open question past prototype.
</div>
</div>

**Balfour's argument.** It's a system, not a checklist. If any fit is loose, growth leaks through it.

---

## Customer evidence — what they said &amp; did

| Customer / segment | What they said | What they did | What we learned / changed |
|---|---|---|---|
| *University roommates* · 4 ppl | "After a week I forget who paid for what." | Used a shared Google Sheet that died after day 3. | Memory decay is the real failure mode → auto-capture is non-negotiable. |
| *Young couple* · 2 ppl | "We don't track; it just builds up." | Avoided the conversation; one partner felt quietly resentful. | Even N=2 has the problem. Valid secondary segment, not a pivot. |
| *Trip group* · 6 ppl, Bali week | "20 min of math at the airport. Ugh." | Tested concierge MVP — settled **$1,400 in 90 s**. | Trips = killer onboarding moment. Pivoted hero flow to "Start a trip." |
| *Older user* · 45+ | "I'd never connect my bank to that." | Walked off at the payment-connect step. | Confirms primary segment: Gen-Z / younger millennial. Older = later. |

---

## Customer evidence checkpoint

<div class="cols-3">
<div class="card prototype">
<b>Strongest validation signal</b><br>
<em>8 / 10</em> concierge testers invited a friend <em>during</em> the test session — unprompted.<br><br>
<em>6 / 10</em> settled with real money in v0.3, not simulated.
</div>
<div class="card evidence">
<b>Strongest contradiction</b><br>
<em>4 / 10</em> first-time testers paused at payment-connect. Trust gap is real, not theoretical.<br><br>
Older sub-segment hard-stopped at the same step — confirms segment focus, but trust UX matters for everyone.
</div>
<div class="card feedback">
<b>Behaviour to watch next</b>
<ul>
<li>Day-7 repeat use rate.</li>
<li>Invites sent per active user.</li>
<li><em>Settle-rate</em> — % of splits that complete payment, not just compute.</li>
</ul>
</div>
</div>

---

## Feedback ask · the riskiest assumption

<div class="cols-2">
<div class="card evidence">
<b>Riskiest assumption</b><br>
<em>Users will connect a payment method on first use</em> (trust), <em>and</em> the meaning shift — care, not accounting — drives adoption over feature comparison.<br><br>
<small>If either half is wrong, the whole "settle in one tap" promise collapses into a better Splitwise.</small>
</div>
<div class="card evidence">
<b>Where the prototype logic is weak</b>
<ul>
<li>Trust-on-day-one. Should v1 ship without payment connect?</li>
<li>Whether "togetherness" survives translation into a 60-character app-store subtitle.</li>
<li>Whether freemium price is below the threshold of "worth the friction."</li>
</ul>
</div>
</div>

**Specifically, we are asking peers for:**

- What evidence in our deck challenged the *togetherness > accounting* framing?
- In the trip-group test — is the buyer (trip organiser) the same person as the user (group)? If not, what does that change?
- Why aren't we charging at the receipt step? Stress-test our pricing intuition.

---

## Decision after feedback &amp; one-week commitment

<div class="cols-2">
<div class="card market">
<b>Decision rules</b>
<ul>
<li><em>Persevere</em> if ≥40% of trip-segment users connect a wallet in session 1.</li>
<li><em>Refine</em> if 20–40% connect <em>and</em> invite-rate ≥1.5 — decouple trust from value.</li>
<li><em>Pivot user</em> if &lt;20% connect — move to "split-intelligence-only" for a more trusting segment.</li>
<li><em>Pivot meaning</em> if invites &lt;1 per user — togetherness frame isn't landing; rebuild it.</li>
</ul>
</div>
<div class="card prototype">
<b>One-week iteration commitment</b><br>
<em>By next class we will test:</em> payment-connect rate with 10 new trip-segment users on v0.4.<br><br>
<em>Minimum evidence we'll bring back:</em>
<ul>
<li>Connect rate (target ≥40%).</li>
<li>Settle rate (target ≥60% of connecters).</li>
<li>3+ verbatim quotes on trust hesitation.</li>
<li>One short clip of the most confusing moment.</li>
</ul>
</div>
</div>

---

## Over to you · Q &amp; A

<div class="cols-2">
<div class="card">
<b>Listener principle</b> (from the canvas)<br><br>
Ask questions that reveal thinking, evidence, and customer behaviour. Avoid giving feature ideas too early. Your job is to help us make the next test sharper.
</div>
<div class="card feedback">
<b>Questions we'd love</b>
<ul>
<li>What evidence in the deck most challenges the meaning shift?</li>
<li>Which of Balfour's four fits looks loosest to you?</li>
<li>What's a cheaper experiment we could run before v0.4?</li>
</ul>
</div>
</div>

<div class="starter">
<b>Sentence starter for listeners:</b> &nbsp; "The strongest evidence I heard was ______. The assumption I would test next is ______ because ______."
</div>

**Thank you.** Smart Split — use, test, learn, iterate.

---

<!-- _paginate: false -->

## Appendix · Peer feedback capture sheet

| Feedback lens | Strong evidence observed | Question / concern | Suggested next experiment |
|---|---|---|---|
| Market problem |   |   |   |
| Product hypothesis |   |   |   |
| Customer engagement |   |   |   |
| Meaning / innovation |   |   |   |

<div class="starter">
<b>Feedback sentence starter:</b> &nbsp; "The strongest evidence I heard was ______. The assumption I would test next is ______ because ______."
</div>
