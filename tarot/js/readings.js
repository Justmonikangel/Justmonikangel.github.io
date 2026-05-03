// 把若干张牌 + 牌阵位置组合成一段酒友风的串讲。
// 思路：
//   1. 每个位置有自己的语义（过去/未来/阻碍/...）
//   2. 把"位置语义 + 该牌的正逆位短解"按顺序拼接
//   3. 在结尾给一段"组合判断"，识别一些常见的组合（多张同花色、多张大牌、塔+死神这种）

function pickPositionVerb(label) {
  const l = label.toLowerCase();
  if (l.includes("past") || l.includes("过去")) return "你从这儿走来";
  if (l.includes("present") || l.includes("现在") || l.includes("处境")) return "现在你正卡在这";
  if (l.includes("future") || l.includes("未来") || l.includes("终局")) return "如果继续这样走，前头是";
  if (l.includes("阻碍")) return "横在你前面的是";
  if (l.includes("根基") || l.includes("根因")) return "藏在底下推着你的";
  if (l.includes("顶端") || l.includes("希望")) return "你心里想要的画面是";
  if (l.includes("近期")) return "接下来这阵会冒出来";
  if (l.includes("自我")) return "你看自己的方式是";
  if (l.includes("环境")) return "你周围人看你像";
  if (l.includes("恐惧")) return "你不愿承认的那一面是";
  if (l.includes("你 → ta")) return "你递给对方的是";
  if (l.includes("ta → 你")) return "对方递给你的是";
  if (l.includes("关系本身")) return "你们之间长出来的东西是";
  if (l === "你") return "你在这段里的样子是";
  if (l === "ta") return "TA 在这段里的样子是";
  return "这个位置上";
}

function describeCard(drawn) {
  const { card, reversed } = drawn;
  const text = reversed ? card.rev : card.up;
  const orient = reversed ? "逆位" : "正位";
  return { name: `${card.cn}（${card.name} · ${orient}）`, text };
}

// 检测几种常见组合，给一段额外的"画外音"
function detectCombos(drawn) {
  const lines = [];
  const ids = drawn.map(d => d.card.id);
  const has = id => ids.includes(id);

  if (has("16-tower") && (has("13-death") || has("15-devil"))) {
    lines.push("塔配死神/恶魔——这局是真要拆一栋旧的了。别抢救，给它塌。");
  }
  if (has("19-sun") && has("17-star")) {
    lines.push("太阳和星星都在场，运气面是真的亮。许的愿这阵答得到。");
  }
  if (has("18-moon") && has("13-death")) {
    lines.push("月亮+死神，水底的东西在浮上来。别怕，让它浮完。");
  }
  if (has("06-lovers") && has("11-justice")) {
    lines.push("恋人遇上正义——这段感情的'账'要算清楚了，模糊不下去。");
  }

  const majorCount = drawn.filter(d => d.card.id.match(/^\d{2}-/) && parseInt(d.card.id) <= 21).length;
  if (majorCount >= drawn.length * 0.6 && drawn.length >= 3) {
    lines.push(`这局里大牌占了 ${majorCount} 张——意味着不是日常小事，是命运在拨大轮子。`);
  }

  const reversedCount = drawn.filter(d => d.reversed).length;
  if (reversedCount >= drawn.length * 0.7 && drawn.length >= 3) {
    lines.push("逆位偏多。你最近往内拐了，外面看起来不动，里面在重写。");
  }

  const suitCount = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
  drawn.forEach(d => { if (d.card.suit) suitCount[d.card.suit]++; });
  const dominant = Object.entries(suitCount).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] >= drawn.length * 0.5 && drawn.length >= 3) {
    const map = {
      wands: "整局火气大——行动、冲劲、急着改变。",
      cups: "整局水气重——情绪、关系、心里那点事是主旋律。",
      swords: "整局风气盛——脑子转得快，话题都是想清楚没想清楚。",
      pentacles: "整局土气厚——钱、工作、身体、踏实生活的部分。",
    };
    lines.push(map[dominant[0]]);
  }

  return lines;
}

function generateReading(spread, drawn) {
  const lines = [];
  for (let i = 0; i < drawn.length; i++) {
    const pos = spread.positions[i];
    const d = drawn[i];
    if (!d || !pos) continue;
    const verb = pickPositionVerb(pos.label);
    const desc = describeCard(d);
    lines.push({
      label: pos.label,
      cardLabel: desc.name,
      body: `${verb}：${desc.text}`,
    });
  }
  const combos = detectCombos(drawn);
  let narrative = "";
  if (drawn.length >= 2) {
    const first = describeCard(drawn[0]);
    const last = describeCard(drawn[drawn.length - 1]);
    narrative = `这一局看下来——你从「${first.name}」的状态走过来，最后落在「${last.name}」上。` +
      (combos.length ? "\n\n" + combos.join("\n") : "") +
      "\n\n中间这些位置都是过程的纹理。别盯着任何单张牌死磕，它们是一段话，不是一个判决。";
  }
  return { lines, narrative, combos };
}

if (typeof window !== "undefined") {
  window.generateReading = generateReading;
}
