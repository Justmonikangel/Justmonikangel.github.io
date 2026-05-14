import type { ZodSchema } from 'zod';

import type { ChatMessage, PromptBlock, ToolCall } from '@/types/agent';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
}

export interface VisionImageInput {
  mimeType: string;
  data: string;
}

export interface VisionOpts {
  /**
   * v2: vision system prompt is a single text (no block-level caching
   * benefit on one-shot vision calls). For chat we use PromptBlock[].
   */
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
  /**
   * v2: system is an array of PromptBlock for Anthropic-style prompt caching.
   * Adapters translate this to provider-specific content blocks; the
   * Anthropic adapter applies cache_control = ephemeral on blocks with
   * `cache: 'ephemeral'`. See ARCHITECTURE-v2.md §12.
   */
  system: PromptBlock[];
  messages: ChatMessage[];
  tools?: ToolDef[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
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
