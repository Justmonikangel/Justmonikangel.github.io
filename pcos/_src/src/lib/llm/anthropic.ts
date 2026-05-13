import { createPlaceholderClient } from '@/lib/llm/placeholder';
import type { LlmClient } from '@/lib/llm/types';

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
export const ANTHROPIC_VISION_MODEL = 'claude-sonnet-4-6';

export function createAnthropicClient(): LlmClient {
  return createPlaceholderClient('anthropic', 'P4');
}
