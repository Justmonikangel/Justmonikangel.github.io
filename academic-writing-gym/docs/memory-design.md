# 记忆层设计：为什么 Ombre-Brain 的曲线要用，但要拆成两层

## 一句话结论

Ombre-Brain（P0lar1zzZ/Ombre-Brain，MIT）的遗忘曲线可以用，**但不能直接接**。
它的衰减规则和你需要的规则方向相反：在它那里，分数衰减意味着"归档、别再提"；
在写作训练里，衰减必须意味着"该重新考你了"。同一个 `e^(-λt)`，两个相反的动作。

所以这套架构把它拆成两层记忆，各管一件事：

| | Layer A · 调度记忆 | Layer B · 上下文记忆 |
|---|---|---|
| 回答的问题 | 这个错误模式该什么时候再考一次？ | 这次 review，reviewer 该盯哪几个模式？ |
| 衰减的含义 | 保持率下降 → **优先级上升** → 进复习队列 | 显著性下降 → **掉出 prompt** |
| 数学 | `R(Δt) = 0.85^(Δt/I)`，SM-2 式区间更新 | Ombre-Brain 原式 |
| 存在理由 | 遗忘是真的 | context 预算是有限的 |

两层共用同一个磁盘文件（`learner/errors/*.md`，Markdown + frontmatter，
和 Ombre-Brain 的格式兼容），实现在 `scripts/memory.py`。

---

## 直接接会发生什么

Ombre-Brain 的打分是：

```
base_score = importance × activation_count^0.3 × e^(−λ·days) × (base + arousal·boost)
λ = 0.05,  archive threshold = 0.3
```

这是一个**关联记忆的显著性模型**：一条记忆越久没被激活，分数越低，低于阈值就归档。
对"Claude 该记得关于我的哪些事"这个问题，这个设计是对的。

但把 `error card` 塞进去会得到这样的行为：

> 你三个月没在 Discussion 里犯 `gap.mechanism` 了 → 分数衰减到 0.3 以下 → 归档 →
> agent 不再检查它 → 你在下一篇稿子里复发 → 没人发现。

也就是说，**在你最可能复发的那一刻，系统恰好把这个模式藏了起来**。
这正好是 spaced repetition 的反面：SRS 的全部意义就是在保持率跌到某个阈值时把项目
推到你面前，而不是把它收走。

Layer B 保留了这个行为，因为在"填 reviewer prompt"这个用途上它是对的 ——
你有 25 个 error code，一次 review 只该盯 5–7 个，冷掉的模式就该让位。
Layer A 则把决策规则整个翻过来。这一点在 `test_memory.py::test_decay_promotes_in_layer_a_and_demotes_in_layer_b` 里被钉死了。

---

## 具体改了 Ombre-Brain 的三处

### 1. λ 必须 per-item，而且随掌握度下降

Ombre-Brain 用固定 `λ = 0.05`，等于所有记忆半衰期恒为 13.9 天。
后果是：**"掌握"这件事在模型里无法表达** —— 你第一次学会 `claim.hedge_drift`
和第八次干净通过，衰减速度一模一样。

这里改成每张卡自己的区间 `I`，并且把保持率定义成"到期日那天恰好等于目标保持率"：

```
R(Δt) = θ^(Δt/I),  θ = 0.85
```

`I` 按成绩乘性增长（`ease` 因子，SM-2 那一套）。干净通过一次 → 区间乘 ~2.5；
复发一次 → 乘 0.4。曲线形状还是 Ombre-Brain 的指数衰减，但速率是学出来的。

### 2. arousal → stakes

Ombre-Brain 用 valence/arousal（情绪坐标）让高唤起的记忆衰减更慢。
这个直觉在写作训练里是成立的，但要换个可测的量：**这个错误有没有付出过真实代价**。

- 被导师在稿子上圈出来 → `stakes` 高
- 被 reviewer 以此为由要求大修 → `stakes` 高
- 只是练习里被 agent 抓到 → `stakes` 低

`stakes` 进 Layer B 的打分（对应 arousal 那一项），让真正让你难受过的错误在
reviewer prompt 里待得更久。这是一个我认为值得保留的 Ombre-Brain 设计。

### 3. severity ceiling：重要的错误不允许毕业

`INTERVAL_CEILING = {1: 180, 2: 90, 3: 45}` 天。

severity-3 是"会伤害科学主张、reviewer 会直接质疑"的那一类（`gap.*` 的大部分、
`claim.overclaim`、`claim.causal`、`claim.hedge_drift`）。这类错误哪怕连续干净通过
二十次，也最多把复查间隔拉到 45 天，永远留在轮换里。

理由很简单：overclaim 不是一个学会了就不会再犯的技能，它是一个在 deadline 压力下
必然回潮的行为。掌握只能换来更长的间隔，换不来豁免。

---

## 比曲线更要紧的两件事

如果只做上面那些，你会得到一个调度器，但它仍然测不准。有两个更根本的问题，
Ombre-Brain 和一般的 SRS 都没有解决。

### 写作错误没法用"回忆"来复习

闪卡的复习动作是**提取**：看到正面，回忆背面。写作没有这个动作 ——
"复习 `gap.mechanism`"不是一件你能做的事。

所以这里的复习被重新定义为：**在一个会诱发该错误的新任务里，你没有掉进去**。

于是每个练习都要打 `affords` 标签，声明它会诱发哪些错误 —— 也就是**设陷阱**。
`exercises/bank.jsonl` 里每条都有这个字段，`select_exercise()` 做的是一次贪心
集合覆盖：在你当前 week 允许的练习里，挑陷阱覆盖"到期错误"最多的那一个。

举个具体的：`cer-01` 给你 AlphaFold 预测 + 共进化信号，让你写 SpoIIIAA/SpoIIIAE 的
Discussion。这个题目的设计就是让 `gap.warrant`、`gap.mechanism`、`claim.overclaim`
同时变得极其容易犯。你如果绕过去了，这三张卡一起加分。

### 评分必须测"提示依赖度"，不是"错误有无"

这是针对你的情况最关键的一处设计。

你的问题不是**不知道**该有那一步推理 —— 你的 academic level 在线，你的逻辑在线。
你的问题是**不写**。所以"这段有没有 `gap.warrant`"这个二元判断测不出进步：
你可能这次犯了下次没犯，纯粹取决于那天累不累。

要测的是：**需要多大的提示，你才会把那一步写出来。**

```
L0  只告诉你"这段有一个 critical issue"，不说在哪
L1  指出位置（哪两句之间），不命名
L2  命名错误码 + 一句话定义，不给答案
L3  直接展示缺失的那一步
```

评分就是"最终在第几级修好的"，反过来映射成 grade：

| grade | 含义 |
|---|---|
| `clean` (3) | 陷阱设了，你没掉进去 |
| `self_fixed` (2) | 掉了，L1 指位置就自己修好了 |
| `coached` (1) | 要到 L2 命名才修好 |
| `lapse` (0) | 要到 L3 演示，或者没修好 |

一个人从 `coached` 稳定移动到 `self_fixed` 再到 `clean`，就是"内化"这件事
唯一能被观测到的形状。区间增长直接挂在这个梯子上
（`test_hint_dependence_orders_the_grades`）。

### 顺带一个防作弊：probe 时对 reviewer 盲测

如果你告诉 reviewer subagent "重点看有没有 overclaim"，它一定会找到一个 ——
不管在不在。那样测到的是 reviewer 的暗示感受性，不是你的水平。

所以 `context_pack(..., blind=...)` 会把**正在被考的那几个 code 从 reviewer 的
上下文里摘掉**。reviewer 拿到的是你其他的活跃模式；被考的那几个由 grader 事后单独判。
`awgym next` 会打印这个 blind 列表。

---

## 12 周课程和自适应调度怎么共存

这两个东西天然冲突：课程是线性的，间隔重复是自适应的。

处理方式是**课程只做解锁门槛，调度决定选哪一题**：

- `profile.yaml` 里的 `curriculum_week` 决定你能看到 week ≤ N 的练习
- 在这个池子里，选哪一题完全由到期错误的优先级决定
- 所以 week 8 的你仍然会不断被 week 2 的动词题打回来，只要 `claim.overclaim` 到期了

这样课程负责"引入新概念的顺序"，调度负责"复习什么"，互不干扰。

---

## 如果你想真的复用 Ombre-Brain 的代码

文件格式是兼容的 —— `learner/errors/*.md` 就是 Markdown + YAML frontmatter，
可以直接扔进 Obsidian vault，也可以挂到 Ombre-Brain 的 MCP 下面。分工建议：

- **Ombre-Brain 负责**：语义检索（"我以前在哪些段落里犯过类似的错"）、
  跨会话的叙事连续性、向量搜索、Obsidian 双链
- **这里的 `scripts/` 负责**：调度、评分、陷阱选题、mastery 报表

也就是把它当 **retrieval 层**，不当 **scheduler 层**。它的向量检索和双链确实好用，
而那部分正是这套架构没有做的。这个分工下两边不打架。

真要动手接的话，唯一要小心的是 `activation_count`：Ombre-Brain 的检索会 increment 它，
而 Layer B 用它算 salience。让检索去 touch 卡片是对的（被检索到说明相关），
但要确保它不去改 `last_review` —— 那是 Layer A 的状态，只有评分才能动它。

---

## 参考

- Ombre-Brain — https://github.com/P0lar1zzZ/Ombre-Brain （MIT，衰减公式、frontmatter 格式、arousal 加权）
- 实现：`scripts/memory.py`、`scripts/awgym.py`
- 测试：`scripts/test_memory.py`（16 项，含上面那条方向性断言）
