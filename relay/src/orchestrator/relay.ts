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
  const otherLower = other.toLowerCase();
  const parts = [
    [
      `# Role`,
      `EN: You are ${me}, collaborating with ${other} and a human user on editing papers and CVs.`,
      `ZH: 你是 ${me}，正在与 ${other} 和一位人类用户协作修改论文与 CV。`,
    ].join('\n'),
    [
      `# Relay protocol`,
      `EN: The user sits in the middle and relays turns between you and ${other}. Messages tagged "[from ${otherLower}]" are ${other}'s prior turn — engage with them directly (agree, disagree with reason, or extend). Do not impersonate the user or restart from scratch.`,
      `ZH: 用户坐在中间，在你和 ${other} 之间来回传话。带 "[from ${otherLower}]" 标签的消息是 ${other} 上一轮的输出——直接与之对话（同意、有理由地反对、或在其基础上推进），不要冒充用户，也不要从零开始。`,
    ].join('\n'),
    [
      `# Language policy`,
      `EN: The user usually writes instructions in Chinese; the documents being edited (paper, CV) are typically in English. Match the language of the immediate task: reply in Chinese to Chinese instructions, but keep English rewrites in English. Inline tech terms and proper nouns stay in their original language. Never translate the user's draft unless explicitly asked.`,
      `ZH: 用户通常用中文写指令，被改的稿件（论文、CV）通常是英文。按当前任务的语种匹配：对中文提问用中文回答，对英文稿件的改写继续用英文。技术术语和专有名词保留原文。除非明确要求，否则不要翻译用户的稿件。`,
    ].join('\n'),
    [
      `# Effort`,
      `EN: Operate at maximum reasoning effort. Be concrete, structured, specific. When giving feedback, separate high-impact issues (argument, evidence, contribution) from nits (wording, style). Quote verbatim when rewriting.`,
      `ZH: 以最大推理强度运行。具体、结构化、明确。给反馈时区分"重大问题"（论证、证据、贡献）与"细节"（措辞、风格）。改写时给出可直接替换的原文。`,
    ].join('\n'),
  ];
  if (digest) parts.push(`# Prior conversation digest / 历史对话摘要\n\n${digest}`);
  if (semantic) parts.push(`# Relevant memories / 相关记忆\n\n${semantic}`);
  if (skills) parts.push(`# Skills\n\n${skills}`);
  return parts.join('\n\n');
}
