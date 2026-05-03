// 牌阵格式 schema：
// {
//   id: string,
//   name: string,
//   description: string,
//   positions: [{ label: string, hint: string, x: 0-1, y: 0-1, rotation?: deg }]
// }
// x,y 为相对牌阵棋盘的归一化坐标 (0-1)。

const BUILT_IN_SPREADS = [
  {
    id: "three-card",
    name: "三张牌",
    description: "时间轴上的小切片：你从哪里来、你站在哪、你要去哪。",
    positions: [
      { label: "PAST · 过去", hint: "塑造你此刻的源头", x: 0.22, y: 0.5 },
      { label: "PRESENT · 现在", hint: "你此刻真正面对的", x: 0.5,  y: 0.5 },
      { label: "FUTURE · 未来", hint: "若不大幅调整方向的去向", x: 0.78, y: 0.5 },
    ],
  },
  {
    id: "celtic-cross",
    name: "凯尔特十字",
    description: "完整的十张牌阵：处境、阻碍、根因、过去、可能未来、近期、自我、环境、希望恐惧、最终。",
    positions: [
      { label: "1 处境",     hint: "核心议题",          x: 0.30, y: 0.50 },
      { label: "2 阻碍",     hint: "横在你前面的力量",  x: 0.30, y: 0.50, rotation: 90 },
      { label: "3 根基",     hint: "潜意识的源头",      x: 0.30, y: 0.78 },
      { label: "4 过去",     hint: "刚刚滑过的画面",    x: 0.13, y: 0.50 },
      { label: "5 顶端",     hint: "你期望的目标",      x: 0.30, y: 0.22 },
      { label: "6 近期",     hint: "下一步会出现的",    x: 0.47, y: 0.50 },
      { label: "7 自我",     hint: "你怎么看自己",      x: 0.72, y: 0.82 },
      { label: "8 环境",     hint: "周围人怎么看你",    x: 0.72, y: 0.62 },
      { label: "9 希望恐惧", hint: "心里的两面",        x: 0.72, y: 0.42 },
      { label: "10 终局",    hint: "若延着这条路",      x: 0.72, y: 0.22 },
    ],
  },
  {
    id: "relationship",
    name: "关系五星",
    description: "你 / TA / 你给的 / TA 给的 / 关系本身。",
    positions: [
      { label: "你",          hint: "你在这段关系里的状态", x: 0.22, y: 0.65 },
      { label: "TA",          hint: "对方的状态",           x: 0.78, y: 0.65 },
      { label: "你 → TA",     hint: "你向对方流出的",       x: 0.36, y: 0.40 },
      { label: "TA → 你",     hint: "对方向你流出的",       x: 0.64, y: 0.40 },
      { label: "关系本身",    hint: "你们之间正在长出什么", x: 0.50, y: 0.18 },
    ],
  },
];

if (typeof window !== "undefined") {
  window.BUILT_IN_SPREADS = BUILT_IN_SPREADS;
}
