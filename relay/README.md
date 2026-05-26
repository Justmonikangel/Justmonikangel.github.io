# relay

后端：Claude ↔ GPT 中转对话平台。前端在 `web/`，React + Vite + Tailwind。

> ⚠️ **必读：API key ≠ 订阅**
>
> 这平台用的是 SDK 直连，不是网页订阅。你**必须**有这两个 key（订阅 Claude Pro / ChatGPT Plus **没用**，那是 chat 产品的钱）：
>
> - `sk-ant-...` —— 从 https://console.anthropic.com → API Keys 新建，按 token 计费
> - `sk-proj-...` —— 从 https://platform.openai.com → API Keys 新建，按 token 计费
>
> 这两个 console 跟 claude.ai / chatgpt.com 是分开的账号系统、分开的钱包。没有 API key，所有 `/turn` 都会 401。

## 启动

```bash
cd relay
cp .env.example .env   # 填入 ANTHROPIC_API_KEY / OPENAI_API_KEY / OMBREBRAIN_*
npm install
npm run dev            # tsx watch, 默认 http://localhost:8787
```

前端在另一个终端：

```bash
cd relay/web
npm install
npm run dev            # http://localhost:5173, /api 自动 proxy 到 :8787
```

或者生产模式一个进程（前端构建产物由后端 serveStatic 兜底）：

```bash
cd relay/web && npm run build
cd .. && npm run start
# http://localhost:8787 同时是 API 和 UI
```

## 接口速查

| Method | Path                                | 用途 |
| ------ | ----------------------------------- | ---- |
| GET    | `/health`                           | 健康检查 |
| GET    | `/api/sessions`                     | 列出所有会话 |
| POST   | `/api/sessions`                     | 新建会话 `{ title? }` |
| GET    | `/api/sessions/:id`                 | 读取 manifest |
| PATCH  | `/api/sessions/:id`                 | 改 title / skills |
| GET    | `/api/sessions/:id/turns`           | 拉完整 turn 列表 |
| GET    | `/api/sessions/skills`              | 列出可用 skills |
| POST   | `/api/sessions/:id/upload`          | multipart `files[]` 上传 |
| POST   | `/api/sessions/:id/turn`            | 跑一轮（SSE 流） |
| GET    | `/api/sessions/:id/fork`            | 派生到本地，下载 tar.gz |

### `/turn` 请求体

```json
{
  "target": "claude" | "gpt",
  "message": {
    "content": "把这段引言改紧一点",
    "attachments": [ /* /upload 返回的 Attachment[] */ ]
  }
}
```

`message` 可省略——用于让某一方在不加新用户输入的情况下接着另一方的话往下说（人在中间审阅完后"直接发给对面"）。

### SSE 事件

- `event: delta` — 一段增量文本
- `event: done`  — 流结束
- `event: error` — 出错

## 目录结构（运行时数据）

```
data/sessions/<id>/
├── manifest.json
├── turns/0001-user.md, 0002-claude.md, 0003-user.md, 0004-gpt.md ...
├── digests/0042-digest.md         # 自动压缩产物
└── uploads/<uuid>-<filename>      # 拖拽上传的文件
```

详细架构见 `ARCHITECTURE.md`。
