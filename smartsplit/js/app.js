/* SmartSplit · auth-gated SPA, hash router, view renderers, animations. */
(function () {
  "use strict";
  const DB = window.SS_DB;
  const STORE = window.SS_STORE;
  const { computeSplit, fmt } = window.SS_SPLIT;
  const SAMPLES = window.SS_SAMPLES || [];
  const SCENARIOS = window.SS_SCENARIOS || [];

  const PUBLIC_ROUTES = ["login", "signup"];
  const APP_ROUTES    = ["problem", "scenarios", "capture", "squad", "allocate", "settle"];
  const PITCH_ROUTES  = ["problem", "capture", "squad", "allocate", "settle"];

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => r.querySelectorAll(s);

  const view = $("#view");
  const topbar = $("#topbar");
  const pitch = $("#pitchStrip");

  let CURRENT_USER = null;

  /* ============ AVATAR ============ */
  const EMOJIS = [
    "🌟","⚡","🌸","🎓","📋","💼","🎨","🌿","🍵","🪐",
    "🐚","🌈","🍓","🦋","☕","🌙","🍑","🎯","🎭","📸",
  ];
  const COLORS = [
    "#c75d3e","#3a5a7f","#b07a3f","#2f7a4e","#7e3a6b",
    "#5d3a8c","#1f3d35","#ce8d3e","#a44560","#436b8b",
  ];
  function hashStr(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function avatarFor(name) {
    const n = (name || "?").toLowerCase().trim();
    const h = hashStr(n);
    return {
      emoji: EMOJIS[h % EMOJIS.length],
      color: COLORS[(h >> 8) % COLORS.length],
      initial: (name || "?").trim().charAt(0).toUpperCase(),
    };
  }

  /* ============ ANIM ============ */
  function animateIn(root) {
    (root || view).querySelectorAll("[data-anim]").forEach((el) => {
      const delay = parseInt(el.dataset.delay || "0", 10);
      if (delay === 0) {
        el.classList.add("in");
      } else {
        setTimeout(() => el.classList.add("in"), delay);
      }
    });
  }

  function toast(msg, kind) {
    const slot = $("#toast");
    const el = document.createElement("div");
    el.className = "toast" + (kind ? " " + kind : "");
    el.textContent = msg;
    slot.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 0.25s";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 260);
    }, 2400);
  }

  /* ============ AUTH ============ */
  async function bootAuth() {
    await DB.open();
    await DB.seedDemoUser();
    const sess = STORE.loadSession();
    if (sess && sess.username && sess.username !== "guest") {
      const u = await DB.getUser(sess.username);
      if (u) {
        CURRENT_USER = u;
        STORE.setState({ currentUser: u });
        await refreshHistory();
        return true;
      }
    }
    return false;
  }

  async function refreshHistory() {
    if (!CURRENT_USER || CURRENT_USER.isGuest) return;
    try {
      const list = await DB.listSplits(CURRENT_USER.username);
      STORE.setState({ history: list });
    } catch (e) {
      console.warn("[SmartSplit] history load failed", e);
    }
  }

  async function loginWithForm(form, btn, statusEl) {
    const username = (form.elements.username.value || "").trim().toLowerCase();
    const password = form.elements.password.value;
    btn.dataset.state = "loading";
    statusEl.className = "auth-status";
    statusEl.textContent = "Looking up…";
    // Simulate realistic latency for the demo animation
    await new Promise((r) => setTimeout(r, 420));

    const user = await DB.verifyLogin({ username, password });
    if (!user) {
      btn.dataset.state = "";
      statusEl.className = "auth-status error";
      statusEl.textContent = "Username or password is incorrect.";
      form.elements.password.focus();
      form.elements.password.select();
      return;
    }
    CURRENT_USER = user;
    STORE.saveSession(user);
    STORE.setState({ currentUser: user });
    await refreshHistory();
    btn.dataset.state = "success";
    statusEl.className = "auth-status ok";
    statusEl.textContent = "✓ Signed in as " + (user.displayName || user.username);
    setTimeout(() => { location.hash = "#problem"; }, 450);
  }

  async function signupWithForm(form, btn, statusEl) {
    const username = (form.elements.username.value || "").trim().toLowerCase();
    const password = form.elements.password.value;
    const displayName = (form.elements.displayName.value || "").trim();
    btn.dataset.state = "loading";
    statusEl.className = "auth-status";
    statusEl.textContent = "Creating account…";
    await new Promise((r) => setTimeout(r, 420));
    try {
      const user = await DB.createUser({ username, password, displayName });
      CURRENT_USER = user;
      STORE.saveSession(user);
      STORE.setState({ currentUser: user });
      btn.dataset.state = "success";
      statusEl.className = "auth-status ok";
      statusEl.textContent = "✓ Welcome, " + (user.displayName || user.username);
      setTimeout(() => { location.hash = "#problem"; }, 450);
    } catch (e) {
      btn.dataset.state = "";
      statusEl.className = "auth-status error";
      statusEl.textContent = e.message || "Could not create account.";
    }
  }

  function loginAsGuest() {
    const user = { username: "guest", displayName: "Guest", isGuest: true };
    CURRENT_USER = user;
    STORE.setState({ currentUser: user, history: [] });
    location.hash = "#problem";
    toast("Signed in as guest — splits won't persist.");
  }

  function logout() {
    STORE.saveSession(null);
    STORE.reset();
    CURRENT_USER = null;
    location.hash = "#login";
  }

  /* ============ ROUTER ============ */
  function currentRoute() {
    let r = (location.hash || "").replace("#", "").split("?")[0];
    if (!r) r = CURRENT_USER ? "problem" : "login";
    return r;
  }

  function syncPitchStrip(r) {
    if (!PITCH_ROUTES.includes(r)) { pitch.hidden = true; return; }
    pitch.hidden = false;
    $$(".pitch-strip .step").forEach((el) => {
      const step = el.dataset.step;
      const i = PITCH_ROUTES.indexOf(step);
      const cur = PITCH_ROUTES.indexOf(r);
      el.classList.toggle("active", step === r);
      el.classList.toggle("done", i >= 0 && i < cur);
    });
  }

  function renderTopbar(r) {
    topbar.innerHTML = "";
    if (PUBLIC_ROUTES.includes(r)) {
      topbar.innerHTML = `
        <a class="brand" href="#login">
          <span class="brand-mark">S</span>
          <h1 class="brand-wordmark">SmartSplit</h1>
        </a>
        <a class="back-cyster" href="/pcos/" title="Back to Cyster">← Cyster</a>
      `;
      return;
    }
    const u = CURRENT_USER;
    const ava = u ? avatarFor(u.displayName || u.username) : null;
    topbar.innerHTML = `
      <a class="brand" href="#problem">
        <span class="brand-mark">S</span>
        <h1 class="brand-wordmark">SmartSplit</h1>
      </a>
      ${u ? `
        <span class="user-chip">
          <span class="avatar" style="background:${ava.color}">${ava.emoji}</span>
          <span>${escape(u.displayName || u.username)}</span>
          <button id="logoutBtn" title="Sign out">⏻</button>
        </span>
      ` : ""}
    `;
    const lo = $("#logoutBtn");
    if (lo) lo.addEventListener("click", logout);
  }

  function routeFrom() {
    const r = currentRoute();
    document.body.dataset.route = r;

    // Auth gate
    if (APP_ROUTES.includes(r) && !CURRENT_USER) {
      location.hash = "#login";
      return;
    }
    renderTopbar(r);
    syncPitchStrip(r);
    view.innerHTML = "";

    const tpl = $("#tpl-" + r);
    if (!tpl) {
      location.hash = CURRENT_USER ? "#problem" : "#login";
      return;
    }
    view.appendChild(tpl.content.cloneNode(true));
    const fn = renderers[r];
    if (fn) {
      try { fn(); } catch (e) {
        console.error("[SmartSplit] renderer", r, "failed", e);
        toast("Something went wrong.", "error");
      }
    }
    requestAnimationFrame(() => animateIn(view));
    window.scrollTo(0, 0);
  }

  /* ============ RENDERERS ============ */
  const renderers = {};

  renderers.login = function () {
    const form = $("#loginForm");
    const btn = $("#loginSubmit");
    const status = $("#authStatus");
    const strength = $("#authStrength");
    const pw = form.elements.password;

    pw.addEventListener("input", () => {
      const v = pw.value;
      const s = v.length === 0 ? 0 : v.length < 4 ? 1 : v.length < 8 ? 2 : 3;
      strength.dataset.strength = String(s);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      loginWithForm(form, btn, status);
    });
    $("#toSignup").addEventListener("click", () => { location.hash = "#signup"; });
    $("#loginGuest").addEventListener("click", loginAsGuest);
  };

  renderers.signup = function () {
    const form = $("#signupForm");
    const btn = $("#signupSubmit");
    const status = $("#authStatus");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      signupWithForm(form, btn, status);
    });
    $("#toLogin").addEventListener("click", () => { location.hash = "#login"; });
  };

  renderers.problem = function () {
    const wrap = $("#historyWrap");
    const hist = STORE.getState().history || [];
    if (hist.length === 0) {
      const t = $("#tpl-history-empty").content.cloneNode(true);
      wrap.appendChild(t);
      return;
    }
    hist.forEach((h, i) => {
      const row = document.createElement("a");
      row.className = "history-row";
      row.href = "#problem";
      row.style.animationDelay = (i * 50) + "ms";
      const when = h.settledAt ? new Date(h.settledAt) : new Date();
      row.innerHTML = `
        <div>
          <div class="title">${escape(h.title || "")}</div>
          <div class="meta">${escape(h.placeName || "—")} · ${when.toLocaleDateString()}</div>
        </div>
        <div class="amt">${fmt(h.totalCents || 0)}</div>
      `;
      wrap.appendChild(row);
    });
  };

  renderers.scenarios = function () {
    const grid = $("#scenarioGrid");
    SCENARIOS.forEach((s, i) => {
      const card = document.createElement("article");
      card.className = "scenario";
      card.dataset.anim = "rise";
      card.dataset.delay = String(80 + i * 80);
      card.innerHTML = `
        <div class="ico">${s.icon}</div>
        <div class="title">${escape(s.title)}</div>
        <p class="desc">${escape(s.desc)}</p>
        <div class="panels">
          ${s.panels.map((p) => `
            <div class="panel">
              <div class="step-no">${escape(p.step)}</div>
              <div>${escape(p.body)}</div>
            </div>
          `).join("")}
        </div>
      `;
      grid.appendChild(card);
    });
  };

  renderers.capture = function () {
    const fileIn = $("#receiptFile");
    fileIn.addEventListener("change", () => {
      if (!fileIn.files || !fileIn.files.length) return;
      toast("📸 Photo received — OCR's on the roadmap, using a sample for now.");
      pickSample(SAMPLES[0]);
    });

    const r = STORE.getState().receipt;
    if (r) renderParsedPreview(r);

    const gallery = $("#receiptGallery");
    SAMPLES.forEach((s, i) => {
      const card = renderReceiptCard(s);
      card.dataset.delay = String(60 + i * 60);
      gallery.appendChild(card);
    });
  };

  function renderParsedPreview(r) {
    const wrap = $("#parsedWrap");
    if (!wrap) return;
    wrap.hidden = false;
    const ms = STORE.getState().lastParseMs || 0;
    $("#parsedTime").textContent = "Parsed in " + ms + "ms";
    $("#parsedTitle").textContent = r.title;
    $("#parsedPlace").textContent = r.placeName || "";
    const list = $("#parsedItems");
    list.innerHTML = "";
    r.items.forEach((it) => {
      const row = document.createElement("div");
      row.className = "parsed-item";
      row.innerHTML = `
        <div>
          <div class="name">${escape(it.name)}</div>
          <div class="qty">${it.qty > 1 ? "× " + it.qty : ""}</div>
        </div>
        <div class="price">${fmt(it.priceCents * (it.qty || 1))}</div>
      `;
      list.appendChild(row);
    });
    const fee = $("#parsedFee");
    if (r.serviceFeeCents > 0) {
      const pct = r.servicePct ? r.servicePct + "%" : fmt(r.serviceFeeCents);
      fee.innerHTML = `<span>Service fee</span><strong>${pct}</strong>`;
    } else {
      fee.innerHTML = `<span>No service fee</span><strong>—</strong>`;
    }
    // Re-trigger animation
    wrap.classList.remove("in");
    requestAnimationFrame(() => wrap.classList.add("in"));
  }

  function renderReceiptCard(s) {
    const card = document.createElement("article");
    card.className = "receipt-card";
    card.dataset.anim = "rise";
    const m = s.merchant;
    card.innerHTML = `
      <header class="receipt-band ${s.band}">
        <span class="badge">${escape(s.bandLabel)}</span>
        <button class="use" type="button">Use this →</button>
      </header>
      <div class="receipt-body">
        <h4>${escape(m.name)}</h4>
        <div class="receipt-meta">
          ${escape(m.abn)}<br/>
          ${escape(m.address)}<br/>
          ${escape(m.datetime)}
        </div>
        <hr class="receipt-divider"/>
        ${s.items.map((it) => `
          <div class="receipt-line">
            <span class="q">${it.qty > 1 ? it.qty + "×" : ""}</span>
            <span class="n">${escape(it.name)}</span>
            <span class="p">${fmt(it.priceCents * it.qty)}</span>
          </div>
        `).join("")}
        <hr class="receipt-divider"/>
        <div class="receipt-sub"><span>Subtotal</span><span>${fmt(s.subtotalCents)}</span></div>
        ${s.serviceFeeCents > 0 ? `
          <div class="receipt-sub"><span>Service ${s.servicePct ? s.servicePct + "%" : ""}</span><span>${fmt(s.serviceFeeCents)}</span></div>
        ` : ""}
        <div class="receipt-total"><span>TOTAL AUD</span><span>${fmt(s.totalCents)}</span></div>
        <hr class="receipt-divider"/>
        <div class="receipt-foot">
          ${escape(m.payment)}<br/>
          ${escape(m.footer).replace(/\n/g, "<br/>")}
        </div>
      </div>
    `;
    card.querySelector(".use").addEventListener("click", () => pickSample(s));
    return card;
  }

  function pickSample(sample) {
    const t0 = performance.now();
    const meName = CURRENT_USER ? (CURRENT_USER.displayName || CURRENT_USER.username) : "Me";
    const me = { id: "p_me", name: meName, isMe: true };
    STORE.update((s) => {
      const squad = s.squad.length > 0 ? s.squad : [me];
      return {
        ...s,
        squad,
        receipt: {
          id: STORE.newId("r"),
          title: sample.title,
          placeName: sample.placeName,
          servicePct: sample.servicePct || 0,
          serviceFeeCents: sample.serviceFeeCents,
          items: sample.items.map((it) => ({
            id: it.id,
            name: it.name,
            qty: it.qty,
            priceCents: it.priceCents,
            assignments: squad.map((p) => p.id),
          })),
        },
        lastParseMs: Math.max(1, Math.round(performance.now() - t0)),
      };
    });
    if (currentRoute() === "capture") {
      renderParsedPreview(STORE.getState().receipt);
      requestAnimationFrame(() => {
        const w = $("#parsedWrap");
        if (w) w.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  renderers.squad = function () {
    if (STORE.getState().squad.length === 0) {
      const meName = CURRENT_USER ? (CURRENT_USER.displayName || CURRENT_USER.username) : "Me";
      STORE.update((s) => ({ ...s, squad: [{ id: "p_me", name: meName, isMe: true }] }));
    }
    const list = $("#squadList");
    const next = $("#toAllocate");
    redraw();

    function redraw() {
      const s = STORE.getState();
      list.innerHTML = "";
      s.squad.forEach((p) => {
        list.appendChild(personChip(p, { withRemove: !p.isMe }));
      });
      if (!s.receipt) {
        next.textContent = "← Pick a receipt first";
        next.style.opacity = "0.55";
        next.style.pointerEvents = "none";
      } else {
        next.textContent = "Next → Tag who ate what";
        next.style.opacity = "";
        next.style.pointerEvents = "";
      }
    }

    const form = $("#addPerson");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      if (!name) return;
      const id = STORE.newId("p");
      STORE.update((st) => ({
        ...st,
        squad: [...st.squad, { id, name }],
        receipt: st.receipt ? {
          ...st.receipt,
          items: st.receipt.items.map((it) => ({
            ...it,
            assignments: [...new Set([...(it.assignments || []), id])],
          })),
        } : null,
      }));
      form.reset();
      redraw();
    });

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button.remove");
      if (!btn) return;
      const pid = btn.dataset.personId;
      STORE.update((st) => ({
        ...st,
        squad: st.squad.filter((p) => p.id !== pid),
        receipt: st.receipt ? {
          ...st.receipt,
          items: st.receipt.items.map((it) => ({
            ...it,
            assignments: (it.assignments || []).filter((id) => id !== pid),
          })),
        } : null,
      }));
      redraw();
    });
  };

  function personChip(p, opts = {}) {
    const ava = avatarFor(p.name);
    const chip = document.createElement("span");
    chip.className = "person-chip";
    chip.dataset.personId = p.id;
    chip.innerHTML = `
      <span class="avatar" style="background:${ava.color}">${ava.emoji}</span>
      <span class="name">${escape(p.name)}</span>
      ${opts.withRemove ? `<button class="remove" data-person-id="${p.id}" aria-label="Remove ${escape(p.name)}">×</button>` : ""}
    `;
    return chip;
  }

  renderers.allocate = function () {
    const s = STORE.getState();
    if (!s.receipt) return renderEmpty("Pick a receipt first.");
    const list = $("#allocateList");
    drawList();

    function drawList() {
      const st = STORE.getState();
      list.innerHTML = "";
      st.receipt.items.forEach((item) => {
        const row = document.createElement("article");
        row.className = "alloc-row";
        const meta = item.qty > 1
          ? "× " + item.qty + " · " + fmt(item.priceCents) + " each"
          : "—";
        row.innerHTML = `
          <div class="head">
            <div>
              <div class="name">${escape(item.name)}</div>
              <div class="meta">${meta}</div>
            </div>
            <div class="price">${fmt(item.priceCents * (item.qty || 1))}</div>
          </div>
          <div class="tags"></div>
        `;
        const tags = row.querySelector(".tags");
        st.squad.forEach((p) => {
          const on = (item.assignments || []).includes(p.id);
          const chip = personChip(p);
          chip.classList.toggle("on", on);
          chip.style.cursor = "pointer";
          chip.addEventListener("click", () => {
            STORE.update((state) => ({
              ...state,
              receipt: {
                ...state.receipt,
                items: state.receipt.items.map((it) => {
                  if (it.id !== item.id) return it;
                  const has = (it.assignments || []).includes(p.id);
                  return {
                    ...it,
                    assignments: has
                      ? it.assignments.filter((id) => id !== p.id)
                      : [...(it.assignments || []), p.id],
                  };
                }),
              },
            }));
            drawList();
          });
          tags.appendChild(chip);
        });
        list.appendChild(row);
      });
    }
  };

  renderers.settle = function () {
    const s = STORE.getState();
    if (!s.receipt) return renderEmpty("Nothing to settle yet.");
    const place = $("#placeName");
    place.value = s.receipt.placeName || "";
    place.addEventListener("input", (e) => {
      STORE.update((st) => ({
        ...st,
        receipt: { ...st.receipt, placeName: e.target.value },
      }));
    });

    drawTotals();
    function drawTotals() {
      const st = STORE.getState();
      const r = computeSplit(st.receipt, st.squad);
      $("#totalsCard").innerHTML = `
        <div class="stat-row"><span class="label">Items subtotal</span><span class="value">${fmt(r.itemsSubtotalCents)}</span></div>
        <div class="stat-row"><span class="label">Service fee</span><span class="value">${fmt(r.serviceFeeCents)}</span></div>
        <div class="stat-row total"><span class="label">Total</span><span class="value">${fmt(r.totalCents)}</span></div>
      `;
      const list = $("#owedList");
      list.innerHTML = "";
      r.perPerson.forEach((p, i) => {
        const ava = avatarFor(p.name);
        const row = document.createElement("div");
        row.className = "owed-row";
        row.style.animationDelay = i * 40 + "ms";
        row.innerHTML = `
          <div class="name">
            <span class="avatar" style="background:${ava.color}">${ava.emoji}</span>
            ${escape(p.name)}
          </div>
          <div class="amount">${fmt(p.owedCents)}</div>
        `;
        list.appendChild(row);
      });
    }

    $("#settleBtn").addEventListener("click", async () => {
      const st = STORE.getState();
      if (!st.receipt) return;
      const r = computeSplit(st.receipt, st.squad);
      const btn = $("#settleBtn");
      btn.dataset.state = "loading";
      celebrate();
      const entry = {
        id: STORE.newId("h"),
        userId: CURRENT_USER ? CURRENT_USER.username : "guest",
        title: st.receipt.title,
        placeName: st.receipt.placeName || "",
        settledAt: new Date().toISOString(),
        totalCents: r.totalCents,
        perPerson: r.perPerson,
        snapshot: st.receipt,
      };
      if (CURRENT_USER && !CURRENT_USER.isGuest) {
        try { await DB.saveSplit(entry); }
        catch (e) { console.warn("[SmartSplit] save failed", e); }
      }
      STORE.update((state) => ({
        ...state,
        receipt: null,
        history: [entry, ...state.history].slice(0, 50),
      }));
      btn.dataset.state = "success";
      setTimeout(() => { location.hash = "#problem"; }, 720);
    });
  };

  function celebrate() {
    const host = $("#app");
    const colors = ["#c75d3e","#1f3d35","#f1c97c","#2f7a4e","#3a5a7f","#b07a3f"];
    for (let i = 0; i < 42; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.style.background = colors[i % colors.length];
      c.style.left = (5 + Math.random() * 90) + "%";
      c.style.animationDelay = Math.floor(Math.random() * 240) + "ms";
      c.style.animationDuration = (900 + Math.random() * 600) + "ms";
      host.appendChild(c);
      setTimeout(() => c.remove(), 2200);
    }
  }

  function renderEmpty(msg) {
    view.innerHTML = "";
    const t = $("#tpl-empty").content.cloneNode(true);
    view.appendChild(t);
    $("#emptyMsg").textContent = msg;
  }

  function escape(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  /* ============ BOOT ============ */
  (async () => {
    try {
      await bootAuth();
    } catch (e) {
      console.warn("[SmartSplit] auth boot failed", e);
    }
    routeFrom();
    window.addEventListener("hashchange", routeFrom);
  })();
})();
