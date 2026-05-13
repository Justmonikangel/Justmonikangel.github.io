import { describe, expect, it } from 'vitest';

import { follicularRanges } from '@/lib/hormones';

describe('hormone ranges', () => {
  it('includes follicular FSH range', () => {
    expect(follicularRanges.FSH).toEqual([3, 10]);
  });
});
