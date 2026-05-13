import { createAnthropicClient } from '@/lib/llm/anthropic';
import { createDeepSeekClient } from '@/lib/llm/deepseek';
import { createOpenAIClient } from '@/lib/llm/openai';
import { createQwenClient } from '@/lib/llm/qwen';
import type { LlmClient } from '@/lib/llm/types';
import { createWenxinClient } from '@/lib/llm/wenxin';

type Provider = LlmClient['provider'];

export function createLlmClient(provider: Provider = 'anthropic'): LlmClient {
  switch (provider) {
    case 'anthropic':
      return createAnthropicClient();
    case 'openai':
      return createOpenAIClient();
    case 'qwen':
      return createQwenClient();
    case 'wenxin':
      return createWenxinClient();
    case 'deepseek':
      return createDeepSeekClient();
    default:
      return createAnthropicClient();
  }
}
