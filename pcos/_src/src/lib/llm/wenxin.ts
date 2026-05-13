import type { ChatEvent, ChatOpts, LlmClient, VisionOpts, VisionResult } from '@/lib/llm/types';

async function* notReadyChat(): AsyncIterable<ChatEvent> {
  yield* [];
  throw new Error('Wenxin client is scaffolded but not implemented yet.');
}

async function notReadyVision(_opts: VisionOpts): Promise<VisionResult> {
  void _opts;
  throw new Error('Wenxin vision is scaffolded but not implemented yet.');
}

export function createWenxinClient(): LlmClient {
  return {
    provider: 'wenxin',
    chat(_opts: ChatOpts) {
      void _opts;
      return notReadyChat();
    },
    vision: notReadyVision,
  };
}
