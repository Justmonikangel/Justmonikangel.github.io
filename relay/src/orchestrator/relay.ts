import { streamClaude } from '../providers/claude.ts';
import { streamGpt } from '../providers/gpt.ts';
import { appendTurn } from '../memory/markdown.ts';
import { ingestTurn } from '../memory/ombrebrain.ts';
import { buildContext } from '../memory/recall.ts';
import { maybeCompact } from './compaction.ts';
import { loadSkills } from '../skills/loader.ts';
import { estimateTokens } from '../lib/tokens.ts';
import { readManifest } from '../lib/sessions.ts';
import type { Attachment, ProviderTarget, Turn } from '../types.ts';

export async function* runTurn(opts: {
  sessionId: string;
  target: ProviderTarget;
  userMessage?: { content: string; attachments: Attachment[] };
}): AsyncGenerator<string> {
  if (opts.userMessage) {
    const stamped = await appendTurn(opts.sessionId, {
      index: 0,
      role: 'user',
      content: opts.userMessage.content,
      attachments: opts.userMessage.attachments,
      createdAt: new Date().toISOString(),
      tokens: estimateTokens(opts.userMessage.content),
    });
    void ingestTurn(opts.sessionId, stamped);
  }

  await maybeCompact(opts.sessionId);

  const manifest = await readManifest(opts.sessionId);
  const queryHint = opts.userMessage?.content || manifest.title;
  const ctx = await buildContext(opts.sessionId, queryHint);
  const skills = await loadSkills(manifest.skills);
  const system = composeSystem(opts.target, ctx.digest, ctx.semantic, skills);

  let assistantText = '';
  const stream = opts.target === 'claude'
    ? streamClaude({ system, turns: ctx.recentTurns })
    : streamGpt({ system, turns: ctx.recentTurns });

  for await (const chunk of stream) {
    assistantText += chunk;
    yield chunk;
  }

  const stamped = await appendTurn(opts.sessionId, {
    index: 0,
    role: opts.target,
    content: assistantText,
    attachments: [],
    createdAt: new Date().toISOString(),
    tokens: estimateTokens(assistantText),
    model: opts.target === 'claude' ? 'claude' : 'gpt',
  });
  void ingestTurn(opts.sessionId, stamped);
}

function composeSystem(
  target: ProviderTarget,
  digest: string,
  semantic: string,
  skills: string,
): string {
  const me = target === 'claude' ? 'Claude' : 'GPT';
  const other = target === 'claude' ? 'GPT' : 'Claude';
  const parts = [
    `You are ${me}, working with ${other} and a human user.`,
    `The user relays turns between you and ${other} while editing a paper or CV. Messages tagged "[from ${other.toLowerCase()}]" are ${other}'s prior turn — engage with them directly; do not impersonate the user.`,
    `Operate at maximum reasoning effort. Be concrete, structured, and specific. When you give feedback, mark what is high-impact vs. nit.`,
  ];
  if (digest) parts.push(`# Prior conversation digest\n\n${digest}`);
  if (semantic) parts.push(`# Relevant memories\n\n${semantic}`);
  if (skills) parts.push(`# Skills\n\n${skills}`);
  return parts.join('\n\n');
}
