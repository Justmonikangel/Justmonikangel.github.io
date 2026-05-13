/* app.js · SPA 路由 + 视图渲染 */
(function () {
  'use strict';
  const { Store } = window.CY_DATA;
  const { lineChart, radarChart, drawSilhouette } = window.CY_CHART;
  const { ask, appendBubble } = window.CY_AGENT;

  Store.load();
  initTheme();
  bindRail();
  bindAgentDock();
  hydrateMe();
  routeFrom(location.hash);
  window.addEventListener('hashchange', () => routeFrom(location.hash));

  /* ============ Routing ============ */
  function routeFrom(hash) {
    const route = (hash || '#dashboard').replace('#', '').split('?')[0] || 'dashboard';
    document.querySelectorAll('.rail-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
    const view = document.getElementById('view');
    const tpl = document.getElementById('tpl-' + route);
    view.innerHTML = '';
    if (!tpl) { view.textContent = '页面不存在'; return; }
    view.appendChild(tpl.content.cloneNode(true));
    renderSidebar(route);
    const fn = renderers[route];
    if (fn) fn();
    // catch route-go buttons
    view.querySelectorAll('[data-route-go]').forEach(b => {
      b.addEventListener('click', () => location.hash = '#' + b.dataset.routeGo);
    });
  }

  /* ============ Sidebar (changes per route) ============ */
  function renderSidebar(route) {
    const titles = {
      dashboard: ['主页', '今日概览'],
      upload: ['上传分析', '数据 / 拍照'],
      report: ['健康报告', '历次解读'],
      therapy: ['个性化方案', 'Phase 2 · Wk 3'],
      community: ['Cyster Sisters', '14,283 成员'],
      doctors: ['医师中心', '认证 · 已脱敏'],
      agent: ['Cyster Agent', '24/7 在线'],
      profile: ['个人主页', '@justmonikangel']
    };
    const [t, s] = titles[route] || ['Cyster', 'PCOS 智能咨询'];
    document.getElementById('sidebarTitle').textContent = t;
    document.getElementById('sidebarSub').textContent = s;
    const body = document.getElementById('sidebarBody');
    body.innerHTML = '';

    if (route === 'dashboard' || route === 'profile') {
      body.innerHTML = `
        <div class="side-cat">导航</div>
        <a class="side-link active" href="#dashboard">${ico('home')}主页 概览</a>
        <a class="side-link" href="#report">${ico('rpt')}最新报告 <span class="side-badge">新</span></a>
        <a class="side-link" href="#therapy">${ico('plan')}本周方案</a>
        <a class="side-link" href="#profile">${ico('me')}我的足迹</a>
        <div class="side-cat">追踪</div>
        <a class="side-link" href="#upload">${ico('add')}今日打卡</a>
        <a class="side-link" href="#agent">${ico('bot')}问 Agent</a>
        <div class="side-card">
          <h4>本周提醒</h4>
          <p>5 月 6 日 10:00 与 Dr. 林婉 视频复诊</p>
        </div>`;
    } else if (route === 'upload') {
      body.innerHTML = `
        <div class="side-cat">最近上传</div>
        <a class="side-link"><span>体检报告 · 4 月 28</span></a>
        <a class="side-link"><span>性激素六项 · 4 月 14</span></a>
        <a class="side-link"><span>形体三视图 · 4 月 14</span></a>
        <div class="side-cat">数据源</div>
        <a class="side-link"><span>Apple Health · 已连接</span></a>
        <a class="side-link"><span>华为运动健康</span></a>
        <a class="side-link"><span>Oura · 未连接</span></a>
        <a class="side-link"><span>Dexcom CGM</span></a>`;
    } else if (route === 'report') {
      body.innerHTML = `
        <div class="side-cat">历期报告</div>
        ${[12,11,10,9,8,7,6,5,4,3,2,1].map((n,i)=>`
          <a class="side-link ${i===0?'active':''}"><span>第 ${n} 期 · ${monthDate(i)}</span>${i===0?'<span class="side-badge">新</span>':''}</a>
        `).join('')}`;
    } else if (route === 'therapy') {
      body.innerHTML = `
        <div class="side-cat">阶段</div>
        <a class="side-link"><span>Phase 1 · 已完成</span></a>
        <a class="side-link active"><span>Phase 2 · 进行中</span></a>
        <a class="side-link"><span>Phase 3 · 未开始</span></a>
        <a class="side-link"><span>Phase 4 · 未开始</span></a>
        <div class="side-cat">维度</div>
        <a class="side-link">营养</a>
        <a class="side-link">训练</a>
        <a class="side-link">补剂</a>
        <a class="side-link">心理</a>`;
    } else if (route === 'community') {
      body.innerHTML = `
        <div class="side-cat">我的小组</div>
        <a class="side-link active">Cyster Sisters</a>
        <a class="side-link">上海姐妹会</a>
        <a class="side-link">备孕互助 (TTC)</a>
        <div class="side-cat">关注的话题</div>
        <a class="side-link">#螺内酯</a>
        <a class="side-link">#肌醇</a>
        <a class="side-link">#GLP-1</a>
        <a class="side-link">#基础体温</a>`;
    } else if (route === 'doctors') {
      body.innerHTML = `
        <div class="side-cat">已问诊</div>
        <a class="side-link">Dr. 林婉 · 协和</a>
        <a class="side-link">营养师 Yuki</a>
        <div class="side-cat">收藏</div>
        <a class="side-link">Dr. 周南希</a>
        <a class="side-link">心理师 Anna</a>
        <div class="side-card">
          <h4>预约提醒</h4>
          <p>5 月 6 日 10:00 视频复诊 · Dr. 林婉</p>
        </div>`;
    } else if (route === 'agent') {
      body.innerHTML = `
        <div class="side-cat">技能</div>
        <a class="side-link">报告解读</a>
        <a class="side-link">体型 / 食物识别</a>
        <a class="side-link">周期预测</a>
        <a class="side-link">疗法对比</a>
        <a class="side-link">文献检索</a>
        <a class="side-link">紧急转诊</a>
        <div class="side-cat">最近会话</div>
        <a class="side-link">5 月 3 日 · 解读化验单</a>
        <a class="side-link">4 月 30 日 · 训练改版</a>`;
    }
  }

  /* ============ Renderers ============ */
  const renderers = {
    dashboard,
    upload,
    report,
    therapy,
    community,
    doctors,
    agent: agentPage,
    profile
  };

  function dashboard() {
    document.getElementById('heroName').textContent = Store.state.user.name;
    document.getElementById('heroDays').textContent = Store.state.user.sinceDays;
    renderContrib('contrib', Store.state.activity);
    fillFeed();
    // body chart
    setTimeout(() => {
      lineChart(document.getElementById('bodyChart'),
        [
          { label: '体重 kg', data: [62.4,62.1,61.9,61.7,61.5,61.3,61.0], color: '#ff6b8a' },
          { label: '体脂 %', data: [29.1,28.7,28.4,28.0,27.6,27.2,26.8], color: '#2dbcb6' }
        ],
        { labels: ['W1','W2','W3','W4','W5','W6','W7'] });
      radarChart(document.getElementById('radarChart'),
        ['睾酮','LH/FSH','AMH','SHBG','胰岛素','炎症'],
        [62, 72, 80, 70, 84, 58], { max: 100 });
    }, 30);
  }

  function upload() {
    const dropCard = document.getElementById('dropCard');
    const drop = dropCard.querySelector('.drop');
    const list = document.getElementById('fileList');
    const input = document.getElementById('fileInput');
    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('over');
      [...e.dataTransfer.files].forEach(f => addFile(f, list));
    });
    input.addEventListener('change', e => [...e.target.files].forEach(f => addFile(f, list)));

    // photo slots
    const photoInput = document.getElementById('photoInput');
    let currentSlot = null;
    ['slotFront', 'slotSide', 'slotBack'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('click', () => { currentSlot = el; photoInput.click(); });
    });
    document.getElementById('capBtn').addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file || !currentSlot) return;
      const url = URL.createObjectURL(file);
      currentSlot.innerHTML = `<img src="${url}" alt="photo"/>`;
      currentSlot.classList.add('has');
    });
    document.getElementById('analyzeBtn').addEventListener('click', () => {
      const out = document.getElementById('analysisOut');
      out.innerHTML = '<p class="muted">AI 正在本地推理 ▸ 体型分类 / WHR / 体脂估算 / 痤疮检测…</p>';
      setTimeout(() => {
        out.innerHTML = `
          <div class="row"><span>体型分类</span><b>偏内分泌型 (Endo-leaning)</b></div>
          <div class="row"><span>腰臀比 (WHR)</span><b>0.77</b></div>
          <div class="row"><span>体脂率估算</span><b>26.8%</b></div>
          <div class="row"><span>对称性</span><b>97.4%</b></div>
          <div class="row"><span>面部痤疮</span><b>2 处 · 轻度</b></div>
          <div class="row"><span>建议</span><b>已写入 Phase 2 训练面板</b></div>`;
        Store.addActivity(2, '📷 形体分析');
      }, 1400);
    });

    document.getElementById('manualForm').addEventListener('submit', e => {
      e.preventDefault();
      Store.addActivity(3, '📝 手动录入');
      Store.pushFeed({ who: Store.state.user.name, role: '', when: '刚刚',
        body: '提交了新一期手动数据，等待 Agent 生成报告。' });
      alert('数据已提交，正在生成新报告，约 3 秒……');
      setTimeout(() => { location.hash = '#report'; }, 800);
    });
  }
  function addFile(file, list) {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>📄 ${file.name}</span>
      <span class="filemeta">${(file.size/1024).toFixed(1)} KB</span>
      <span class="progress"><i style="width:0%"></i></span>`;
    list.appendChild(li);
    const bar = li.querySelector('.progress i');
    let p = 0; const t = setInterval(() => {
      p = Math.min(100, p + 8 + Math.random() * 12);
      bar.style.width = p + '%';
      if (p >= 100) { clearInterval(t); li.querySelector('.progress').replaceWith(Object.assign(document.createElement('span'),{className:'badge ok',textContent:'已分析'})); }
    }, 90);
  }

  function report() {
    drawSilhouette(document.getElementById('silhouette'), { whr: 0.77, bf: 26.8 });
    // ring gradient
    const ring = document.getElementById('ringBar');
    const svg = ring.parentElement;
    if (!svg.querySelector('defs')) {
      svg.insertAdjacentHTML('afterbegin',
        `<defs><linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#2dbcb6"/><stop offset="1" stop-color="#ff6b8a"/>
        </linearGradient></defs>`);
    }
    const score = 82;
    document.getElementById('ringScore').textContent = score;
    ring.style.strokeDashoffset = 276 - 276 * score / 100;
    // agent readout (typing)
    const out = document.getElementById('agentReadout');
    out.innerHTML = '';
    const lines = [
      `<p>综合 23 项数据看，本期得分 <b>82</b>，比上期 <b>+6</b>。<span class="cite">Tehrani 2023</span></p>`,
      `<p>核心进步：胰岛素信号通路恢复 (HOMA-IR 1.9，3 期连续下降)；血脂结构开始改善 (TG 下降，HDL-C 略低需关注)。<span class="cite">Pundir 2022</span></p>`,
      `<p>仍需注意：游离睾酮 2.1 (轻度偏高)、SHBG 处于正常区间下沿。建议下一步：</p>`,
      `<p>① 维持肌醇 4g/天 + 维 D3 2000 IU；<br>② 每周 3 次抗阻 + 2 次 Z2；<br>③ 补充铁 + 锌 (饮食为主)；<br>④ 在 6 周后复查游离睾酮、SHBG、铁蛋白。<span class="cite">PCOS Guideline 2023</span></p>`
    ];
    typewriter(out, lines, 18);
  }

  function therapy() {
    const sim = {
      train: document.getElementById('simTrain'),
      diet: document.getElementById('simDiet'),
      sleep: document.getElementById('simSleep'),
      inositol: document.getElementById('simInositol')
    };
    const out = document.getElementById('simOut');
    function calc() {
      const t = +sim.train.value, d = +sim.diet.value, s = +sim.sleep.value, i = sim.inositol.checked;
      const homa = (2.1 - t * 0.08 - d * 0.005 - (s - 7) * 0.05 - (i ? 0.15 : 0)).toFixed(2);
      const test = Math.max(20, Math.round(58 - t * 0.8 - (i ? 4 : 0)));
      const bf = (27.5 - t * 0.18 - d * 0.02 - (i ? 0.1 : 0)).toFixed(1);
      const cycle = Math.max(28, Math.round(34 - t * 0.4 - d * 0.04 - (i ? 1 : 0)));
      out.innerHTML = `
        <div class="so"><b>${homa}</b><span>HOMA-IR (12 周)</span></div>
        <div class="so"><b>${test}</b><span>游离 T (ng/dL)</span></div>
        <div class="so"><b>${bf}%</b><span>体脂</span></div>
        <div class="so"><b>${cycle} 天</b><span>平均周期</span></div>`;
      document.getElementById('simTrainV').textContent = t;
      document.getElementById('simDietV').textContent = d + '%';
      document.getElementById('simSleepV').textContent = s + 'h';
    }
    Object.values(sim).forEach(el => el && el.addEventListener('input', calc));
    calc();
  }

  function community() {
    const messages = document.getElementById('messages');
    const composer = document.getElementById('composer');
    const input = document.getElementById('msgInput');
    const peerList = document.getElementById('peerList');
    let channel = 'welcome';

    function paint() {
      const list = Store.state.messages[channel] || [];
      messages.innerHTML = '';
      list.forEach(m => {
        if (m.role === 'system') {
          const d = document.createElement('div');
          d.className = 'msg system'; d.textContent = m.body; messages.appendChild(d); return;
        }
        const div = document.createElement('div');
        div.className = 'msg';
        div.innerHTML = `
          <div class="avatar ${m.role === 'dr' ? 'pro' : (m.role === 'agent' ? 'agent-ava' : '')}">${(m.who[0] || '·').toUpperCase()}</div>
          <div>
            <div class="who-line">
              <b>${m.who}</b>
              ${m.role === 'dr' ? '<span class="role dr">认证医师</span>' : ''}
              ${m.role === 'agent' ? '<span class="role agent">AI</span>' : ''}
              <span class="ts">${m.ts || ''}</span>
            </div>
            <div class="body">${m.body}</div>
            ${m.reactions ? `<div class="reactions">${m.reactions.map(r => `<span class="react">${r}</span>`).join('')}</div>` : ''}
          </div>`;
        messages.appendChild(div);
      });
      messages.scrollTop = messages.scrollHeight;
    }
    paint();

    document.querySelectorAll('.ch[data-channel]').forEach(li => {
      li.addEventListener('click', () => {
        document.querySelectorAll('.ch.active').forEach(x => x.classList.remove('active'));
        li.classList.add('active');
        channel = li.dataset.channel;
        document.getElementById('chTitle').textContent = li.textContent.trim();
        document.getElementById('chTopic').textContent = topicFor(channel);
        document.querySelector('.composer input').placeholder = `在 ${li.textContent.trim()} 中说点什么…`;
        if (!Store.state.messages[channel]) {
          Store.state.messages[channel] = [
            { who: 'Cyster Agent', role: 'agent', body: `欢迎来到 ${li.textContent.trim()}，需要的话随时 /agent 召唤我。`, ts: '现在' }
          ];
          Store.save();
        }
        paint();
      });
    });

    composer.addEventListener('submit', e => e.preventDefault());
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()) {
        const msg = { who: Store.state.user.name, role: '', body: input.value.trim(), ts: '刚刚' };
        Store.pushMessage(channel, msg);
        input.value = '';
        paint();
        // simulate someone replies
        setTimeout(() => {
          const replies = [
            { who: 'Lily', role: '', body: '抱抱，我也经历过 🌷' },
            { who: 'Dr. Lin', role: 'dr', body: '把上次报告发到 #medical-records ，我帮你看看。' },
            { who: 'Cyster Agent', role: 'agent', body: '我刚标记了你的关键词，把 3 篇相似经验帖整理在私信了。' }
          ];
          Store.pushMessage(channel, Object.assign(replies[Math.floor(Math.random() * replies.length)], { ts: '刚刚' }));
          paint();
        }, 1400);
      }
    });
    document.getElementById('askAgentInline').addEventListener('click', () => {
      input.value = '/agent ' + (input.value || '帮我看看本频道最近的趋势');
      input.focus();
    });

    // peers
    const peers = ['Lily','Mavis','Wynn','June','Soo','Tina','Mia','Yuna','Nora','Ivy','Zoe','Kira'];
    peerList.innerHTML = peers.map(n => `
      <li><div class="avatar">${n[0]}</div><div><b>${n}</b><span>Cycle Day ${1 + Math.floor(Math.random() * 28)}</span></div><span class="dot ${Math.random() > 0.4 ? 'online' : ''}"></span></li>
    `).join('');
  }

  function doctors() {
    const grid = document.getElementById('docGrid');
    function render(list) {
      grid.innerHTML = '';
      list.forEach(d => {
        const el = document.createElement('div');
        el.className = 'doc' + (d.verified ? ' verified' : '');
        el.innerHTML = `
          <div class="doc-head">
            <div class="avatar pro">${d.avatar}</div>
            <div>
              <h4>${d.name}</h4>
              <span>${d.title} · ${d.spec}</span>
            </div>
          </div>
          <div class="muted" style="font-size:12px">${d.hospital}</div>
          <div class="doc-tags">${d.tags.map(t => `<span class="doc-tag">${t}</span>`).join('')}</div>
          <div class="doc-stats">
            <span>从业 <b>${d.years}</b> 年</span>
            <span>评分 <b>${d.rating}</b></span>
            <span><b>${d.reviews}</b> 评价</span>
          </div>
          <div class="doc-foot">
            <div class="price"><b>¥${d.price}</b><span>/15 分钟</span></div>
            <button class="btn primary" data-doc="${d.id}">立即问诊</button>
          </div>`;
        grid.appendChild(el);
      });
      grid.querySelectorAll('button[data-doc]').forEach(b => {
        b.addEventListener('click', () => openBook(+b.dataset.doc));
      });
    }
    render(Store.state.doctors);

    function openBook(id) {
      const doc = Store.state.doctors.find(x => x.id === id);
      const m = document.getElementById('bookModal');
      document.getElementById('bookTitle').textContent = `预约 · ${doc.name}`;
      const slots = document.getElementById('slots');
      slots.innerHTML = '';
      const times = ['今晚 19:00','今晚 19:30','今晚 20:00','明早 09:00','明早 09:30','明早 10:00','明天 14:00','明天 14:30'];
      times.forEach((t, i) => {
        const s = document.createElement('button');
        s.type = 'button'; s.className = 'slot' + (i === 5 ? ' selected' : '') + (i === 1 ? ' disabled' : '');
        s.textContent = t;
        if (i !== 1) s.addEventListener('click', () => {
          slots.querySelectorAll('.slot').forEach(x => x.classList.remove('selected'));
          s.classList.add('selected');
        });
        slots.appendChild(s);
      });
      document.getElementById('bookConfirm').textContent = `确认预约 ¥${doc.price}`;
      m.setAttribute('aria-hidden', 'false');
    }
    document.getElementById('bookClose').addEventListener('click', () => {
      document.getElementById('bookModal').setAttribute('aria-hidden', 'true');
    });
    document.getElementById('bookConfirm').addEventListener('click', () => {
      document.getElementById('bookModal').setAttribute('aria-hidden', 'true');
      Store.pushFeed({ who: '系统', role: 'agent', when: '刚刚', body: '预约成功，会在 24 小时前提醒你。' });
      alert('预约成功 ✓ 我们会在 24h 前提醒你。');
    });

    // search
    function applyFilter() {
      const q = document.getElementById('docSearch').value.toLowerCase();
      const sp = document.getElementById('docSpec').value;
      const md = document.getElementById('docMode').value;
      const ins = document.getElementById('docInsurance').checked;
      const list = Store.state.doctors.filter(d =>
        (!q || (d.name + d.hospital + d.spec + d.tags.join('')).toLowerCase().includes(q)) &&
        (!sp || d.spec === sp) &&
        (!md || d.modes.includes(md)) &&
        (!ins || d.insurance)
      );
      render(list);
    }
    ['docSearch','docSpec','docMode','docInsurance'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('input', applyFilter);
      el.addEventListener('change', applyFilter);
    });
  }

  function agentPage() {
    const stream = document.getElementById('agentStream2');
    const form = document.getElementById('agentForm2');
    const input = document.getElementById('agentText2');
    appendBubble(stream, 'agent', '你好，我是 Cyster Agent。我知道你最近 30 天的所有数据，可以直接问，比如「我最近的胰岛素抵抗严重吗？」');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      input.value = '';
      ask(stream, v);
    });
    document.querySelectorAll('.quick .chip').forEach(c => {
      c.addEventListener('click', () => { input.value = c.dataset.prompt; input.focus(); });
    });
  }

  function profile() {
    document.getElementById('pAva').textContent = Store.state.user.avatar;
    // month grid (last 30 days)
    const grid = document.getElementById('monthGrid');
    grid.innerHTML = '';
    const last30 = Store.state.activity.slice(-30);
    last30.forEach(a => {
      const cell = document.createElement('div');
      cell.className = 'cell l' + a.level;
      cell.title = `${a.date}\n${(a.actions || []).join(', ') || '无记录'}`;
      cell.innerHTML = `${(+a.date.slice(8, 10))}${a.actions && a.actions.length ? `<span class="marks">·${a.actions.length}</span>` : ''}`;
      grid.appendChild(cell);
    });
    renderContrib('contribLg', Store.state.activity);
    // timeline
    const tl = document.getElementById('timeline');
    tl.innerHTML = Store.state.timeline.map(t => `
      <li><b>${t.text.split('·')[0]}</b><span class="when">${t.date}</span></li>
    `).join('');
  }

  /* ============ Helpers ============ */
  function renderContrib(id, days) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    let streak = 0, best = 0, total = 0, cur = 0;
    days.forEach(d => {
      const cell = document.createElement('div');
      cell.className = 'cell l' + d.level;
      cell.title = `${d.date} · ${(d.actions || []).join(', ') || '无'}`;
      el.appendChild(cell);
      if (d.level > 0) { total++; cur++; best = Math.max(best, cur); } else { cur = 0; }
    });
    streak = cur;
    if (document.getElementById('contribTotal')) {
      document.getElementById('contribTotal').textContent = total;
      document.getElementById('contribStreak').textContent = streak;
      document.getElementById('contribMax').textContent = best;
    }
  }

  function fillFeed() {
    const ul = document.getElementById('feed');
    if (!ul) return;
    ul.innerHTML = Store.state.feed.map(f => `
      <li>
        <div class="avatar ${f.role === 'dr' ? 'pro' : (f.role === 'agent' ? 'agent-ava' : '')}">${(f.who[0]||'·').toUpperCase()}</div>
        <div>
          <div><span class="who">${f.who}</span> <span class="when">· ${f.when}</span></div>
          <div class="body">${f.body}</div>
        </div>
      </li>`).join('');
  }

  function topicFor(c) {
    return ({
      welcome: '读公约 · 介绍自己 · 找到你的 cycle buddy',
      rules: '社区基本守则 · 隐私与举报',
      'newly-dx': '刚确诊？这里有入门 PDF 与 30 问',
      meds: '聊聊用药体验：肌醇 / 二甲双胍 / 螺内酯 / GLP-1',
      ttc: '备孕日记 · 排卵 · IVF 经验',
      mental: '情绪宣泄 · 心理师轮值',
      kitchen: '低 GI / 抗炎 / 食谱图鉴',
      gym: '抗阻训练 / 瑜伽 / 周期化训练',
      skin: '痤疮 / 多毛 / 脱发护理'
    })[c] || '';
  }

  /* ============ Rail / Theme / Agent panel ============ */
  function bindRail() {
    document.querySelectorAll('.rail-item[data-route]').forEach(el => {
      el.addEventListener('click', () => {
        // hashchange will handle
      });
    });
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('logoutBtn').addEventListener('click', () => {
      if (confirm('退出会清除本地演示数据吗？\n点击确定 = 重置 demo 数据')) {
        Store.reset(); routeFrom(location.hash);
      }
    });
  }
  function bindAgentDock() {
    const dock = document.getElementById('agentDock');
    const panel = document.getElementById('agentPanel');
    const close = document.getElementById('agentClose');
    const stream = document.getElementById('agentStream');
    const form = document.getElementById('agentForm');
    const input = document.getElementById('agentText');
    let warmed = false;
    dock.addEventListener('click', () => {
      panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false');
      if (!warmed) {
        appendBubble(stream, 'agent', '我是 Cyster Agent，可以帮你解读报告、规划饮食和训练、预约医师。试试下面的快捷指令？');
        warmed = true;
      }
    });
    close.addEventListener('click', () => { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.trim(); if (!v) return;
      input.value = '';
      ask(stream, v);
    });
    document.querySelectorAll('.agent-tools .chip').forEach(c => {
      c.addEventListener('click', () => { ask(stream, c.dataset.prompt); });
    });
  }
  function initTheme() {
    const stored = localStorage.getItem('cyster_theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cyster_theme', next);
  }
  function hydrateMe() {
    document.getElementById('meName').textContent = Store.state.user.name;
    document.getElementById('meAvatar').textContent = Store.state.user.avatar;
    document.getElementById('cycleDay').textContent = Store.state.user.cycleDay;
  }

  function ico(k) {
    const map = {
      home: '<svg viewBox="0 0 24 24"><path d="M3 12 12 3l9 9v9h-6v-6H9v6H3z"/></svg>',
      rpt: '<svg viewBox="0 0 24 24"><path d="M5 3h11l3 3v15H5z"/><path d="M8 11h8M8 15h6"/></svg>',
      plan: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h12"/></svg>',
      me: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 5-7 8-7s7 2 8 7"/></svg>',
      add: '<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></svg>',
      bot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="11" r="1.2" fill="currentColor"/><circle cx="15" cy="11" r="1.2" fill="currentColor"/></svg>'
    };
    return map[k] || '';
  }
  function monthDate(i) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
  }
  function typewriter(el, lines, speed) {
    let li = 0;
    function step() {
      if (li >= lines.length) return;
      const tmp = document.createElement('div');
      tmp.innerHTML = lines[li];
      el.appendChild(tmp);
      li++; setTimeout(step, speed * 18);
    }
    step();
  }
})();
