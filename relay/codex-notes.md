# codex-notes

## OmbreBrain actual interface shape

- 官方 `P0lar1zzZ/Ombre-Brain` 当前主实现是 **MCP server**，不是原先假设的纯 HTTP `/upsert` + `/query`。
- 已核对到的核心工具是 `hold(content, tags, importance, pinned)` 和 `breath(query, max_results, domain, valence, arousal)`。
- 传输层支持两种：
  - `streamable-http`：远程地址通常是 `https://<host>/mcp`
  - `stdio`：本地进程直连
- 这次实现里保留了旧 HTTP 适配分支作为兼容降级，同时新增了基于 `@modelcontextprotocol/sdk` 的 MCP 客户端分支。

## Checklist

- 1. OmbreBrain 接口对齐: 已做。新增 `OMBREBRAIN_MODE` 和 MCP 相关配置；支持 `streamable-http` / `stdio` 两种 MCP 传输；保留旧 `/upsert` + `/query` HTTP 适配作为兼容路径。
- 2. 真 tokenizer: 已做。Claude 走 `@anthropic-ai/tokenizer`，GPT 走 `js-tiktoken`；`estimateTokens(text, model?)` 保留同步签名，并按 `Turn.model` 分发。
- 3. Responses API 事件回放校验: 部分做。当前环境里没有可用 `OPENAI_API_KEY`，没法用真 key 实测 reasoning 模型事件流；已按当前 OpenAI SDK 类型补齐 `response.output_text.*`、`response.refusal.*`，并显式忽略 reasoning delta，避免把内部推理流直接渲染给前端。
- 4. Auto-relay 模式: 已做。新增 `src/orchestrator/autoRelay.ts` 和 `POST /api/sessions/:id/auto-relay`；SSE 增加 `turn-start` 事件，支持轮数上限、`stopOn` 文本命中，以及连续两轮高重复度时自动收敛停止。
- 5. Import 反向: 已做。新增 `POST /api/sessions/import`；先列 tar 条目并拒绝不安全路径，再解压到临时目录、校验 `manifest.json`，最后落到 `data/sessions/<id>/`。
- 6. 静态资源服务: 已做。在 `src/index.ts` 末尾加了 `serveStatic({ root: './web/dist' })`，顺序放在全部 `/api/*` 路由之后。
- 7. 鉴权: 已做。新增 `RELAY_TOKEN`；存在时所有 `/api/*` 需要 `Authorization: Bearer <token>`，同时放行 CORS 预检 `OPTIONS`。

## Notes / assumptions

- `auto-relay` 路由额外接受了可选的 `target` 和 `message`，这样新会话也能直接自动开跑；如果不传，会按最后一条 assistant turn 推断下一位发言者。这个是保守扩展，没有改 `src/types.ts`。
- OmbreBrain MCP 工具面没有原 HTTP 适配里那种显式 `sessionId` 过滤器，所以当前 session 内召回是 **best-effort**：写入时把 `session:<id>` 前缀一起存入内容，查询时把这个前缀拼进本地召回 query。
- 为了让 `/health`、`/import`、`/sessions` 这类非模型路径在没配 API key 时也能启动，Claude/OpenAI provider client 改成了惰性初始化；真正调用模型时才检查 key。
- 本机 PATH 没有系统 `npm`，所以验证时用的是 `pnpm dlx npm@10 ...` 来运行真实 npm CLI。

## Verification

- `pnpm dlx npm@10 run typecheck`
- 启动验证：`RELAY_TOKEN=test-token PORT=8787 pnpm dlx npm@10 run start`
- `GET /health` 返回 200
- `GET /api/sessions` 未带 token 返回 401
- 带 `Authorization: Bearer test-token` 的 `GET /api/sessions` 返回 200
- `OPTIONS /api/sessions` 预检返回 204
- 用一个最小 session tar 包跑通了 `POST /api/sessions/import`
