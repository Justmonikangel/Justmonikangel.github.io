import { obfuscateSecret, revealSecret } from '@/lib/crypto';

const PROVIDER_KEY_PREFIX = 'cyster.provider-key';

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getItem(key: string) {
  if (!hasStorage()) {
    return null;
  }

  return window.localStorage.getItem(key);
}

export function setItem(key: string, value: string) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function removeItem(key: string) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(key);
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  setItem(key, JSON.stringify(value));
}

export function readProviderKey(provider: string) {
  const value = getItem(`${PROVIDER_KEY_PREFIX}.${provider}`);
  return value ? revealSecret(value) : null;
}

export function writeProviderKey(provider: string, value: string) {
  setItem(`${PROVIDER_KEY_PREFIX}.${provider}`, obfuscateSecret(value));
}
