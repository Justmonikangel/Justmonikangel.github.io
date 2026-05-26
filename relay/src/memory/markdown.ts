import { writeFile, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { sessionDir, readManifest, writeManifest } from '../lib/sessions.ts';
import type { Turn } from '../types.ts';

export async function appendTurn(sessionId: string, turn: Turn): Promise<Turn> {
  const manifest = await readManifest(sessionId);
  const stamped: Turn = { ...turn, index: manifest.turnCount + 1 };
  await writeFile(turnPath(sessionId, stamped.index, stamped.role), renderTurnMd(stamped));
  manifest.turnCount = stamped.index;
  await writeManifest(manifest);
  return stamped;
}

export async function loadTurns(sessionId: string, fromIndex = 1): Promise<Turn[]> {
  const dir = join(sessionDir(sessionId), 'turns');
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }
  const turns: Turn[] = [];
  for (const f of files.sort()) {
    const m = f.match(/^(\d+)-(\w+)\.md$/);
    if (!m) continue;
    const index = Number(m[1]);
    if (index < fromIndex) continue;
    const text = await readFile(join(dir, f), 'utf8');
    turns.push(parseTurnMd(text));
  }
  return turns;
}

function turnPath(sessionId: string, index: number, role: string): string {
  return join(sessionDir(sessionId), 'turns', `${String(index).padStart(4, '0')}-${role}.md`);
}

function renderTurnMd(turn: Turn): string {
  const lines = [
    '---',
    `index: ${turn.index}`,
    `role: ${turn.role}`,
    `createdAt: ${turn.createdAt}`,
  ];
  if (turn.model) lines.push(`model: ${turn.model}`);
  if (turn.tokens != null) lines.push(`tokens: ${turn.tokens}`);
  if (turn.attachments.length) lines.push(`attachments: ${JSON.stringify(turn.attachments)}`);
  lines.push('---', '');
  return lines.join('\n') + turn.content + '\n';
}

function parseTurnMd(text: string): Turn {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('invalid turn md');
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2];
  }
  return {
    index: Number(meta.index),
    role: meta.role as Turn['role'],
    content: m[2].replace(/\n$/, ''),
    attachments: meta.attachments ? JSON.parse(meta.attachments) : [],
    createdAt: meta.createdAt ?? new Date().toISOString(),
    model: meta.model,
    tokens: meta.tokens ? Number(meta.tokens) : undefined,
  };
}
