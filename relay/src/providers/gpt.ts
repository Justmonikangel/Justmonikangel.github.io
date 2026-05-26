import OpenAI from 'openai';
import type {
  ResponseCreateParamsStreaming,
  ResponseStreamEvent,
} from 'openai/resources/responses/responses';
import { readFile } from 'node:fs/promises';
import { config } from '../config.ts';
import type { Attachment, Turn } from '../types.ts';

let client: OpenAI | null = null;

export async function* streamGpt(opts: {
  system: string;
  turns: Turn[];
}): AsyncGenerator<string> {
  const openai = getClient();
  const input: any[] = [{ role: 'system', content: opts.system }];
  for (const t of opts.turns) {
    input.push(await toResponsesMessage(t));
  }
  const stream = await openai.responses.create({
    model: config.gpt.model,
    reasoning: { effort: config.gpt.reasoningEffort },
    input,
    stream: true,
  } as ResponseCreateParamsStreaming) as unknown as AsyncIterable<ResponseStreamEvent>;

  const emittedByPart = new Map<string, string>();
  for await (const event of stream) {
    const chunk = extractDisplayText(event, emittedByPart);
    if (chunk) {
      yield chunk;
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

function extractDisplayText(
  event: ResponseStreamEvent,
  emittedByPart: Map<string, string>,
): string {
  switch (event.type) {
    case 'response.output_text.delta': {
      const key = partKey(event.item_id, event.content_index);
      emittedByPart.set(key, (emittedByPart.get(key) ?? '') + event.delta);
      return event.delta;
    }
    case 'response.output_text.done': {
      const key = partKey(event.item_id, event.content_index);
      return remainderForDone(key, event.text, emittedByPart);
    }
    case 'response.refusal.delta': {
      const key = partKey(event.item_id, event.content_index);
      emittedByPart.set(key, (emittedByPart.get(key) ?? '') + event.delta);
      return event.delta;
    }
    case 'response.refusal.done': {
      const key = partKey(event.item_id, event.content_index);
      return remainderForDone(key, event.refusal, emittedByPart);
    }
    case 'response.reasoning_text.delta':
    case 'response.reasoning_text.done':
    case 'response.reasoning_summary_text.delta':
    case 'response.reasoning_summary_text.done':
      return '';
    default:
      return '';
  }
}

function remainderForDone(
  key: string,
  fullText: string,
  emittedByPart: Map<string, string>,
): string {
  const alreadyEmitted = emittedByPart.get(key) ?? '';
  emittedByPart.set(key, fullText);
  if (!alreadyEmitted) return fullText;
  if (fullText.startsWith(alreadyEmitted)) {
    return fullText.slice(alreadyEmitted.length);
  }
  return '';
}

function partKey(itemId: string, contentIndex: number): string {
  return `${itemId}:${contentIndex}`;
}

function getClient(): OpenAI {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  if (!client) {
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}
