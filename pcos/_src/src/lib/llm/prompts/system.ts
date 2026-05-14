import { buildSystemBlocks } from '@/lib/llm/prompts/blocks';
import type { PromptBlock } from '@/types/agent';
import type { UserContextInput } from '@/lib/llm/prompts/userContext';

/**
 * Primary entrypoint for assembling the system prompt as a PromptBlock[].
 *
 * v2: this is the only supported shape. v1's buildSystemPrompt(ctx): string
 * has been removed — there's no string-only fallback that would honor the
 * cache_control invariants in ARCHITECTURE-v2.md §12.
 */
export function buildSystemPromptBlocks(user: UserContextInput): PromptBlock[] {
  return buildSystemBlocks(user);
}
