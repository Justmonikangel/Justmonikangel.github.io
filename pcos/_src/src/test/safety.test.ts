import { describe, expect, it } from 'vitest';

import { detectAllRedFlags, detectRedFlag } from '@/lib/safety/detect';

describe('red-flag detection', () => {
  it('returns null on empty / non-matching input', () => {
    expect(detectRedFlag('')).toBeNull();
    expect(detectRedFlag('我最近月经不规律，应该怎么办？')).toBeNull();
  });

  it('detects mental-health crisis keywords', () => {
    const match = detectRedFlag('我最近总是想死');
    expect(match).not.toBeNull();
    expect(match?.category).toBe('mental-health');
    expect(match?.severity).toBe('critical');
  });

  it('detects severe bleeding language', () => {
    const match = detectRedFlag('今天血崩，止不住');
    expect(match).not.toBeNull();
    expect(match?.category).toBe('severe-bleeding');
  });

  it('detects cardiovascular emergency phrases', () => {
    const match = detectRedFlag('我刚才胸痛了一下，还有点呼吸困难');
    expect(match).not.toBeNull();
    expect(match?.category).toBe('cardiovascular');
  });

  it('detects acute abdomen phrases', () => {
    const match = detectRedFlag('腹痛难忍，疼到出汗');
    expect(match).not.toBeNull();
    expect(match?.category).toBe('acute-abdomen');
  });

  it('detectAllRedFlags returns multiple matches when present', () => {
    const matches = detectAllRedFlags('我最近想死，而且胸痛');
    expect(matches.length).toBeGreaterThanOrEqual(2);
    const cats = matches.map((m) => m.category);
    expect(cats).toContain('mental-health');
    expect(cats).toContain('cardiovascular');
  });
});
