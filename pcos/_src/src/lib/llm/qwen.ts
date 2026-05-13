import { createPlaceholderClient } from '@/lib/llm/placeholder';
import type { LlmClient } from '@/lib/llm/types';

export const QWEN_MODEL = 'qwen-max';

export function createQwenClient(): LlmClient {
  return createPlaceholderClient('qwen', 'P4');
}
