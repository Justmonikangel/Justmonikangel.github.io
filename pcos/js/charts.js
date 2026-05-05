/* charts.js · 轻量 canvas 图表（无外部依赖） */
(function (global) {
  'use strict';

  function dpr(canvas) {
    const r = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight || +canvas.getAttribute('height') || 160;
    canvas.width = w * r; canvas.height = h * r;
    const ctx = canvas.getContext('2d');
    ctx.scale(r, r);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function color(name) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return v ? v.trim() : '#000';
  }

  function lineChart(canvas, series, opts) {
    opts = opts || {};
    const { ctx, w, h } = dpr(canvas);
    const pad = { l: 30, r: 10, t: 14, b: 22 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    const all = series.flatMap(s => s.data);
    const min = opts.min !== undefined ? opts.min : Math.min(...all) * 0.92;
    const max = opts.max !== undefined ? opts.max : Math.max(...all) * 1.05;

    // grid
    ctx.strokeStyle = color('--line-2'); ctx.lineWidth = 1;
    ctx.fillStyle = color('--text-3'); ctx.font = '10px -apple-system, sans-serif';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + ch * i / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
      const v = max - (max - min) * i / 4;
      ctx.fillText(v.toFixed(1), 4, y + 3);
    }
    // labels
    if (opts.labels) {
      const step = Math.max(1, Math.ceil(opts.labels.length / 6));
      opts.labels.forEach((lab, i) => {
        if (i % step !== 0) return;
        const x = pad.l + cw * i / (opts.labels.length - 1);
        ctx.fillText(lab, x - 14, h - 6);
      });
    }
    // series
    series.forEach((s, idx) => {
      ctx.strokeStyle = s.color || (idx === 0 ? color('--primary') : color('--teal'));
      ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      s.data.forEach((v, i) => {
        const x = pad.l + cw * i / (s.data.length - 1);
        const y = pad.t + ch * (1 - (v - min) / (max - min));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      // fill
      ctx.lineTo(pad.l + cw, pad.t + ch);
      ctx.lineTo(pad.l, pad.t + ch);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
      grad.addColorStop(0, (s.color || color('--primary')) + '33');
      grad.addColorStop(1, (s.color || color('--primary')) + '00');
      ctx.fillStyle = grad;
      ctx.fill();
      // dots
      s.data.forEach((v, i) => {
        const x = pad.l + cw * i / (s.data.length - 1);
        const y = pad.t + ch * (1 - (v - min) / (max - min));
        ctx.fillStyle = s.color || color('--primary');
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      });
    });

    // legend
    if (opts.legend !== false) {
      let lx = pad.l;
      series.forEach((s, idx) => {
        const c = s.color || (idx === 0 ? color('--primary') : color('--teal'));
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(lx + 4, pad.t - 6, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color('--text-2');
        ctx.font = '11px -apple-system, sans-serif';
        ctx.fillText(s.label, lx + 12, pad.t - 3);
        lx += ctx.measureText(s.label).width + 26;
      });
    }
  }

  function radarChart(canvas, axes, values, opts) {
    opts = opts || {};
    const { ctx, w, h } = dpr(canvas);
    const cx = w / 2, cy = h / 2 + 4;
    const R = Math.min(w, h) / 2 - 24;
    const N = axes.length;

    // grid rings
    ctx.strokeStyle = color('--line-2');
    for (let r = 1; r <= 4; r++) {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = -Math.PI / 2 + Math.PI * 2 * i / N;
        const x = cx + Math.cos(a) * (R * r / 4);
        const y = cy + Math.sin(a) * (R * r / 4);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
    // axes
    ctx.strokeStyle = color('--line');
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + Math.PI * 2 * i / N;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.stroke();
    }
    // labels
    ctx.fillStyle = color('--text-2'); ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    axes.forEach((lab, i) => {
      const a = -Math.PI / 2 + Math.PI * 2 * i / N;
      const x = cx + Math.cos(a) * (R + 12);
      const y = cy + Math.sin(a) * (R + 12) + 4;
      ctx.fillText(lab, x, y);
    });
    ctx.textAlign = 'start';
    // value polygon
    const max = opts.max || 100;
    ctx.beginPath();
    values.forEach((v, i) => {
      const a = -Math.PI / 2 + Math.PI * 2 * i / N;
      const x = cx + Math.cos(a) * R * v / max;
      const y = cy + Math.sin(a) * R * v / max;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = color('--primary') + '33';
    ctx.strokeStyle = color('--primary');
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    // dots
    values.forEach((v, i) => {
      const a = -Math.PI / 2 + Math.PI * 2 * i / N;
      const x = cx + Math.cos(a) * R * v / max;
      const y = cy + Math.sin(a) * R * v / max;
      ctx.fillStyle = color('--primary');
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  /* 简单 SVG 体型剪影：根据腰臀比绘制 */
  function drawSilhouette(svgEl, params) {
    const { whr = 0.78, bf = 26, mass = 60 } = params || {};
    // 用三角控制点画一个 "葫芦" 剪影
    const shoulder = 28 + (1 - bf / 50) * 10;
    const waist = shoulder * (whr - 0.05);
    const hip = shoulder * 1.05 + (whr < 0.8 ? 4 : 0);
    const path = `
      M60,12
      C72,12 78,22 78,30
      L${60 + shoulder},58
      Q${60 + shoulder + 4},80 ${60 + waist + 6},110
      Q${60 + waist},135 ${60 + hip},170
      Q${60 + hip - 6},220 ${60 + 6},230
      L${60 - 6},230
      Q${60 - hip + 6},220 ${60 - hip},170
      Q${60 - waist},135 ${60 - waist - 6},110
      Q${60 - shoulder - 4},80 ${60 - shoulder},58
      L42,30
      C42,22 48,12 60,12 Z
    `;
    svgEl.innerHTML = `
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd4dd"/>
          <stop offset="1" stop-color="#d4f5f1"/>
        </linearGradient>
      </defs>
      <path d="${path}" fill="url(#bodyGrad)" stroke="#ff6b8a" stroke-width="1.2" stroke-linejoin="round"/>
      <line x1="${60 - waist}" y1="110" x2="${60 + waist}" y2="110" stroke="#ff6b8a" stroke-dasharray="3 3"/>
      <text x="${60 + waist + 6}" y="113" font-size="9" fill="#5a5667">腰</text>
      <line x1="${60 - hip}" y1="170" x2="${60 + hip}" y2="170" stroke="#2dbcb6" stroke-dasharray="3 3"/>
      <text x="${60 + hip + 6}" y="173" font-size="9" fill="#5a5667">臀</text>
    `;
  }

  global.CY_CHART = { lineChart, radarChart, drawSilhouette };
})(window);
