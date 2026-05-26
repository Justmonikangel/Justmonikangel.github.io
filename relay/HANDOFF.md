# HANDOFF

两份并发任务的交接说明。Gemini 和 Codex **不要互相 patch 对方的目录**，按下文边界各干各的；交回来的东西用同一种格式，方便人审阅 + 拼接。

仓库：`Justmonikangel/Justmonikangel.github.io`
分支：`claude/admiring-cerf-LGsMs`
工作根目录：`relay/`

---

## 0. 文件归属边界（硬规则）

| 路径                              | 所有者  | 备注 |
| --------------------------------- | ------- | ---- |
| `relay/web/**`                    | Gemini  | 前端代码、静态资源、前端构建配置 |
| `relay/src/**`                    | Codex   | 后端 TS 源码 |
| `relay/skills/**`                 | Codex   | Skill 预设 |
| `relay/package.json`              | Codex   | 后端依赖（前端如要 build 工具，放 `relay/web/package.json`） |
| `relay/.env.example`              | Codex   | 配置面 |
| `relay/ARCHITECTURE.md`           | 共享    | 改动前先在交付说明里写"为什么改" |
| `relay/README.md`                 | 共享    | 同上 |
| `relay/src/types.ts`              | **契约** | 任何一方想改字段，必须在交付说明顶部用一段 `## TYPE CONTRACT CHANGE` 标出来 |

---

## 1. 给 Gemini（前端 UI）

### 必读

1. `relay/ARCHITECTURE.md` — 整体意图，特别是"人在中间手动 relay"和"派生到本地"两节
2. `relay/README.md` 的接口速查表 + SSE 事件
3. `relay/src/types.ts` — `Turn` / `Attachment` / `SessionManifest` / `ProviderTarget`，前端 TS 直接 import 用

### 必交付的 UI

整个体验是**"我坐在中间审稿"**，不是普通 chatbot。基本布局：

```
┌──────────────────────────────────────────────────────────────┐
│ Session 切换 / 新建 / Fork 下载 / Skills 开关                  │
├──────────────────┬──────────────────┬──────────────────────────┤
│   Claude 输出    │   我的输入框      │     GPT 输出              │
│   （流式显示）    │   + 拖拽区        │     （流式显示）          │
│   ↓ "改完发给我"  │   ↓ Send → claude │     ↓ "改完发给我"        │
│                  │   ↓ Send → gpt    │                          │
│                  │   ↓ Relay 上一条   │                          │
└──────────────────┴──────────────────┴──────────────────────────┘
```

关键交互：

- **拖拽**：文件/图片拖到中间输入框 → 先 `POST /api/sessions/:id/upload`（multipart `files[]`），拿到 `Attachment[]`；下一次 `/turn` 时把 attachments 一起带上
- **Send → claude / Send → gpt**：发当前输入框内容到指定模型，SSE 流式渲染到对应那一栏
- **Relay 上一条**：不带新 `message`，只 POST `{ target: "claude" | "gpt" }`，后端会把另一方刚才的输出当上下文继续。这是审阅完一方输出后"原样转给对面"的快捷键
- **Fork 下载**：`GET /api/sessions/:id/fork`，浏览器直接下载 tar.gz
- **Skills 开关**：`GET /api/sessions/skills` 拿到可用列表；勾选后 `PATCH /api/sessions/:id { skills: [...] }`
- **历史回放**：进入 session 时 `GET /api/sessions/:id/turns` 拉全部 turn 渲染左右两栏（按 role 分流）

### 技术约束

- 栈自选（React + Vite / Svelte / vanilla 都行），但：
  - 源码全部在 `relay/web/` 下
  - 若用构建工具，构建产物输出到 `relay/web/dist/`（Codex 会让 Hono 把这个目录当静态资源 serve）
  - 开发模式 dev server 默认走 `http://localhost:5173`，API 走 `http://localhost:8787`，dev 配置里加 proxy `/api → :8787`
- SSE：用 `EventSource` 或 `fetch + ReadableStream` 都行，注意三种事件 `delta` / `done` / `error`
- 不要在前端硬编码任何 API key
- Markdown 渲染推荐 `marked` 或 `markdown-it`，代码高亮可选

### 交付物清单

1. `relay/web/` 整个目录树
2. `relay/web/README.md`：怎么 dev、怎么 build、用了什么栈、依赖了 `types.ts` 的哪些类型
3. 一张运行截图或一段短录屏（可选但强烈建议）

### 交回来的格式

把 `relay/web/` 打包成 `gemini-handback.tar.gz`，连同一份 `gemini-notes.md`（写：用的栈、新引入的依赖、对契约的任何疑问、未完成项）一起给我。

---

## 2. 给 Codex（后端补全）

### 必读

1. `relay/ARCHITECTURE.md` 全文，尤其末尾 "留给 Codex 的活" checklist
2. `relay/src/` 全部 — 现在已经能 `npm run dev` 起，typecheck 干净，你的工作是**补 TODO 不是重写**
3. `relay/.env.example` — 全部配置面

### 必交付的补全项

按优先级：

1. **OmbreBrain 接口对齐**
   - 现在 `memory/ombrebrain.ts` 假设是 HTTP `/upsert` + `/query`。先确认用户的 OmbreBrain 实际是哪种：
     - 如果是 HTTP，校准请求/响应字段名
     - 如果是 MCP server，在同文件加一个 MCP client 分支（用 `@modelcontextprotocol/sdk`），保留 `ingestTurn` / `recall` 的对外签名不变
   - 写一个 `.env.example` 注释说清两种模式怎么切换

2. **真 tokenizer**
   - `lib/tokens.ts` 现在是 `length / 4` 的粗估
   - Claude 侧装 `@anthropic-ai/tokenizer`，GPT 侧装 `js-tiktoken`，按 turn 的 model 字段分发
   - 保留同步签名 `estimateTokens(text, model?)`

3. **Responses API 事件回放校验**
   - `providers/gpt.ts` 现在按 `response.output_text.delta` 取增量
   - 用真 key 跑一次，确认 reasoning 模型的事件流是否一致；若不同把分支补齐（`response.reasoning.delta` 可能需要单独处理或丢弃）

4. **Auto-relay 模式**
   - 新增 `src/orchestrator/autoRelay.ts`：循环 `runTurn` 在 claude/gpt 之间切到收敛（用户输入 stop / N 轮上限 / 两方连续两轮没新增信息）
   - 新增路由 `POST /api/sessions/:id/auto-relay { rounds, stopOn? }`，同 SSE 协议但事件名加 `event: turn-start { role }` 让前端能换栏

5. **Import 反向**
   - `POST /api/sessions/import` 收 tar.gz（multipart），解到 `data/sessions/<id>/`，校验 manifest 合法后入库
   - 用 `tar` 命令解压即可，不要新加重型依赖

6. **静态资源服务**
   - 在 `src/index.ts` 加 `app.use('/*', serveStatic({ root: './web/dist' }))` 兜底，让生产模式下后端能直接 serve Gemini 的 build 产物
   - 注意路由顺序：`/api/*` 在前，静态在后

7. **鉴权**
   - 在 `src/index.ts` 加 `RELAY_TOKEN` env，存在时所有 `/api/*` 要求 `Authorization: Bearer <token>`
   - 空时不校验（本机用）

### 不要做的事

- 不要动 `relay/web/`
- 不要改 `src/types.ts` 字段名（要改先在 codex-notes.md 顶部用 `## TYPE CONTRACT CHANGE` 标出来并说明理由）
- 不要把 effort max 默认值往下调
- 不要把 OmbreBrain 关闭路径删掉——`ombreEnabled()` 返回 false 时整套必须照样能跑

### 交付物清单

1. 改动后的 `relay/src/` / `relay/skills/` / `relay/package.json` / `relay/.env.example`
2. `npm run typecheck` 必须过
3. 一份 `codex-notes.md`：每个 checklist 项写一行"已做 / 部分做 / 没做 + 原因"，加上对 OmbreBrain 实际接口形状的描述

### 交回来的格式

只交**修改过的文件**，连同 `codex-notes.md` 打包成 `codex-handback.tar.gz`。结构保持 `relay/...` 的相对路径，我直接解压覆盖。

---

## 3. 我（中间人）做的拼接流程

1. 同时把 `gemini-handback.tar.gz` 和 `codex-handback.tar.gz` 收下
2. 各起一个分支 `claude/merge-gemini` / `claude/merge-codex`，分别解压、跑 typecheck / build
3. 读两份 notes.md，标记契约冲突和未完成项
4. 在主分支 `claude/admiring-cerf-LGsMs` 上按顺序合并（先 Codex 后 Gemini，因为前端依赖契约稳定）
5. 跑端到端冒烟：建 session → 上传 PDF → send to gpt → relay to claude → fork 下载 → 解压本地看 .md
6. 把冲突 / 漏项 / 需要追加的工作写一份汇总 push 给你

## 4. 共用约定（两边都要遵守）

- 不要在代码里写"// added by codex" / "// from gemini" 这类标注
- 不要往仓库塞 API key
- 提交前确保自己那一摊本机能跑起来
- 任何对 `ARCHITECTURE.md` 的改动写一段 `## CHANGELOG` 追加在文件底部
- 不确定的地方在自己的 notes.md 里写问题，**不要自己拍脑袋扩展契约**
