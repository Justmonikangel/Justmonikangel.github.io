import { describe, expect, it } from 'vitest';

import { readProviderKey, writeProviderKey } from '@/lib/storage';

describe('provider key storage', () => {
  it('round-trips obfuscated provider keys through local storage', () => {
    writeProviderKey('anthropic', 'test-key');
    expect(readProviderKey('anthropic')).toBe('test-key');
  });
});
