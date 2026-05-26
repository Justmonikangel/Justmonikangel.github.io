import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { config } from '../config.ts';
import type { Turn } from '../types.ts';

export type RecallResult = {
  text: string;
  score: number;
  metadata: Record<string, unknown>;
};

type OmbreMode = 'off' | 'http' | 'mcp';

let mcpClientPromise: Promise<Client> | null = null;

export function ombreEnabled(): boolean {
  return resolveMode() !== 'off';
}

export async function ingestTurn(sessionId: string, turn: Turn): Promise<void> {
  const mode = resolveMode();
  if (mode === 'off') return;

  try {
    if (mode === 'mcp') {
      await ingestViaMcp(sessionId, turn);
      return;
    }
    await ingestViaHttp(sessionId, turn);
  } catch (err) {
    console.warn('[ombrebrain] ingest failed', err);
  }
}

export async function recall(
  query: string,
  opts: { topK?: number; sessionId?: string } = {},
): Promise<RecallResult[]> {
  const mode = resolveMode();
  if (mode === 'off' || !query.trim()) return [];

  try {
    if (mode === 'mcp') {
      return await recallViaMcp(query, opts);
    }
    return await recallViaHttp(query, opts);
  } catch (err) {
    console.warn('[ombrebrain] query failed', err);
    return [];
  }
}

function resolveMode(): OmbreMode {
  if (config.ombrebrain.mode === 'http') {
    return config.ombrebrain.url ? 'http' : 'off';
  }
  if (config.ombrebrain.mode === 'mcp') {
    return hasMcpConfig() ? 'mcp' : 'off';
  }
  if (hasMcpConfig()) return 'mcp';
  if (config.ombrebrain.url) return 'http';
  return 'off';
}

function hasMcpConfig(): boolean {
  if (config.ombrebrain.mcpTransport === 'stdio') {
    return Boolean(config.ombrebrain.mcpCommand);
  }
  return Boolean(config.ombrebrain.mcpUrl);
}

async function ingestViaHttp(sessionId: string, turn: Turn): Promise<void> {
  const res = await fetch(httpUrl('/upsert'), {
    method: 'POST',
    headers: httpHeaders(),
    body: JSON.stringify({
      id: `${sessionId}:${turn.index}`,
      text: turn.content,
      content: turn.content,
      metadata: {
        sessionId,
        turnIndex: turn.index,
        role: turn.role,
        createdAt: turn.createdAt,
        model: turn.model,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on /upsert`);
  }
}

async function recallViaHttp(
  query: string,
  opts: { topK?: number; sessionId?: string },
): Promise<RecallResult[]> {
  const res = await fetch(httpUrl('/query'), {
    method: 'POST',
    headers: httpHeaders(),
    body: JSON.stringify({
      query,
      text: query,
      top_k: opts.topK ?? 6,
      topK: opts.topK ?? 6,
      max_results: opts.topK ?? 6,
      filters: opts.sessionId ? { sessionId: opts.sessionId } : undefined,
      sessionId: opts.sessionId,
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on /query`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const rawResults = normalizeResultArray(
    data.results ?? data.matches ?? data.items ?? data.memories,
  );
  return rawResults
    .map((item, index) => normalizeHttpRecall(item, index))
    .filter((item): item is RecallResult => Boolean(item));
}

async function ingestViaMcp(sessionId: string, turn: Turn): Promise<void> {
  const tags = [
    'relay',
    `session:${sanitizeTag(sessionId)}`,
    `role:${sanitizeTag(turn.role)}`,
    turn.model ? `model:${sanitizeTag(turn.model)}` : '',
  ]
    .filter(Boolean)
    .join(',');

  await callMcpTool('hold', {
    content: renderTurnForMcp(sessionId, turn),
    tags,
    importance: importanceForTurn(turn),
  });
}

async function recallViaMcp(
  query: string,
  opts: { topK?: number; sessionId?: string },
): Promise<RecallResult[]> {
  const topK = opts.topK ?? 6;
  const scopedQuery = opts.sessionId
    ? `session:${opts.sessionId} ${query}`
    : query;
  const raw = await callMcpTool('breath', {
    query: scopedQuery,
    max_results: topK,
  });

  const parts = raw
    .split(/\n---\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !looksLikeMcpMiss(part))
    .slice(0, topK);

  return parts.map((text, index) => ({
    text,
    score: Math.max(0.1, Number((1 - index * 0.1).toFixed(2))),
    metadata: {
      source: 'ombrebrain-mcp',
      scope: opts.sessionId ? 'session' : 'cross-session',
      rank: index,
    },
  }));
}

async function callMcpTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const client = await getMcpClient();

  try {
    const result = await client.callTool({ name, arguments: args });
    if ('toolResult' in result) {
      return typeof result.toolResult === 'string'
        ? result.toolResult
        : JSON.stringify(result.toolResult);
    }

    const text = result.content
      .map((item) => {
        if (item.type === 'text') return item.text;
        if (item.type === 'resource' && 'text' in item.resource) return item.resource.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');

    if (result.isError) {
      throw new Error(text || `MCP tool ${name} failed`);
    }
    return text;
  } catch (err) {
    await resetMcpClient();
    throw err;
  }
}

async function getMcpClient(): Promise<Client> {
  if (!mcpClientPromise) {
    mcpClientPromise = createMcpClient();
  }
  return mcpClientPromise;
}

async function createMcpClient(): Promise<Client> {
  const client = new Client({
    name: 'relay-memory',
    version: '0.1.0',
  });

  const transport = createMcpTransport();
  await client.connect(transport);

  const listed = await client.listTools().catch(() => null);
  const toolNames = new Set((listed?.tools ?? []).map((tool) => tool.name));
  if (!toolNames.has('hold') || !toolNames.has('breath')) {
    await client.close();
    throw new Error('OmbreBrain MCP server is missing required hold/breath tools');
  }

  return client;
}

function createMcpTransport() {
  if (config.ombrebrain.mcpTransport === 'stdio') {
    if (!config.ombrebrain.mcpCommand) {
      throw new Error('OMBREBRAIN_MCP_COMMAND is required for stdio mode');
    }
    return new StdioClientTransport({
      command: config.ombrebrain.mcpCommand,
      args: config.ombrebrain.mcpArgs,
      env: {
        ...processEnvStrings(),
        ...config.ombrebrain.mcpEnv,
      },
      stderr: 'inherit',
    });
  }

  if (!config.ombrebrain.mcpUrl) {
    throw new Error('OMBREBRAIN_MCP_URL is required for streamable-http mode');
  }

  const headers = config.ombrebrain.apiKey
    ? { authorization: `Bearer ${config.ombrebrain.apiKey}` }
    : undefined;

  return new StreamableHTTPClientTransport(new URL(config.ombrebrain.mcpUrl), {
    requestInit: headers ? { headers } : undefined,
  });
}

async function resetMcpClient(): Promise<void> {
  const current = mcpClientPromise;
  mcpClientPromise = null;
  if (!current) return;

  try {
    const client = await current;
    await client.close();
  } catch {}
}

function httpUrl(pathname: string): string {
  return `${config.ombrebrain.url.replace(/\/$/, '')}${pathname}`;
}

function httpHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (config.ombrebrain.apiKey) h.authorization = `Bearer ${config.ombrebrain.apiKey}`;
  return h;
}

function renderTurnForMcp(sessionId: string, turn: Turn): string {
  const attachmentSummary = turn.attachments.length
    ? turn.attachments
        .map((att) => `- ${att.kind}: ${att.name}`)
        .join('\n')
    : '';

  return [
    `session:${sessionId}`,
    `turn:${turn.index}`,
    `role:${turn.role}`,
    turn.model ? `model:${turn.model}` : '',
    `createdAt:${turn.createdAt}`,
    attachmentSummary ? `attachments:\n${attachmentSummary}` : '',
    '',
    turn.content,
  ]
    .filter(Boolean)
    .join('\n');
}

function importanceForTurn(turn: Turn): number {
  if (turn.role === 'user') return 7;
  if (turn.role === 'system') return 4;
  return 5;
}

function sanitizeTag(value: string): string {
  return value.replace(/[,\s]+/g, '_');
}

function looksLikeMcpMiss(text: string): boolean {
  return /未找到相关记忆|权重池平静|无法访问|检索过程出错/.test(text);
}

function normalizeResultArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

function normalizeHttpRecall(
  item: Record<string, unknown>,
  index: number,
): RecallResult | null {
  const text =
    asString(item.text) ??
    asString(item.content) ??
    asString(item.summary) ??
    asString(item.memory);
  if (!text) return null;

  const score =
    asNumber(item.score) ??
    asNumber(item.similarity) ??
    asNumber(item.weight) ??
    Math.max(0.1, 1 - index * 0.1);
  const metadata =
    (isRecord(item.metadata) && item.metadata) ||
    (isRecord(item.meta) && item.meta) ||
    { source: 'ombrebrain-http', rank: index };

  return { text, score, metadata };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function processEnvStrings(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}
