# relay-web

Frontend for `relay/` 后端。React 18 + Vite + Tailwind + lucide-react。

## 开发

```bash
cd relay/web
npm install
npm run dev          # http://localhost:5173, /api 自动 proxy 到 :8787
```

后端在另一个终端：

```bash
cd relay
npm install
npm run dev          # http://localhost:8787
```

## 构建

```bash
cd relay/web
npm run build        # 产物到 dist/, 后端 src/index.ts 末尾的 serveStatic('./web/dist') 兜底服务
```

## 鉴权

如果后端设了 `RELAY_TOKEN`，点 ⚙️ 输入 token，存到 `localStorage['relay-token']`，所有 `/api/*` 请求会带上 `Authorization: Bearer <token>`。

## 三栏布局

| 列     | 内容                                 |
| ------ | ------------------------------------ |
| 左     | Claude 历史 turn + 流式输出           |
| 中     | 我的 turn + 输入框 + 拖拽区 + 发送钮  |
| 右     | GPT 历史 turn + 流式输出              |

按钮：

- **Send → Claude / GPT**：把当前输入框的内容 + 已上传 attachments 发出去
- **Relay → 对面**：不带新输入，把上一方的输出原样转给另一方
- **派生到本地**：下载 `<title>-<id>.tar.gz`
- **skills toggle**：每个 session 独立勾选 SKILL.md 注入

## SSE 事件处理

`src/api.js` 的 `readSse` 把 Hono streamSSE 的输出解析成事件。三种事件：

- `delta` → 增量文本
- `turn-start` → auto-relay 切栏（前端暂未在主流程用，路径已就位）
- `done` / `error` → 收尾

## 依赖来源契约

`web/src/api.js` 直接使用后端 `relay/src/types.ts` 里的形状（`Turn` / `Attachment` / `SessionManifest`）。改契约前请同时改两边。

## 已知未完成

- 没接 markdown 渲染（用 `<pre>` 保留换行，适合论文/CV 改稿的可读性）。要彩色高亮可后接 `marked` + `highlight.js`
- 没做对话搜索 / 跨 session 跳转
- 没接 auto-relay 路径到 UI（后端 `POST /api/sessions/:id/auto-relay` 已实现，前端可加一个"自动来回 N 轮"按钮调用 `streamAutoRelay`）
- 拖拽时没显示文件大小、上传进度
- 移动端没适配（三栏纯桌面布局）
