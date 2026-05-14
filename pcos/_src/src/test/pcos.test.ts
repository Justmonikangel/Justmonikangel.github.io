import { describe, expect, it } from 'vitest';

import { bmi, homaIR, pcosFeatureMap } from '@/lib/pcos';
import type { FeatureFlag } from '@/types/common';

const present = (evidence: string): FeatureFlag => ({ status: 'present', evidence: [evidence] });
const absent = (evidence: string): FeatureFlag => ({ status: 'absent', evidence: [evidence] });
const unknown = (evidence: string): FeatureFlag => ({ status: 'unknown', evidence: [evidence] });

function exclusions(allNormal = true) {
  const status = allNormal ? 'normal' : 'unchecked';
  return {
    thyroid: { status },
    prolactin: { status },
    cah17OHP: { status },
    fsh: { status },
    cushing: { status },
    androgenSecretingTumor: { status },
  } as const;
}

describe('pcos helpers', () => {
  it('computes BMI', () => {
    expect(bmi(165, 60)).toBeCloseTo(22.0385, 3);
  });

  it('computes HOMA-IR', () => {
    expect(homaIR(5, 10)).toBeCloseTo(2.2222, 3);
  });
});

describe('pcosFeatureMap (2023 Intl Guideline)', () => {
  it('adult, 2/3 features + exclusions normal: literacy summary is consistent', () => {
    const map = pcosFeatureMap({
      id: 'fm-1',
      population: 'adult',
      ovulatoryDysfunction: present('cycles > 35d, 5/12 last year'),
      hyperandrogenism: {
        clinical: present('persistent acne + hirsutism'),
        biochemical: unknown('not reported'),
      },
      polycysticOvarianMorphology: {
        ultrasoundAFC: absent('AFC 12/12 on TVUS'),
        amh: absent('AMH 3.2 ng/mL'),
      },
      associated: {
        insulinResistance: unknown('not reported'),
        centralAdiposity: unknown('not reported'),
        depressionOrAnxietyRisk: unknown('not reported'),
      },
      exclusions: exclusions(true),
    });

    expect(map.criteriaReference).toBe('IntlPCOS2023');
    expect(map.disclaimer).toBe('feature-map-only-not-diagnosis');
    expect(map.literacyOutput.missingExclusions).toEqual([]);
    expect(map.literacyOutput.summary).toContain('PCOS');
    // Never use "confirmed"
    expect(map.literacyOutput.summary.toLowerCase()).not.toContain('confirmed');
    expect(map.literacyOutput.summary).not.toContain('确诊');
  });

  it('adult, 2/3 features but exclusions missing: literacy flags incomplete', () => {
    const map = pcosFeatureMap({
      id: 'fm-2',
      population: 'adult',
      ovulatoryDysfunction: present('cycles > 35d'),
      hyperandrogenism: {
        clinical: present('hirsutism'),
        biochemical: unknown('not reported'),
      },
      polycysticOvarianMorphology: {
        ultrasoundAFC: absent('not done'),
        amh: absent('not done'),
      },
      associated: {
        insulinResistance: unknown(''),
        centralAdiposity: unknown(''),
        depressionOrAnxietyRisk: unknown(''),
      },
      exclusions: exclusions(false),
    });

    expect(map.literacyOutput.missingExclusions.length).toBeGreaterThan(0);
    expect(map.literacyOutput.summary).toContain('排除性检查未完成');
  });

  it('adolescent, ultrasound/AMH must not count as PCOM evidence', () => {
    const map = pcosFeatureMap({
      id: 'fm-3',
      population: 'adolescent',
      ovulatoryDysfunction: present('irregular cycles since menarche 2 years ago'),
      hyperandrogenism: {
        clinical: absent('no clinical signs'),
        biochemical: absent('lab normal'),
      },
      polycysticOvarianMorphology: {
        ultrasoundAFC: present('AFC 28/26 on TVUS'),
        amh: present('AMH 8.1 ng/mL'),
      },
      associated: {
        insulinResistance: unknown(''),
        centralAdiposity: unknown(''),
        depressionOrAnxietyRisk: unknown(''),
      },
      exclusions: exclusions(true),
    });

    expect(map.features.polycysticOvarianMorphology.applicableForPopulation).toBe(false);
    expect(map.features.polycysticOvarianMorphology.ultrasoundAFC.status).toBe('unknown');
    expect(map.features.polycysticOvarianMorphology.amh.status).toBe('unknown');
    // With only PCOM evidence present, adolescent should NOT be flagged consistent
    expect(map.literacyOutput.consistentFeatures.length).toBeLessThanOrEqual(1);
  });

  it('insufficient data: summary acknowledges no typical pattern', () => {
    const map = pcosFeatureMap({
      id: 'fm-4',
      population: 'adult',
      ovulatoryDysfunction: unknown(''),
      hyperandrogenism: {
        clinical: unknown(''),
        biochemical: unknown(''),
      },
      polycysticOvarianMorphology: {
        ultrasoundAFC: unknown(''),
        amh: unknown(''),
      },
      associated: {
        insulinResistance: unknown(''),
        centralAdiposity: unknown(''),
        depressionOrAnxietyRisk: unknown(''),
      },
      exclusions: exclusions(false),
    });

    expect(map.literacyOutput.consistentFeatures).toEqual([]);
    expect(map.literacyOutput.summary).toMatch(/未呈现|尚不足以/);
  });
});
