/* agent.js · 模拟 AI Agent 推理流（前端 demo）
   - 关键词路由 → 工具调用 → 流式回复
   - 真实接入：把 stream() 替换成 fetch 流式 API（如 Anthropic / OpenAI）
*/
(function (global) {
  'use strict';

  const TOOLS = {
    parseReport: '🔍 工具调用 · 解析最近的化验单',
    radar: '📊 工具调用 · 提取激素六维',
    bodyCV: '📷 工具调用 · 形体识别 (Vision)',
    diet: '🥗 工具调用 · 食物识别 + 营养计算',
    cycle: '📅 工具调用 · 周期 / 排卵预测',
    pubmed: '📚 工具调用 · 文献检索 (PubMed)',
    refer: '🤝 工具调用 · 检索认证医师',
    plan: '🧠 工具调用 · 重新规划训练 / 饮食'
  };

  const RULES = [
    {
      match: /(报告|解读|化验|指标)/,
      tools: [TOOLS.parseReport, TOOLS.radar, TOOLS.pubmed],
      reply: () => [
        '我读了你 5 月 3 日上传的化验单，对照前一期 (3 月 12 日) 的变化是这样：',
        '• HOMA-IR：2.3 → **1.9** (↓ 17%)，已经回到正常区间。',
        '• 游离睾酮：2.4 → **2.1**，仍轻度偏高，但趋势正确。',
        '• LH/FSH：2.6 → **2.3**，向 2.0 靠近。',
        '• AMH：7.1 → **6.8**，仍接近上限，这是 PCOS 的典型表现，不必焦虑。',
        '建议：继续肌醇 4g/天，保持抗阻训练 ≥ 3 次/周；下次复诊重点看游离睾酮和 SHBG。',
        '参考：Tehrani 2023; Pundir 2022 (已加入引用)'
      ]
    },
    {
      match: /(训练|运动|健身|hiit|抗阻)/i,
      tools: [TOOLS.bodyCV, TOOLS.plan],
      reply: () => [
        '基于你最近的形体数据 (WHR 0.77, 体脂 26.8%) 和周期 D14：',
        '本周建议：抗阻 3 次 (下肢 / 上肢 / 全身)，Z2 有氧 2 次，瑜伽 1 次。',
        '排卵后再加 1 次 HIIT 20 分钟。已为你写入 #therapy 训练面板。',
        '注意：经前一周降低强度 30%，避免皮质醇升高。'
      ]
    },
    {
      match: /(饮食|食物|餐|外卖|菜单|gi)/i,
      tools: [TOOLS.diet],
      reply: () => [
        '今日推荐 (低 GI · 抗炎):',
        '🌱 早：希腊酸奶 200g + 奇亚籽 1 勺 + 蓝莓',
        '🍱 午：三文鱼 120g + 藜麦 80g (生重) + 西兰花',
        '🥗 晚：鸡胸 100g + 烤红薯 1/2 + 牛油果 1/4',
        '加餐：核桃 6 颗 (经前可换为 70% 黑巧 20g)',
        '总热量 ≈ 1680 kcal · 蛋白 110g · 碳水 165g · 脂肪 67g'
      ]
    },
    {
      match: /(月经|周期|排卵|怀孕|备孕|ttc)/i,
      tools: [TOOLS.cycle],
      reply: () => [
        '基于过去 6 个月的体温 / LH 试纸 / HRV：',
        '下次月经预计：**5 月 14 日 ± 2 天**',
        '排卵窗口：**5 月 11–13 日** (置信度 78%)',
        '当前 D14，处于黄体生成前 1 天，建议今晚增加蛋白质 + Omega-3，并保持 7h 以上睡眠。'
      ]
    },
    {
      match: /(医生|医师|转诊|预约|挂号)/i,
      tools: [TOOLS.refer],
      reply: () => [
        '已检索到 3 位匹配你「胰岛素抵抗 + 雄激素偏高」表型的认证医师：',
        '• Dr. 林婉 · 北京协和 · 妇科内分泌 (¥199)',
        '• Dr. 林若曦 · 中山一院 · 内分泌 (¥399)',
        '• Dr. 周南希 · 上海仁济 · 生殖医学 (¥299)',
        '需要我帮你预约最近一档 (Dr. 林婉，5 月 6 日 10:00) 吗？'
      ]
    },
    {
      match: /(痘|痤疮|多毛|脱发|皮肤)/i,
      tools: [TOOLS.bodyCV, TOOLS.pubmed],
      reply: () => [
        '雄激素相关皮肤症状管理：',
        '1) 短期：水杨酸 / 壬二酸早晚各一次',
        '2) 中期：与皮肤科医师讨论是否启动螺内酯 (50 mg → 100 mg)',
        '3) 营养：锌 + B6 + Omega-3 + 减少高 GI 乳制品',
        '4) 监测：每 4 周拍照 (前 / 侧) 让 Vision 量化对比'
      ]
    },
    {
      match: /(情绪|焦虑|抑郁|睡眠|失眠)/i,
      tools: [TOOLS.plan],
      reply: () => [
        '昨夜 HRV 41 ms，深睡 47 分钟，比平均低。建议：',
        '• 22:00 后离开屏幕；启用红光 + 镁甘氨酸 300 mg',
        '• 起床后 10 分钟阳光直晒，固定生物钟',
        '• 有需要可在 #心情角 与心理师 Anna 预约一次免费 15 分钟通话'
      ]
    },
    {
      match: /.*/,
      tools: [TOOLS.parseReport],
      reply: (q) => [
        `收到："${q}"`,
        '我先把它分解成一个小问题清单，再调用合适的工具来回答：',
        '1) 这是症状还是数据？\n2) 需要时间窗多长？\n3) 是否要联动医师？',
        '你可以直接把化验单或形体照片拖给我，我会立刻解读。'
      ]
    }
  ];

  function pick(q) {
    for (const r of RULES) if (r.match.test(q)) return r;
    return RULES[RULES.length - 1];
  }

  /* —— 流式渲染 —— */
  function appendBubble(stream, role, text, opts) {
    const div = document.createElement('div');
    div.className = 'bubble ' + (role === 'user' ? 'me' : 'agent');
    if (opts && opts.tool) {
      const t = document.createElement('span');
      t.className = 'tool'; t.textContent = opts.tool;
      div.appendChild(t); div.appendChild(document.createElement('br'));
    }
    const span = document.createElement('span');
    span.textContent = text || '';
    div.appendChild(span);
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;
    return span;
  }
  function thinkingBubble(stream) {
    const div = document.createElement('div');
    div.className = 'bubble agent thinking';
    div.textContent = '正在思考';
    stream.appendChild(div);
    stream.scrollTop = stream.scrollHeight;
    return div;
  }

  async function ask(stream, q) {
    appendBubble(stream, 'user', q);
    const think = thinkingBubble(stream);
    await delay(550 + Math.random() * 450);
    think.remove();
    const rule = pick(q);
    // tool call bubbles
    for (const tool of rule.tools) {
      const tb = appendBubble(stream, 'agent', '', { tool });
      tb.parentElement.querySelector('.tool').textContent = tool;
      tb.textContent = '解析完成 ✓';
      await delay(300 + Math.random() * 250);
    }
    // streamed reply
    const lines = rule.reply(q);
    const bubble = appendBubble(stream, 'agent', '');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        bubble.textContent += line[j];
        if (j % 4 === 0) await delay(8);
        stream.scrollTop = stream.scrollHeight;
      }
      if (i < lines.length - 1) bubble.textContent += '\n';
      await delay(80);
    }
    // formatting hack: convert \n to <br>
    bubble.innerHTML = bubble.textContent
      .replace(/\n/g, '<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  }
  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  global.CY_AGENT = { ask, appendBubble };
})(window);
