// 主控：洗牌、发牌堆、拖拽 / 手势抓取、放置到牌阵、生成解读。
(function () {
  const $ = sel => document.querySelector(sel);
  const stage = $("#stage");
  const deckPile = $("#deck-pile");
  const board = $("#spread-board");
  const readingEl = $("#reading .reading-body");
  const cursorEl = $("#hand-cursor");
  const handOverlay = $("#hand-overlay");
  const handVideo = $("#hand-video");
  const handCanvas = $("#hand-canvas");
  const handStatus = $("#hand-status");
  const handToggle = $("#hand-toggle");
  const deckSelect = $("#deck-select");
  const spreadSelect = $("#spread-select");
  const resetBtn = $("#reset-btn");
  const spreadImport = $("#spread-import");

  let currentSpread = null;
  let deckQueue = [];      // 还没翻开的牌
  let placed = [];         // [{drawnCard, slotIndex}]
  let allSpreads = [...window.BUILT_IN_SPREADS];
  let cardEls = [];        // 牌堆里可视的牌 DOM
  let drag = null;         // 当前拖拽的 {el, drawn, offsetX, offsetY}
  let tracker = null;
  let lastHand = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setDeck(deckId) {
    document.body.dataset.deck = deckId;
  }

  function loadSpread(id) {
    currentSpread = allSpreads.find(s => s.id === id) || allSpreads[0];
    renderSlots();
    resetDraw();
  }

  function renderSlots() {
    board.innerHTML = "";
    const rect = board.getBoundingClientRect();
    currentSpread.positions.forEach((pos, i) => {
      const el = document.createElement("div");
      el.className = "slot";
      el.dataset.index = i;
      el.style.left = (pos.x * rect.width - 65) + "px";
      el.style.top = (pos.y * rect.height - 110) + "px";
      if (pos.rotation) el.style.transform = `rotate(${pos.rotation}deg)`;
      const lab = document.createElement("div");
      lab.className = "slot-label";
      lab.textContent = pos.label;
      el.appendChild(lab);
      board.appendChild(el);
    });
  }

  function resetDraw() {
    placed = [];
    cardEls.forEach(c => c.remove());
    cardEls = [];
    clearPileOverlay();
    deckQueue = shuffle(window.TAROT_DECK).slice(0, currentSpread.positions.length + 6);
    renderPile();
    renderReading();
    runShuffleThenCut();
  }

  function clearPileOverlay() {
    const old = deckPile.querySelector(".pile-overlay");
    if (old) old.remove();
  }

  function showPileOverlay({ label, sub, buttonText, onButton }) {
    clearPileOverlay();
    const ov = document.createElement("div");
    ov.className = "pile-overlay";
    ov.innerHTML = `
      <div class="stage-label">${label}</div>
      <div class="stage-sub">${sub}</div>
      ${buttonText ? `<button>${buttonText}</button>` : ""}
    `;
    if (buttonText) ov.querySelector("button").addEventListener("click", onButton);
    deckPile.appendChild(ov);
    return ov;
  }

  async function runShuffleThenCut() {
    showPileOverlay({ label: "SHUFFLING", sub: "心里默想你的问题，让牌组在掌心翻动几次。" });
    await animateShuffle();
    await new Promise(r => setTimeout(r, 200));
    await runCutStep();
    clearPileOverlay();
  }

  function animateShuffle() {
    return new Promise(resolve => {
      cardEls.forEach(c => c.classList.add("shuffling"));
      const pileRect = deckPile.getBoundingClientRect();
      const cx = pileRect.left + pileRect.width / 2;
      const cy = pileRect.top + pileRect.height / 2;
      let pass = 0;
      const total = 3;
      const step = () => {
        if (pass >= total) {
          // restack
          cardEls.forEach((el, i) => {
            const offset = (i - cardEls.length / 2) * 1.5;
            el.style.left = (cx - 65 + offset) + "px";
            el.style.top  = (cy - 110 - i * 0.5) + "px";
            el.style.transform = `rotate(${offset * 0.4}deg)`;
            el.style.zIndex = 10 + i;
          });
          setTimeout(() => {
            cardEls.forEach(c => c.classList.remove("shuffling"));
            resolve();
          }, 500);
          return;
        }
        // fan / scatter
        cardEls.forEach((el, i) => {
          const angle = (Math.random() - 0.5) * Math.PI;
          const r = 60 + Math.random() * 70;
          el.style.left = (cx - 65 + Math.cos(angle) * r) + "px";
          el.style.top  = (cy - 110 + Math.sin(angle) * r * 0.4) + "px";
          el.style.transform = `rotate(${(Math.random() - 0.5) * 30}deg)`;
          el.style.zIndex = 10 + Math.floor(Math.random() * cardEls.length);
        });
        pass++;
        setTimeout(step, 480);
      };
      step();
    });
  }

  function runCutStep() {
    return new Promise(resolve => {
      let onClick;
      const finish = () => {
        deckPile.removeEventListener("click", onClick);
        resolve();
      };
      showPileOverlay({
        label: "CUT THE DECK",
        sub: "在牌堆任一位置点一下来切牌；或跳过。",
        buttonText: "跳过切牌",
        onButton: finish,
      });
      onClick = e => {
        if (e.target.closest("button")) return;
        const r = deckPile.getBoundingClientRect();
        const ratio = (e.clientY - r.top) / r.height;
        const cutAt = Math.max(1, Math.min(deckQueue.length - 1, Math.round(deckQueue.length * ratio)));
        deckQueue = [...deckQueue.slice(cutAt), ...deckQueue.slice(0, cutAt)];
        deckPile.removeEventListener("click", onClick);
        animateCut(cutAt).then(resolve);
      };
      deckPile.addEventListener("click", onClick);
    });
  }

  function animateCut(cutAt) {
    return new Promise(resolve => {
      const pileRect = deckPile.getBoundingClientRect();
      const cx = pileRect.left + pileRect.width / 2;
      const cy = pileRect.top + pileRect.height / 2;
      cardEls.forEach((el, i) => {
        el.classList.add("shuffling");
        if (i >= cutAt) {
          el.style.left = (cx - 65 + 90) + "px";
          el.style.transform = "rotate(8deg)";
        } else {
          el.style.left = (cx - 65 - 90) + "px";
          el.style.transform = "rotate(-8deg)";
        }
      });
      setTimeout(() => {
        // restack in new order
        const newOrder = [...cardEls.slice(cutAt), ...cardEls.slice(0, cutAt)];
        cardEls = newOrder;
        cardEls.forEach((el, i) => {
          const offset = (i - cardEls.length / 2) * 1.5;
          el.style.left = (cx - 65 + offset) + "px";
          el.style.top  = (cy - 110 - i * 0.5) + "px";
          el.style.transform = `rotate(${offset * 0.4}deg)`;
          el.style.zIndex = 10 + i;
        });
        setTimeout(() => {
          cardEls.forEach(c => c.classList.remove("shuffling"));
          resolve();
        }, 500);
      }, 500);
    });
  }

  function renderPile() {
    const pileRect = deckPile.getBoundingClientRect();
    const cx = pileRect.left + pileRect.width / 2;
    const cy = pileRect.top + pileRect.height / 2;
    deckQueue.forEach((card, i) => {
      if (cardEls.find(e => e._cardId === card.id)) return;
      const el = makeCardEl(card);
      el._cardId = card.id;
      const offset = (i - deckQueue.length / 2) * 1.5;
      el.style.left = (cx - 65 + offset) + "px";
      el.style.top  = (cy - 110 - i * 0.5) + "px";
      el.style.transform = `rotate(${offset * 0.4}deg)`;
      el.style.zIndex = 10 + i;
      cardEls.push(el);
      document.body.appendChild(el);
    });
  }

  function makeCardEl(card) {
    const el = document.createElement("div");
    el.className = "card";
    const deckId = document.body.dataset.deck || "prism-color";
    const imgUrl = `decks/${deckId}/${card.id}.jpg`;
    el.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back"></div>
        <div class="card-face card-front">
          <img class="card-img" src="${imgUrl}" alt="${card.cn}" onerror="this.remove()">
          <div class="card-num">${card.num}</div>
          <div class="card-art">${card.glyph || "✦"}</div>
          <div class="card-name">${card.cn}<br><span style="font-size:9px;opacity:0.7">${card.name}</span></div>
        </div>
      </div>
    `;
    // 鼠标拖拽
    el.addEventListener("pointerdown", e => {
      if (el.classList.contains("placed")) return;
      e.preventDefault();
      startDrag(el, e.clientX, e.clientY);
    });
    return el;
  }

  function startDrag(el, x, y) {
    if (drag) return;
    const rect = el.getBoundingClientRect();
    drag = {
      el,
      offsetX: x - rect.left,
      offsetY: y - rect.top,
      card: deckQueue.find(c => c.id === el._cardId),
      reversed: Math.random() < 0.35,
    };
    el.classList.add("dragging");
    moveDrag(x, y);
  }

  function moveDrag(x, y) {
    if (!drag) return;
    drag.el.style.left = (x - drag.offsetX) + "px";
    drag.el.style.top  = (y - drag.offsetY) + "px";
    drag.el.style.transform = "rotate(0deg)";
    // 高亮最近 slot
    const slot = nearestSlot(x, y);
    document.querySelectorAll(".slot").forEach(s => s.classList.toggle("target", s === slot));
  }

  function endDrag(x, y) {
    if (!drag) return;
    const slot = nearestSlot(x, y);
    if (slot && !slot.classList.contains("filled")) {
      placeIntoSlot(drag, slot);
    } else {
      // 弹回牌堆
      drag.el.classList.remove("dragging");
      renderPile();
    }
    document.querySelectorAll(".slot").forEach(s => s.classList.remove("target"));
    drag = null;
  }

  function nearestSlot(x, y) {
    const slots = [...document.querySelectorAll(".slot:not(.filled)")];
    let best = null, bestD = 140;
    for (const s of slots) {
      const r = s.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }

  function placeIntoSlot(d, slot) {
    const r = slot.getBoundingClientRect();
    const idx = parseInt(slot.dataset.index);
    d.el.classList.remove("dragging");
    d.el.classList.add("placed");
    d.el.style.left = r.left + "px";
    d.el.style.top  = r.top  + "px";
    const rot = currentSpread.positions[idx].rotation || 0;
    d.el.style.transform = `rotate(${rot}deg)`;
    setTimeout(() => {
      d.el.classList.add("flipped");
      if (d.reversed) d.el.classList.add("reversed");
    }, 240);
    slot.classList.add("filled");
    // 从牌堆队列移除
    deckQueue = deckQueue.filter(c => c.id !== d.card.id);
    placed[idx] = { card: d.card, reversed: d.reversed };
    if (placed.filter(Boolean).length === currentSpread.positions.length) {
      setTimeout(renderReading, 900);
    }
  }

  function renderReading() {
    if (!placed.length || placed.filter(Boolean).length < currentSpread.positions.length) {
      readingEl.innerHTML = `<p class="reading-empty">摆完所有位置后，这里会给你一段酒友风的串讲。</p>
        <p class="reading-empty">当前进度：${placed.filter(Boolean).length} / ${currentSpread.positions.length}</p>`;
      return;
    }
    const drawn = placed.filter(Boolean);
    const result = window.generateReading(currentSpread, drawn);
    let html = `<p style="opacity:0.7;font-size:12px;">${currentSpread.description}</p>`;
    for (const line of result.lines) {
      html += `
        <div style="margin-bottom:14px;">
          <span class="pos-label">${line.label}</span>
          <span class="pos-card">${line.cardLabel}</span>
          <p style="margin-top:4px;">${line.body}</p>
        </div>`;
    }
    if (result.narrative) {
      html += `<div class="narrative">${result.narrative.replace(/\n/g, "<br>")}</div>`;
    }
    readingEl.innerHTML = html;
  }

  // ----- 鼠标事件 -----
  window.addEventListener("pointermove", e => moveDrag(e.clientX, e.clientY));
  window.addEventListener("pointerup",   e => endDrag(e.clientX, e.clientY));

  // ----- 控件事件 -----
  deckSelect.addEventListener("change", e => setDeck(e.target.value));
  spreadSelect.addEventListener("change", e => loadSpread(e.target.value));
  resetBtn.addEventListener("click", () => resetDraw());

  spreadImport.addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const data = JSON.parse(txt);
      if (!data.id || !Array.isArray(data.positions)) throw new Error("缺少 id 或 positions");
      // 去重并加入
      allSpreads = allSpreads.filter(s => s.id !== data.id);
      allSpreads.push(data);
      // 添加到下拉
      const opt = document.createElement("option");
      opt.value = data.id;
      opt.textContent = (data.name || data.id) + " *";
      spreadSelect.appendChild(opt);
      spreadSelect.value = data.id;
      loadSpread(data.id);
    } catch (err) {
      alert("牌阵 JSON 解析失败：" + err.message);
    }
  });

  // ----- 手势事件 -----
  handToggle.addEventListener("change", async e => {
    if (e.target.checked) {
      handOverlay.hidden = false;
      cursorEl.hidden = false;
      tracker = new window.HandTracker({
        video: handVideo,
        canvas: handCanvas,
        statusEl: handStatus,
        onFrame: handleHandFrame,
      });
      try { await tracker.start(); }
      catch (err) {
        handToggle.checked = false;
        handOverlay.hidden = true;
        cursorEl.hidden = true;
      }
    } else {
      if (tracker) tracker.stop();
      tracker = null;
      handOverlay.hidden = true;
      cursorEl.hidden = true;
      lastHand = null;
    }
  });

  function handleHandFrame(frame) {
    if (!frame) {
      cursorEl.classList.remove("grabbing");
      if (drag) endDrag(window._lastHandX || 0, window._lastHandY || 0);
      return;
    }
    const x = frame.x * window.innerWidth;
    const y = frame.y * window.innerHeight;
    window._lastHandX = x; window._lastHandY = y;
    cursorEl.style.left = x + "px";
    cursorEl.style.top  = y + "px";
    cursorEl.classList.toggle("grabbing", frame.isGrabbing);

    // 状态机：从未抓 → 抓住，找最近的牌堆顶牌开始拖
    const wasGrabbing = lastHand && lastHand.isGrabbing;
    if (!wasGrabbing && frame.isGrabbing) {
      const target = findCardUnder(x, y) || topPileCard();
      if (target) startDrag(target, x, y);
    } else if (wasGrabbing && frame.isGrabbing) {
      moveDrag(x, y);
    } else if (wasGrabbing && !frame.isGrabbing) {
      endDrag(x, y);
    }
    lastHand = frame;
  }

  function findCardUnder(x, y) {
    for (let i = cardEls.length - 1; i >= 0; i--) {
      const el = cardEls[i];
      if (el.classList.contains("placed")) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 20 && y <= r.bottom + 20) return el;
    }
    return null;
  }
  function topPileCard() {
    for (let i = cardEls.length - 1; i >= 0; i--) {
      if (!cardEls[i].classList.contains("placed")) return cardEls[i];
    }
    return null;
  }

  // ----- 启动 -----
  setDeck("prism-color");
  loadSpread("three-card");
  window.addEventListener("resize", () => {
    renderSlots();
    // 重新对齐已放置的牌
    placed.forEach((p, i) => {
      if (!p) return;
      const slot = document.querySelector(`.slot[data-index="${i}"]`);
      if (!slot) return;
      const r = slot.getBoundingClientRect();
      const el = cardEls.find(e => e._cardId === p.card.id);
      if (el) { el.style.left = r.left + "px"; el.style.top = r.top + "px"; }
    });
  });

  // ----- 星空背景 -----
  const starCanvas = document.getElementById("starfield");
  const sctx = starCanvas.getContext("2d");
  function fitStar() { starCanvas.width = innerWidth; starCanvas.height = innerHeight; }
  fitStar();
  window.addEventListener("resize", fitStar);
  const stars = Array.from({ length: 220 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.4 + 0.2,
    a: Math.random(),
    s: Math.random() * 0.005 + 0.001,
  }));
  function drawStars() {
    sctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
    for (const s of stars) {
      s.a += s.s; if (s.a > 1 || s.a < 0) s.s *= -1;
      sctx.beginPath();
      sctx.arc(s.x * starCanvas.width, s.y * starCanvas.height, s.r, 0, Math.PI * 2);
      sctx.fillStyle = `rgba(244,236,216,${Math.abs(s.a) * 0.85})`;
      sctx.fill();
    }
    requestAnimationFrame(drawStars);
  }
  drawStars();
})();
