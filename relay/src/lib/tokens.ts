import { countTokens as countAnthropicTokens } from '@anthropic-ai/tokenizer';
import { encodingForModel, type TiktokenModel } from 'js-tiktoken';

const gptEncoders = new Map<string, ReturnType<typeof encodingForModel>>();

export function estimateTokens(text: string, model?: string): number {
  if (!text) return 0;

  const normalizedModel = model?.trim().toLowerCase();
  if (!normalizedModel) return Math.ceil(text.length / 4);

  if (normalizedModel.includes('claude')) {
    return countAnthropicTokens(text);
  }

  if (looksLikeOpenAiModel(normalizedModel)) {
    try {
      let encoder = gptEncoders.get(normalizedModel);
      if (!encoder) {
        encoder = encodingForModel(normalizedModel as TiktokenModel);
        gptEncoders.set(normalizedModel, encoder);
      }
      return encoder.encode(text).length;
    } catch {}
  }

  return Math.ceil(text.length / 4);
}

function looksLikeOpenAiModel(model: string): boolean {
  return (
    model.startsWith('gpt') ||
    model.startsWith('o') ||
    model.startsWith('text-embedding') ||
    model.startsWith('chatgpt')
  );
}
