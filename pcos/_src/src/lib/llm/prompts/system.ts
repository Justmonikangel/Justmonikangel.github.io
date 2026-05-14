import type { PromptBlock } from '@/types/agent';

/**
 * Phase P0.5 stub. The full PromptBlock builder set lands in Commit 3 as
 * lib/llm/prompts/blocks.ts + safety.ts + medicalKnowledge.ts + userContext.ts.
 *
 * This file remains as a single entry point so existing imports don't break.
 * It returns an empty array; agent code path is not active until Phase P4.
 */
export function buildSystemPromptBlocks(): PromptBlock[] {
  return [];
}

/**
 * Legacy v1 API kept as a thin shim. New code should consume PromptBlock[]
 * via buildSystemPromptBlocks() instead.
 */
export function buildSystemPrompt(): string {
  return '';
}
