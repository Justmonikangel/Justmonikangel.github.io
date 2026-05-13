import type {
  ChatEvent,
  ChatOpts,
  LlmClient,
  VisionOpts,
  VisionResult,
} from '@/lib/llm/types';

/**
 * Common factory for not-yet-implemented LLM providers.
 *
 * Each provider adapter (anthropic, openai, qwen, wenxin, deepseek) returns
 * a placeholder client until the corresponding phase wires the real SDK call.
 * Phase labels match ARCHITECTURE-v2.md §19 (e.g. "P4" for chat, "P5" for vision).
 */
export function createPlaceholderClient(
  provider: LlmClient['provider'],
  enabledIn: string,
): LlmClient {
  const message = `${provider} client will be enabled in Phase ${enabledIn}.`;

  async function* chat(_opts: ChatOpts): AsyncIterable<ChatEvent> {
    void _opts;
    throw new Error(message);
  }

  async function vision(_opts: VisionOpts): Promise<VisionResult> {
    void _opts;
    throw new Error(message);
  }

  return { provider, chat, vision };
}
