import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../config.ts';
import { loadTurns } from './markdown.ts';
import { recall } from './ombrebrain.ts';
import { readManifest, sessionDir } from '../lib/sessions.ts';
import type { Turn } from '../types.ts';

export type BuiltContext = {
  recentTurns: Turn[];
  digest: string;
  semantic: string;
};

export async function buildContext(sessionId: string, queryHint: string): Promise<BuiltContext> {
  const manifest = await readManifest(sessionId);
  const startFrom = Math.max(
    manifest.compactedThrough + 1,
    manifest.turnCount - config.compaction.keepRecentTurns + 1,
    1,
  );
  const recentTurns = await loadTurns(sessionId, startFrom);
  const digest = await readLatestDigest(sessionId);
  const semantic = await renderSemantic(queryHint, sessionId);
  return { recentTurns, digest, semantic };
}

async function readLatestDigest(sessionId: string): Promise<string> {
  const dir = join(sessionDir(sessionId), 'digests');
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return '';
  }
  const latest = files.filter((f) => f.endsWith('.md')).sort().pop();
  if (!latest) return '';
  return readFile(join(dir, latest), 'utf8');
}

async function renderSemantic(query: string, sessionId: string): Promise<string> {
  const local = await recall(query, { sessionId, topK: 4 });
  const cross = await recall(query, { topK: 4 });
  const seen = new Set<string>();
  const all = [...local, ...cross].filter((r) => {
    const key = `${r.text}\n${JSON.stringify(r.metadata)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!all.length) return '';
  return all
    .map((r, i) => `### memory ${i + 1} (score ${r.score.toFixed(2)})\n${r.text}`)
    .join('\n\n');
}
