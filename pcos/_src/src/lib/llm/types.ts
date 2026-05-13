import type { ZodSchema } from 'zod';

import type { ChatMessage, ToolCall } from '@/types/agent';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface VisionImageInput {
  mimeType: string;
  data: string;
}

export interface VisionOpts {
  system: string;
  images: VisionImageInput[];
  schema?: ZodSchema;
  model?: string;
}

export interface VisionResult {
  rawText: string;
  structured?: unknown;
}

export interface ChatOpts {
  system: string;
  messages: ChatMessage[];
  tools?: ToolDef[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  cacheKey?: string;
}

export type ChatEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'tool-call'; call: ToolCall }
  | { type: 'tool-result'; id: string; result: unknown }
  | { type: 'done'; usage: TokenUsage };

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: ZodSchema;
}

export interface LlmClient {
  provider: 'anthropic' | 'openai' | 'qwen' | 'wenxin' | 'deepseek';
  chat(opts: ChatOpts): AsyncIterable<ChatEvent>;
  vision(opts: VisionOpts): Promise<VisionResult>;
}
