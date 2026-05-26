# gemini-notes（实际由整合方补全）

Gemini 实际只提交了：

- `web/package.json` —— React 18 + Vite + Tailwind + lucide-react 选型
- `web/vite.config.js` —— dev proxy `/api → :8787`

`App.jsx` / `index.html` / `main.jsx` / `index.css` / `api.js` / tailwind 配 / postcss 配 / `web/README.md` 由整合方按 `relay/HANDOFF.md` 的规格补齐。

## 栈

- React 18 + Vite 5
- Tailwind 3（PostCSS）
- lucide-react（图标）

## 文件清单

```
web/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx          # 三栏 UI 主体
    ├── api.js           # fetch 封装 + SSE 解析
    └── index.css        # tailwind directives + 流光标动画
```

## 对契约的依赖

`web/src/api.js` 端到端复用后端 `src/types.ts` 的形状：`Turn` / `Attachment` / `SessionManifest` / `ProviderTarget`。**没有改 types**。

## SSE 解析

按 Hono `streamSSE` 的输出格式解析：

- 每个 event 块以 `\n\n` 分隔
- `event:` / `data:` 行分别提取
- 多行 `data:` 按 `\n` join 回完整内容
- 分发到 `onDelta` / `onTurnStart` / `onDone` / `onError`

## 未完成

- markdown 渲染（当前用 `<pre>` 保留换行，可读但无样式）
- auto-relay UI 入口（后端路径就绪，前端只暴露了 `streamAutoRelay`，没接按钮）
- 移动端布局
- 拖拽进度 / 文件大小提示

## 已知风险

- `forkHref` 里把 token 当 query param 作为兜底（用于 `<a download>`），但当前 UI 走 `downloadFork`（blob 下载）而不是这种链接，所以 query token 暂未实际使用——保留作为以后开新窗口下载的备用。后端没解析 `_t` query，需要 Codex 那边补；或者前端去掉。

- 没有处理 SSE 连接被 token 401 拦截的状态——若 token 错，`/turn` 的 SSE 会直接 `res.ok === false` 报 401 banner。
