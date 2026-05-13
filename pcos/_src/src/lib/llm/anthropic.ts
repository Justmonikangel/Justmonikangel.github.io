import type { ChatEvent, ChatOpts, LlmClient, VisionOpts, VisionResult } from '@/lib/llm/types';

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

async function* notReadyChat(): AsyncIterable<ChatEvent> {
  yield* [];
  throw new Error('Anthropic client will be enabled in Phase P4.');
}

async function notReadyVision(_opts: VisionOpts): Promise<VisionResult> {
  void _opts;
  throw new Error('Anthropic vision will be enabled in Phase P5.');
}

export function createAnthropicClient(): LlmClient {
  return {
    provider: 'anthropic',
    chat(_opts: ChatOpts) {
      void _opts;
      return notReadyChat();
    },
    vision: notReadyVision,
  };
}
