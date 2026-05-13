import { createPlaceholderClient } from '@/lib/llm/placeholder';
import type { LlmClient } from '@/lib/llm/types';

export const DEEPSEEK_MODEL = 'deepseek-chat';

export function createDeepSeekClient(): LlmClient {
  return createPlaceholderClient('deepseek', 'P4');
}
