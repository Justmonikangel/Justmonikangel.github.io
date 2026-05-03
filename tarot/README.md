# Cosmic Tarot · 抓取占卜

挂在 `/tarot/` 路径下的单页应用。

## 功能

- **手势抓取**：MediaPipe Hands 实时检测手部，张开 → 合拢 抓住一张牌；移到牌阵位置上张开手指 → 放置。
- **多套牌**：棱镜·彩 / 棱镜·黑白 / Sorceress（程序化占位艺术，可替换为真实牌面）。
- **牌阵切换**：内置三张牌、凯尔特十字、关系五星；支持导入自定义牌阵 JSON。
- **酒友风解读**：22 张大牌 + 56 张小牌的口语化正逆位短解 + 末尾串讲。

## 自定义牌阵 JSON

格式：

```json
{
  "id": "my-spread",
  "name": "我的牌阵",
  "description": "一句话描述",
  "positions": [
    { "label": "PAST", "hint": "提示文字", "x": 0.2, "y": 0.5, "rotation": 0 }
  ]
}
```

`x` `y` 是棋盘内的归一化坐标（0–1）。`rotation` 单位为度，可省略。

参考示例：[`spreads/example-horseshoe.json`](spreads/example-horseshoe.json)。

## 替换牌面图（可选）

把每张牌的图片放到对应文件夹：

```
tarot/decks/prism-color/00-fool.jpg
tarot/decks/prism-color/01-magician.jpg
...
tarot/decks/sorceress/wands-01.jpg
```

文件名对应 `js/cards.js` 中每张牌的 `id`。然后在 `tarot.js` 的 `makeCardEl()` 里把
`card-front` 的 inner HTML 换成 `<img src="decks/${deckId}/${card.id}.jpg">` 即可。
（占位艺术目前由 CSS 渐变 + Unicode 字符生成，可直接使用。）

## 浏览器要求

- 支持 ESM 动态 import 与 `getUserMedia`（Chrome/Firefox/Safari 最新版均可）。
- 第一次启用手势会从 jsDelivr/Google Storage 拉模型（约 10MB），之后浏览器缓存。
