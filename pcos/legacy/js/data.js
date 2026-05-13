/* ============================================================
   data.js · 本地状态 + 模拟数据
   说明：所有数据放在 localStorage("cyster_state")，无后端依赖。
   未来接入 API 时，仅替换 Store.fetch* 即可。
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'cyster_state_v1';
  const TODAY = new Date();

  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
  }

  /* --------------------- 默认状态 --------------------- */
  function buildDefault() {
    const r = rng(20260505);
    const oneYear = 365;
    const start = new Date(TODAY); start.setDate(start.getDate() - oneYear + 1);
    const days = [];
    for (let i = 0; i < oneYear; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const weekday = d.getDay();
      let level = 0;
      const x = r();
      if (x > 0.78) level = 4;
      else if (x > 0.6) level = 3;
      else if (x > 0.38) level = 2;
      else if (x > 0.18) level = 1;
      // 周末活动多一点
      if (weekday === 0 || weekday === 6) level = Math.min(4, level + (r() > 0.5 ? 1 : 0));
      days.push({
        date: d.toISOString().slice(0, 10),
        level,
        actions: level ? sampleActions(r, level) : []
      });
    }

    return {
      user: {
        name: 'Monika',
        handle: '@justmonikangel',
        avatar: 'M',
        cycleDay: 14,
        sinceDays: 214,
        phenotype: 'IR-leaning',
        city: '上海'
      },
      activity: days,
      feed: [
        { who: 'Dr. Lin', role: 'dr', when: '12 分钟前',
          body: '@Monika 你这次的 SHBG 上来了，说明肝代谢改善。下次复诊我们重点看 AMH。' },
        { who: '营养师 Yuki', role: 'dr', when: '今早 08:42',
          body: '本周低 GI 食谱已更新：加了核桃 / 鹰嘴豆，抗炎效果更好。' },
        { who: 'Cyster Agent', role: 'agent', when: '昨天 23:10',
          body: '夜间 HRV 下降 11%，建议明早改为 Z2 有氧；已自动调整训练计划。' },
        { who: 'Lily', role: '', when: '昨天 19:05',
          body: '终于第一次摸到 HOMA-IR 进入 1 字头！谢谢这里的姐妹们 🌷' },
        { who: 'Wynn', role: '', when: '前天',
          body: '请问大家有人在用螺内酯吗？想问问副作用经验。' }
      ],
      doctors: buildDoctors(),
      messages: { welcome: buildWelcomeMessages(), 'newly-dx': buildNewlyDx() },
      timeline: buildTimeline()
    };
  }

  function sampleActions(r, level) {
    const pool = ['🥗 低 GI 餐', '🏋️ 抗阻', '🚶 步行', '🧘 瑜伽', '💊 补剂', '📓 情绪日记', '🩸 周期记录', '🤝 社区互助'];
    const out = [];
    for (let i = 0; i < level + 1; i++) {
      out.push(pool[Math.floor(r() * pool.length)]);
    }
    return Array.from(new Set(out));
  }

  function buildDoctors() {
    return [
      { id: 1, name: 'Dr. 林婉', avatar: '林', spec: '妇科内分泌', hospital: '北京协和医院',
        title: '副主任医师', tags: ['PCOS', '胰岛素抵抗', '高雄激素'], modes: ['视频','图文'],
        years: 12, rating: 4.9, reviews: 1284, price: 199, insurance: true, verified: true },
      { id: 2, name: 'Dr. 周南希', avatar: '周', spec: '生殖医学', hospital: '上海仁济医院',
        title: '主治医师', tags: ['备孕', '促排卵', 'AMH'], modes: ['视频','线下'],
        years: 9, rating: 4.8, reviews: 902, price: 299, insurance: true, verified: true },
      { id: 3, name: 'Dr. 林若曦', avatar: '若', spec: '内分泌', hospital: '中山大学附属第一医院',
        title: '主任医师', tags: ['代谢综合征', '甲状腺'], modes: ['视频','图文','线下'],
        years: 18, rating: 4.95, reviews: 2117, price: 399, insurance: true, verified: true },
      { id: 4, name: '营养师 Yuki', avatar: '营', spec: '营养科', hospital: '注册营养师 (RD)',
        title: 'PCOS 营养咨询', tags: ['低 GI', '抗炎饮食', '体重管理'], modes: ['视频','图文'],
        years: 7, rating: 4.85, reviews: 643, price: 159, insurance: false, verified: true },
      { id: 5, name: 'Dr. 安宁', avatar: '安', spec: '皮肤科', hospital: '华西医院',
        title: '主治医师', tags: ['痤疮', '雄激素脱发', '黑棘皮'], modes: ['视频','图文','线下'],
        years: 11, rating: 4.7, reviews: 488, price: 189, insurance: true, verified: true },
      { id: 6, name: '心理师 Anna', avatar: '心', spec: '心理', hospital: 'CBT 治疗师',
        title: '认证心理咨询师', tags: ['CBT', '焦虑', '身体意象'], modes: ['视频','图文'],
        years: 6, rating: 4.92, reviews: 311, price: 299, insurance: false, verified: true }
    ];
  }

  function buildWelcomeMessages() {
    return [
      { who: 'Cyster Agent', role: 'agent', body: '欢迎加入 Cyster Sisters 💗 我们是一个专为 PCOS / 多囊姐妹搭建的互助社区。',
        ts: '今天 09:00', reactions: ['💗 42','🌸 18'] },
      { who: 'Cyster Agent', role: 'agent', body: '请阅读 #公约 ，并在下方介绍一下自己 (确诊年份 / 主要表型 / 你想从这里得到什么)。',
        ts: '今天 09:00' },
      { who: 'Lily', role: '', body: '大家好，我 28 岁，2022 年确诊 PCOS，主要是月经不规律和情绪问题，希望找到训练和饮食上的搭子！',
        ts: '今天 09:34', reactions: ['🤝 12','💗 7'] },
      { who: 'Mavis', role: '', body: '+1 求 cycle buddy 一起打卡！', ts: '今天 09:38' },
      { who: 'Dr. Lin', role: 'dr', body: '@Lily 欢迎～月经不规律和体重相关性比较大，建议先去 #新确诊 看那份入门 PDF。',
        ts: '今天 09:51', reactions: ['👍 21'] },
      { who: '系统', role: 'system', body: '— 12 位姐妹今日新加入 —', ts: '' },
      { who: 'Anna 🌷', role: '', body: '想问问大家：螺内酯会不会让头发先掉再长？我刚吃 2 周……',
        ts: '今天 10:20' },
      { who: '营养师 Yuki', role: 'dr', body: '会的，叫做 shedding，一般 8–12 周缓解。这段时间记得补充铁、生物素和优质蛋白。',
        ts: '今天 10:24', reactions: ['🙏 9','💪 4'] },
      { who: 'Cyster Agent', role: 'agent', body: '已为 @Anna 🌷 自动整理一份「螺内酯启动 90 天」追踪模板，发到你的私信啦。',
        ts: '今天 10:25' }
    ];
  }

  function buildNewlyDx() {
    return [
      { who: 'Dr. Lin', role: 'dr', body: '本频道置顶：《PCOS 入门 30 问 v3》和《如何看懂自己的化验单》。',
        ts: '昨天', reactions: ['📌 30'] },
      { who: 'Tina', role: '', body: '上周刚确诊，请问 LH/FSH 2.6 严重吗？医生让我先减重 5kg。', ts: '今天 11:02' },
      { who: 'Cyster Agent', role: 'agent', body: '/解读 LH/FSH 2.6 偏高，是 PCOS 常见特征之一，并不直接代表严重。结合你的胰岛素和 AMH 才能完整评估，需要的话发给我 ✨',
        ts: '今天 11:03', reactions: ['🙏 8'] }
    ];
  }

  function buildTimeline() {
    return [
      { date: '2025-04-28', text: '完成 Phase 2 第 3 周 · HOMA-IR 1.9 (↓ 0.4)' },
      { date: '2025-04-15', text: '开始服用肌醇 4g / 天 (Dr. Lin 处方)' },
      { date: '2025-03-30', text: '上传第 11 期化验单，AMH 7.1 → 6.8' },
      { date: '2025-02-28', text: '🎉 周期连续规律 3 个月' },
      { date: '2025-02-02', text: '加入「低 GI 厨房」频道，连击 30 天' },
      { date: '2024-12-04', text: '🎉 首次 HOMA-IR < 2' },
      { date: '2024-10-12', text: '完成 30 天连续记录' },
      { date: '2024-09-12', text: '🌱 注册 Cyster · 上传第一份报告' }
    ];
  }

  /* --------------------- Store --------------------- */
  const Store = {
    state: null,
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        this.state = raw ? JSON.parse(raw) : buildDefault();
      } catch (_) { this.state = buildDefault(); }
      return this.state;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (_) {} },
    reset() { this.state = buildDefault(); this.save(); return this.state; },
    pushFeed(item) { this.state.feed.unshift(item); this.save(); },
    pushMessage(channel, msg) {
      const list = this.state.messages[channel] || (this.state.messages[channel] = []);
      list.push(msg);
      this.save();
    },
    addActivity(level, action) {
      const today = new Date().toISOString().slice(0, 10);
      const cells = this.state.activity;
      const last = cells[cells.length - 1];
      if (last.date === today) {
        last.level = Math.max(last.level, level);
        last.actions = Array.from(new Set([...(last.actions||[]), action]));
      } else {
        cells.push({ date: today, level, actions: [action] });
      }
      this.save();
    }
  };

  global.CY_DATA = { Store, buildDefault };
})(window);
