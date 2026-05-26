import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadTurns } from '../memory/markdown.ts';
import { readManifest, writeManifest, sessionDir } from '../lib/sessions.ts';
import { streamClaude } from '../providers/claude.ts';
import { estimateTokens } from '../lib/tokens.ts';
import { config } from '../config.ts';
import type { Turn } from '../types.ts';

export async function maybeCompact(sessionId: string): Promise<void> {
  const manifest = await readManifest(sessionId);
  const live = await loadTurns(sessionId, manifest.compactedThrough + 1);
  const totalTokens = live.reduce(
    (sum, t) => sum + (t.tokens ?? estimateTokens(t.content)),
    0,
  );
  if (totalTokens < config.compaction.thresholdTokens) return;

  const keep = config.compaction.keepRecentTurns;
  const toCompact = live.slice(0, Math.max(0, live.length - keep));
  if (!toCompact.length) return;

  const digest = await summarize(toCompact);
  const through = toCompact[toCompact.length - 1].index;
  const path = join(
    sessionDir(sessionId),
    'digests',
    `${String(through).padStart(4, '0')}-digest.md`,
  );
  await writeFile(path, digest);
  manifest.compactedThrough = through;
  await writeManifest(manifest);
}

async function summarize(turns: Turn[]): Promise<string> {
  const transcript = turns
    .map((t) => `## ${t.role} (turn ${t.index})\n${t.content}`)
    .join('\n\n');
  const system = [
    'You are compressing a multi-party transcript between a user, GPT, and Claude.',
    'The user iterates on a paper or CV; both models give feedback in alternation.',
    'Produce a digest preserving: decisions made, themes of feedback (organized by section/topic), open questions, commitments, and notable verbatim quotes.',
    'Be lossless on facts; drop pleasantries and process talk.',
    'Use Markdown with clear section headers.',
  ].join(' ');
  let out = '';
  for await (const chunk of streamClaude({
    system,
    turns: [
      {
        index: 0,
        role: 'user',
        content: `Compress this transcript:\n\n${transcript}`,
        attachments: [],
        createdAt: new Date().toISOString(),
      },
    ],
  })) {
    out += chunk;
  }
  const last = turns[turns.length - 1].index;
  return `# Digest through turn ${last}\n\nGenerated: ${new Date().toISOString()}\n\n${out}\n`;
}
