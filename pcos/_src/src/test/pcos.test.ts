import { describe, expect, it } from 'vitest';

import { bmi, homaIR, rotterdam } from '@/lib/pcos';

describe('pcos helpers', () => {
  it('computes BMI', () => {
    expect(bmi(165, 60)).toBeCloseTo(22.0385, 3);
  });

  it('computes HOMA-IR', () => {
    expect(homaIR(5, 10)).toBeCloseTo(2.2222, 3);
  });

  it('detects Rotterdam phenotype A', () => {
    expect(
      rotterdam({
        oligoAnovulation: true,
        clinicalHA: true,
        biochemicalHA: false,
        pcom: true,
      }),
    ).toMatchObject({ meets: true, phenotype: 'A' });
  });
});
