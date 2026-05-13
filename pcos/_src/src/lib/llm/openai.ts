import type { ChatEvent, ChatOpts, LlmClient, VisionOpts, VisionResult } from '@/lib/llm/types';

async function* notReadyChat(): AsyncIterable<ChatEvent> {
  yield* [];
  throw new Error('OpenAI client is scaffolded but not implemented yet.');
}

async function notReadyVision(_opts: VisionOpts): Promise<VisionResult> {
  void _opts;
  throw new Error('OpenAI vision is scaffolded but not implemented yet.');
}

export function createOpenAIClient(): LlmClient {
  return {
    provider: 'openai',
    chat(_opts: ChatOpts) {
      void _opts;
      return notReadyChat();
    },
    vision: notReadyVision,
  };
}
