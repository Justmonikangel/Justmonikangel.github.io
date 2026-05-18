/* SmartSplit · hash router + view renderers (no framework). */
(function () {
  "use strict";
  const { load, getState, update, subscribe, newId } = window.SS_STORE;
  const { computeSplit, fmt } = window.SS_SPLIT;
  const SAMPLES = window.SS_SAMPLES || [];

  const ROUTES = ["home", "capture", "squad", "allocate", "settle"];
  const view = document.getElementById("view");
  const renderers = {};

  function bindNav() {
    subscribe(() => {
      // re-paint current route on state changes
      const r = currentRoute();
      renderRoute(r);
    });
  }

  function currentRoute() {
    const r = (location.hash || "#home").replace("#", "").split("?")[0];
    return ROUTES.includes(r) ? r : "home";
  }

  function routeFrom() {
    const r = currentRoute();
    syncPitch(r);
    syncBottom(r);
    renderRoute(r);
    window.scrollTo(0, 0);
  }

  function syncPitch(active) {
    document.querySelectorAll(".pitch-strip .step").forEach((el) => {
      const step = el.dataset.step;
      el.classList.toggle("active", step === active);
      el.classList.toggle("done", ROUTES.indexOf(step) < ROUTES.indexOf(active));
    });
  }
  function syncBottom(active) {
    document.querySelectorAll(".bottom-nav a").forEach((el) => {
      el.classList.toggle("active", el.dataset.nav === active);
    });
  }

  function renderRoute(r) {
    view.innerHTML = "";
    const tpl = document.getElementById("tpl-" + r);
    if (!tpl) {
      view.textContent = "Route not found";
      return;
    }
    view.appendChild(tpl.content.cloneNode(true));
    const fn = renderers[r];
    if (fn) fn();
  }

  // ---------- Renderers ----------

  renderers.home = function () {
    const s = getState();
    if (s.history.length > 0) {
      const section = view.querySelector("[data-history-section]");
      section.hidden = false;
      const list = view.querySelector("#historyList");
      list.innerHTML = "";
      s.history.forEach((h) => {
        const row = document.createElement("div");
        row.className = "history-row";
        const when = new Date(h.settledAt);
        row.innerHTML = `
          <div>
            <div class="title">${escape(h.title)}</div>
            <div class="meta">${escape(h.placeName || "—")} · ${when.toLocaleDateString()}</div>
          </div>
          <div class="amt">${fmt(h.totalCents)}</div>
        `;
        list.appendChild(row);
      });
    }
  };

  renderers.capture = function () {
    const grid = view.querySelector("#sampleGrid");
    SAMPLES.forEach((s) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "sample-card";
      card.innerHTML = `
        <span class="badge ${s.badge}">${escape(s.badgeLabel)}</span>
        <h3>${escape(s.title)}</h3>
        <div class="place">${escape(s.placeName)}</div>
        <div class="totals">
          <span>${s.items.length} items</span>
          <strong>${fmt(s.totalCents)}</strong>
        </div>
      `;
      card.addEventListener("click", () => pickSample(s));
      grid.appendChild(card);
    });
  };

  function pickSample(sample) {
    update((state) => ({
      ...state,
      receipt: {
        id: newId("r"),
        title: sample.title,
        placeName: sample.placeName,
        serviceFeeCents: sample.serviceFeeCents || 0,
        items: sample.items.map((it) => ({
          id: it.id,
          name: it.name,
          qty: it.qty,
          priceCents: it.priceCents,
          assignments: state.squad.map((p) => p.id), // start with everyone tagged
        })),
      },
    }));
    location.hash = "#squad";
  }

  renderers.squad = function () {
    const s = getState();
    const list = view.querySelector("#squadList");
    list.innerHTML = "";
    s.squad.forEach((p) => {
      const chip = document.createElement("div");
      chip.className = "person-chip";
      chip.innerHTML = `
        <span class="avatar">${initial(p.name)}</span>
        <span>${escape(p.name)}</span>
        ${s.squad.length > 1 ? `<button class="remove" aria-label="Remove">×</button>` : ""}
      `;
      const btn = chip.querySelector(".remove");
      if (btn) btn.addEventListener("click", () => removePerson(p.id));
      list.appendChild(chip);
    });

    const next = view.querySelector("#toAllocate");
    next.style.opacity = s.receipt ? "1" : "0.5";
    next.style.pointerEvents = s.receipt ? "auto" : "none";
    if (!s.receipt) next.textContent = "Pick a receipt first ↑";

    const form = view.querySelector("#addPerson");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      if (!name) return;
      // Auto-tag the new person onto every existing item, so the default
      // state on Allocate is "everyone shares everything" — user opts OUT
      // for items someone didn't have.
      const id = newId("p");
      update((st) => ({
        ...st,
        squad: [...st.squad, { id, name }],
        receipt: st.receipt && {
          ...st.receipt,
          items: st.receipt.items.map((it) => ({
            ...it,
            assignments: [...new Set([...(it.assignments || []), id])],
          })),
        },
      }));
      form.reset();
    });
  };

  function removePerson(id) {
    update((s) => ({
      ...s,
      squad: s.squad.length <= 1 ? s.squad : s.squad.filter((p) => p.id !== id),
      receipt: s.receipt && {
        ...s.receipt,
        items: s.receipt.items.map((it) => ({
          ...it,
          assignments: (it.assignments || []).filter((pid) => pid !== id),
        })),
      },
    }));
  }

  renderers.allocate = function () {
    const s = getState();
    if (!s.receipt) return renderEmpty("Pick a receipt first.");
    const title = view.querySelector("#allocateTitle");
    title.textContent = s.receipt.title;
    const list = view.querySelector("#allocateList");
    list.innerHTML = "";
    s.receipt.items.forEach((item) => {
      const row = document.createElement("article");
      row.className = "item-row";
      row.innerHTML = `
        <div class="head">
          <div>
            <div class="name">${escape(item.name)}</div>
            <div class="qty">${item.qty > 1 ? `× ${item.qty}` : ""}</div>
          </div>
          <div class="price">${fmt(item.priceCents * (item.qty || 1))}</div>
        </div>
        <div class="tags"></div>
      `;
      const tags = row.querySelector(".tags");
      s.squad.forEach((p) => {
        const on = (item.assignments || []).includes(p.id);
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "tag-chip" + (on ? " on" : "");
        chip.innerHTML = `<span class="avatar">${initial(p.name)}</span><span>${escape(p.name)}</span>`;
        chip.addEventListener("click", () => toggleTag(item.id, p.id));
        tags.appendChild(chip);
      });
      list.appendChild(row);
    });
  };

  function toggleTag(itemId, personId) {
    update((s) => ({
      ...s,
      receipt: {
        ...s.receipt,
        items: s.receipt.items.map((it) => {
          if (it.id !== itemId) return it;
          const has = (it.assignments || []).includes(personId);
          return {
            ...it,
            assignments: has
              ? it.assignments.filter((id) => id !== personId)
              : [...(it.assignments || []), personId],
          };
        }),
      },
    }));
  }

  renderers.settle = function () {
    const s = getState();
    if (!s.receipt) return renderEmpty("Nothing to settle yet.");
    const placeInput = view.querySelector("#placeName");
    placeInput.value = s.receipt.placeName || "";
    placeInput.addEventListener("input", (e) => {
      update((st) => ({
        ...st,
        receipt: { ...st.receipt, placeName: e.target.value },
      }));
    });

    const result = computeSplit(s.receipt, s.squad);
    const totals = view.querySelector("#totalsCard");
    totals.innerHTML = `
      <div class="stat-row"><span class="label">Items subtotal</span><span class="value">${fmt(result.itemsSubtotalCents)}</span></div>
      <div class="stat-row"><span class="label">Service fee</span><span class="value">${fmt(result.serviceFeeCents)}</span></div>
      ${result.unclaimedCents > 0 ? `<div class="stat-row"><span class="label" style="color:#b15b84">Unclaimed</span><span class="value" style="color:#b15b84">${fmt(result.unclaimedCents)}</span></div>` : ""}
      <div class="stat-row total"><span class="label">Total</span><span class="value">${fmt(result.totalCents)}</span></div>
    `;

    const list = view.querySelector("#owedList");
    list.innerHTML = "";
    result.perPerson.forEach((row) => {
      const div = document.createElement("div");
      div.className = "owed-row";
      div.innerHTML = `
        <div class="name"><span class="avatar">${initial(row.name)}</span>${escape(row.name)}</div>
        <div class="amount">${fmt(row.owedCents)}</div>
      `;
      list.appendChild(div);
    });

    view.querySelector("#settleBtn").addEventListener("click", () => {
      const s = getState();
      if (!s.receipt) return;
      const r = computeSplit(s.receipt, s.squad);
      update((state) => ({
        ...state,
        receipt: null,
        history: [
          {
            id: newId("h"),
            title: state.receipt.title,
            placeName: state.receipt.placeName || "",
            settledAt: new Date().toISOString(),
            totalCents: r.totalCents,
          },
          ...state.history,
        ].slice(0, 20),
      }));
      location.hash = "#home";
    });
  };

  function renderEmpty(msg) {
    view.innerHTML = "";
    const tpl = document.getElementById("tpl-empty");
    view.appendChild(tpl.content.cloneNode(true));
    view.querySelector("#emptyMsg").textContent = msg;
  }

  // ---------- helpers ----------
  function initial(name) {
    return (name || "?").trim().charAt(0).toUpperCase();
  }
  function escape(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // ---------- Boot ----------
  load();
  bindNav();
  routeFrom();
  window.addEventListener("hashchange", routeFrom);
})();
