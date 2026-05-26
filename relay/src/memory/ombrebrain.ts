import { config } from '../config.ts';
import type { Turn } from '../types.ts';

export type RecallResult = {
  text: string;
  score: number;
  metadata: Record<string, unknown>;
};

export function ombreEnabled(): boolean {
  return Boolean(config.ombrebrain.url);
}

export async function ingestTurn(sessionId: string, turn: Turn): Promise<void> {
  if (!ombreEnabled()) return;
  try {
    await fetch(`${config.ombrebrain.url.replace(/\/$/, '')}/upsert`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        id: `${sessionId}:${turn.index}`,
        text: turn.content,
        metadata: {
          sessionId,
          turnIndex: turn.index,
          role: turn.role,
          createdAt: turn.createdAt,
          model: turn.model,
        },
      }),
    });
  } catch (err) {
    console.warn('[ombrebrain] ingest failed', err);
  }
}

export async function recall(
  query: string,
  opts: { topK?: number; sessionId?: string } = {},
): Promise<RecallResult[]> {
  if (!ombreEnabled() || !query.trim()) return [];
  try {
    const res = await fetch(`${config.ombrebrain.url.replace(/\/$/, '')}/query`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        query,
        top_k: opts.topK ?? 6,
        filters: opts.sessionId ? { sessionId: opts.sessionId } : undefined,
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: RecallResult[] };
    return data.results ?? [];
  } catch (err) {
    console.warn('[ombrebrain] query failed', err);
    return [];
  }
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (config.ombrebrain.apiKey) h.authorization = `Bearer ${config.ombrebrain.apiKey}`;
  return h;
}
