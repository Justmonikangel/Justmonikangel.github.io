/**
 * Settings store.
 *
 * Persisted (in localStorage) but with two careful exceptions:
 *  - API key is stored separately via lib/storage.writeProviderKey using XOR
 *    + base64 obfuscation, not via this store.
 *  - The "save original images" toggle controls whether new uploads go to
 *    IndexedDB via lib/indexedDb. The flag itself is stored here.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { LlmClient } from '@/lib/llm/types';

export type ProviderId = LlmClient['provider'];

interface SettingsState {
  provider: ProviderId;
  model: string;
  proxyUrl: string;
  inviteCode: string;
  saveOriginalImages: boolean;
  setProvider: (provider: ProviderId) => void;
  setModel: (model: string) => void;
  setProxyUrl: (proxyUrl: string) => void;
  setInviteCode: (inviteCode: string) => void;
  setSaveOriginalImages: (value: boolean) => void;
}

export const PROVIDER_MODELS: Record<ProviderId, string[]> = {
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  qwen: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
  wenxin: ['ernie-4.0-turbo', 'ernie-3.5'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI',
  qwen: '通义千问',
  wenxin: '文心一言',
  deepseek: 'DeepSeek',
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      proxyUrl: '',
      inviteCode: '',
      saveOriginalImages: false,
      setProvider: (provider) =>
        set({
          provider,
          model: PROVIDER_MODELS[provider][0],
        }),
      setModel: (model) => set({ model }),
      setProxyUrl: (proxyUrl) => set({ proxyUrl }),
      setInviteCode: (inviteCode) => set({ inviteCode }),
      setSaveOriginalImages: (saveOriginalImages) => set({ saveOriginalImages }),
    }),
    { name: 'cyster.settings.v1' },
  ),
);
