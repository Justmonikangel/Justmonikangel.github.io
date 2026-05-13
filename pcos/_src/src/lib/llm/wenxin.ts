import { createPlaceholderClient } from '@/lib/llm/placeholder';
import type { LlmClient } from '@/lib/llm/types';

export const WENXIN_MODEL = 'ernie-4.0-turbo';

export function createWenxinClient(): LlmClient {
  return createPlaceholderClient('wenxin', 'P4');
}
