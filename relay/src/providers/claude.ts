import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import { config } from '../config.ts';
import type { Attachment, Turn } from '../types.ts';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function* streamClaude(opts: {
  system: string;
  turns: Turn[];
}): AsyncGenerator<string> {
  const messages = await Promise.all(opts.turns.map(toAnthropicMessage));
  const stream = client.messages.stream({
    model: config.claude.model,
    max_tokens: config.claude.maxTokens,
    system: opts.system,
    messages,
    thinking: {
      type: 'enabled',
      budget_tokens: config.claude.thinkingBudget,
    },
  });
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

async function toAnthropicMessage(turn: Turn): Promise<Anthropic.MessageParam> {
  const role: 'user' | 'assistant' = turn.role === 'claude' ? 'assistant' : 'user';
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const att of turn.attachments) {
    const block = await attachmentToBlock(att);
    if (block) blocks.push(block);
  }
  blocks.push({ type: 'text', text: prefixForRole(turn) + turn.content });
  return { role, content: blocks };
}

function prefixForRole(turn: Turn): string {
  if (turn.role === 'gpt') return '[from gpt]\n';
  return '';
}

async function attachmentToBlock(att: Attachment): Promise<Anthropic.ContentBlockParam | null> {
  if (att.kind === 'image') {
    const buf = await readFile(att.path);
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: att.mime as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
        data: buf.toString('base64'),
      },
    };
  }
  if (att.kind === 'pdf') {
    const buf = await readFile(att.path);
    return {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: buf.toString('base64'),
      },
    };
  }
  if (att.kind === 'text') {
    const text = await readFile(att.path, 'utf8');
    return { type: 'text', text: `--- attachment: ${att.name} ---\n${text}\n--- end ---` };
  }
  return null;
}
