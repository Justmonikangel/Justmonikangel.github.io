# 架构说明

## 目标

让你坐在中间，让 Claude 和 GPT 来回过稿——改论文、改 CV。两边都顶格推理，不丢上下文，能拖文件图片，能"派生到本地"继续在硬盘上手改，跨 session 也能"记起来"。

## 三层结构

```
┌────────────────────────────────────────────────────────┐
│  前端 (Gemini)   拖拽 / 审阅 / 选择目标 / 触发派生         │
└──────────────────────────┬─────────────────────────────┘
                           │  REST + SSE
┌──────────────────────────▼─────────────────────────────┐
│  Orchestrator (relay.ts)                               │
│  ├─ compose system  ├─ maybeCompact()  ├─ buildContext │
│  └─ stream → provider → append turn → ingest 记忆       │
└──────┬────────────────────┬─────────────────────┬──────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌────────────┐      ┌──────────────┐      ┌──────────────┐
│ Providers  │      │ Memory       │      │ Skills       │
│ claude.ts  │      │ markdown.ts  │      │ loader.ts    │
│ gpt.ts     │      │ ombrebrain   │      │ (SKILL.md)   │
│            │      │ recall.ts    │      │              │
└────────────┘      └──────────────┘      └──────────────┘
```

## 关键决策

### 1. Effort max 写死在 provider 里

- Claude：`thinking: { type: 'enabled', budget_tokens: 32000 }`，`max_tokens: 64000`
- GPT：Responses API，`reasoning: { effort: 'high' }`

两个值都从 `.env` 里读（`CLAUDE_THINKING_BUDGET` / `GPT_REASONING_EFFORT`），但默认就是顶配。
要改模型直接换 `CLAUDE_MODEL` / `GPT_MODEL` 即可。

### 2. 人在中间：默认手动 relay

每次 `/api/sessions/:id/turn` 只跑**一方**。你在前端看完输出、决定改不改，再点"发给对面"——这次可以只带 `target` 不带 `message`，后端会把上一方的输出当作上下文喂给对面，不重复你的输入。

需要全自动来回时让 Codex 在 `orchestrator/` 加一个 `autoRelay.ts`，循环调用 `runTurn` 直到收敛/到上限，前端用同一个 SSE 通道。

### 3. MD vs OmbreBrain：两个都用，分工不同

| 维度       | Markdown                                | OmbreBrain                    |
| ---------- | --------------------------------------- | ----------------------------- |
| 角色       | source of truth                         | 索引 / 召回                   |
| 写入时机   | 每个 turn 写盘                          | turn 写盘后 fire-and-forget   |
| 查询方式   | 按时序/index 直读                       | 语义查询                      |
| 跨 session | ❌ 自己开                               | ✅ 跨会话拉回相关片段          |
| 离线可用   | ✅ 直接打开 .md 改                      | ❌                            |
| 派生到本地 | ✅ 整目录 tar 走人                      | ❌                            |
| 适合       | "上次具体说了啥"、"按时间回放"          | "我之前那篇关于 X 的怎么说的" |

读流程（`memory/recall.ts → buildContext`）：

1. **digest**：最近一次自动压缩的摘要（如果有），完整塞进 system。
2. **recentTurns**：最近 N 轮原文 turn（默认 8 轮），按 provider 协议变成 messages。
3. **semantic**：以本轮用户输入（或 session title）为 query，问 OmbreBrain 拉 4 条 session 内 + 4 条跨 session 的语义相关片段，塞进 system 的 "Relevant memories" 段。

OmbreBrain 没配 URL 时 `ombreEnabled()` 直接返回 false，整个语义层降级，不影响主流程。

### 4. 自动压缩（仿 Codex）

`orchestrator/compaction.ts` 在每轮开跑前调用 `maybeCompact()`：

- 统计 `compactedThrough` 之后所有 turn 的 token 估算总和
- 超过 `COMPACTION_THRESHOLD_TOKENS`（默认 140k）就把前面那批（保留最近 8 轮）丢给 Claude 写一份 digest
- digest 落到 `digests/####-digest.md`，manifest 的 `compactedThrough` 推进到该 turn
- 下一轮 `buildContext` 自动从 `compactedThrough + 1` 之后拉原文，前面的全部由 digest 顶替

digest 用 Claude 而不是 Haiku，因为论文/CV 类内容压缩失真代价高，先稳，后面想省钱让 Codex 加 `CLAUDE_COMPACTION_MODEL=claude-haiku-4-5-20251001` 即可。

### 4.5. 中英双语 prompt

`orchestrator/relay.ts` 的 `composeSystem()` 输出的 system message 全部双语（EN + ZH 并排），分段标题用 `# Role / # Relay protocol / # Language policy / # Effort` 这种英文骨架，每段内 EN/ZH 各一句。

Language policy 段写死规则：

> 用户通常用中文写指令，被改的稿件（论文、CV）通常是英文。按当前任务的语种匹配：对中文提问用中文回答，对英文稿件的改写继续用英文。技术术语和专有名词保留原文。除非明确要求，否则不要翻译用户的稿件。

Skill 预设（`skills/*/SKILL.md`）也是双语，EN 段 + ZH 段，两个模型都能直接吃。

### 5. 派生到本地

`GET /api/sessions/:id/fork` 用 `tar -czf -` 直接把 `data/sessions/<id>/` 整目录流式打包返回。下载下来就是：

```
session-xxx.tar.gz
└── ./
    ├── manifest.json
    ├── turns/      ← 每轮独立 .md，可以直接拿编辑器接着改
    ├── digests/
    └── uploads/
```

后续 Codex 可以加一个 `POST /api/sessions/import`，吃同样格式的 tar.gz 反向恢复。

### 6. 拖拽文件 / 图片

前端拖入 → `POST /api/sessions/:id/upload`（multipart `files`）→ 返回 `Attachment[]` → 下一次 `/turn` 时塞进 `message.attachments`。

provider 适配器按 `kind` 分发：

- `image` → Claude `image` 块 / GPT `input_image`（都是 base64 data URL）
- `pdf`   → Claude `document` 块 / GPT `input_file`
- `text`  → 直接拼进 text block（带分隔标记）
- `other` → 跳过（前端可以提示用户）

## 模块边界

| 文件                                | 责任                                     |
| ----------------------------------- | ---------------------------------------- |
| `src/index.ts`                      | Hono boot, 装路由                         |
| `src/config.ts`                     | 全部 env 读取，单源                       |
| `src/types.ts`                      | 共享类型，前端协议也以此为准              |
| `src/providers/claude.ts`           | Anthropic SDK + extended thinking         |
| `src/providers/gpt.ts`              | OpenAI Responses API + reasoning effort   |
| `src/orchestrator/relay.ts`         | 单轮编排：上下文 → provider → 落盘 → 索引 |
| `src/orchestrator/compaction.ts`    | 阈值触发的 digest 生成                    |
| `src/memory/markdown.ts`            | 每 turn 落 .md，front-matter + body       |
| `src/memory/ombrebrain.ts`          | HTTP 适配器，可降级                       |
| `src/memory/recall.ts`              | 三路混合 (digest + recent + semantic)     |
| `src/skills/loader.ts`              | 按 manifest.skills 拼 SKILL.md           |
| `src/routes/*`                      | 薄路由层，业务在 orchestrator/memory       |
| `src/lib/sessions.ts`               | session CRUD + 目录布局                   |
| `src/lib/tokens.ts`                 | 粗 token 估算（4 char / token）           |

## 留给 Codex 的活

- [ ] `npm install` 后跑通 `/health`
- [ ] OmbreBrain 真实接口对齐（现在假设 `/upsert` + `/query`；如果是 MCP 而非 HTTP，在 `memory/ombrebrain.ts` 加 MCP 客户端分支，保留同样的 `ingestTurn` / `recall` 签名）
- [ ] `providers/gpt.ts` 对你账号下 GPT 模型的实际响应格式做一次回放校验（reasoning 模型有时事件名会变）
- [ ] `lib/tokens.ts` 换成真 tokenizer（`@anthropic-ai/tokenizer` + `js-tiktoken`），现在的 4-char 估算偏保守
- [ ] `autoRelay` 模式：可选地让两方自动来回 N 轮再停
- [ ] `POST /api/sessions/import` 反向吃 tar.gz
- [ ] 鉴权：现在裸暴露端口；本地用没问题，挂公网前加一层 token 中间件
