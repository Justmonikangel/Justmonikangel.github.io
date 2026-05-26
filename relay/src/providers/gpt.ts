import OpenAI from 'openai';
import { readFile } from 'node:fs/promises';
import { config } from '../config.ts';
import type { Attachment, Turn } from '../types.ts';

const client = new OpenAI({ apiKey: config.openaiApiKey });

export async function* streamGpt(opts: {
  system: string;
  turns: Turn[];
}): AsyncGenerator<string> {
  const input: any[] = [
    { role: 'system', content: opts.system },
  ];
  for (const t of opts.turns) {
    input.push(await toResponsesMessage(t));
  }
  const stream = await client.responses.create({
    model: config.gpt.model,
    reasoning: { effort: config.gpt.reasoningEffort },
    input,
    stream: true,
  } as any);
  for await (const event of stream as any) {
    if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
      yield event.delta;
    }
  }
}

async function toResponsesMessage(turn: Turn): Promise<any> {
  const role = turn.role === 'gpt' ? 'assistant' : 'user';
  const text = prefixForRole(turn) + turn.content;
  const content: any[] = [{ type: role === 'assistant' ? 'output_text' : 'input_text', text }];
  for (const att of turn.attachments) {
    const part = await attachmentToPart(att);
    if (part) content.push(part);
  }
  return { role, content };
}

function prefixForRole(turn: Turn): string {
  if (turn.role === 'claude') return '[from claude]\n';
  return '';
}

async function attachmentToPart(att: Attachment): Promise<any | null> {
  if (att.kind === 'image') {
    const buf = await readFile(att.path);
    const dataUrl = `data:${att.mime};base64,${buf.toString('base64')}`;
    return { type: 'input_image', image_url: dataUrl };
  }
  if (att.kind === 'text') {
    const text = await readFile(att.path, 'utf8');
    return { type: 'input_text', text: `--- attachment: ${att.name} ---\n${text}\n--- end ---` };
  }
  if (att.kind === 'pdf') {
    const buf = await readFile(att.path);
    return {
      type: 'input_file',
      filename: att.name,
      file_data: `data:application/pdf;base64,${buf.toString('base64')}`,
    };
  }
  return null;
}
