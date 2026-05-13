import { createPlaceholderClient } from '@/lib/llm/placeholder';
import type { LlmClient } from '@/lib/llm/types';

export const OPENAI_MODEL = 'gpt-4o';

export function createOpenAIClient(): LlmClient {
  return createPlaceholderClient('openai', 'P4');
}
