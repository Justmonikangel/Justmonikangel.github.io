import type { HormonePanel } from '@/types/report';

export type CyclePhase = 'follicular' | 'ovulatory' | 'luteal' | 'postmenopausal';

/**
 * Reference ranges by cycle phase. Units must match HormonePanel field units.
 *
 * NOTE: these are reference-only defaults aggregated from common lab sources.
 * Real lab reports vary; in production we must use the issuing lab's reference
 * range printed on the report, not these defaults. UI must show that ranges
 * came from "lab" when available, else "Cyster default".
 */
export const hormoneReferenceRanges: Record<
  keyof HormonePanel,
  Partial<Record<CyclePhase, [number, number]>>
> = {
  // FSH (IU/L)
  FSH: {
    follicular: [3, 10],
    ovulatory: [4, 25],
    luteal: [1, 9],
    postmenopausal: [25, 135],
  },
  // LH (IU/L)
  LH: {
    follicular: [2, 12],
    ovulatory: [14, 96],
    luteal: [1, 12],
    postmenopausal: [8, 60],
  },
  // Estradiol (pg/mL)
  E2: {
    follicular: [20, 160],
    ovulatory: [40, 400],
    luteal: [27, 246],
    postmenopausal: [0, 30],
  },
  // Progesterone (ng/mL)
  P: {
    follicular: [0.1, 1.5],
    ovulatory: [0.2, 1.5],
    luteal: [3, 25],
    postmenopausal: [0, 1],
  },
  // Total testosterone (ng/dL, female)
  T: {
    follicular: [15, 70],
    ovulatory: [15, 70],
    luteal: [15, 70],
    postmenopausal: [10, 60],
  },
  // Free testosterone (pg/mL)
  freeT: {
    follicular: [0.1, 6.4],
    ovulatory: [0.1, 6.4],
    luteal: [0.1, 6.4],
    postmenopausal: [0.1, 5],
  },
  // DHEAS (μg/dL)
  DHEAS: {
    follicular: [35, 430],
    ovulatory: [35, 430],
    luteal: [35, 430],
    postmenopausal: [30, 260],
  },
  // SHBG (nmol/L)
  SHBG: {
    follicular: [30, 90],
    ovulatory: [30, 90],
    luteal: [30, 90],
    postmenopausal: [20, 130],
  },
  // AMH (ng/mL). PCOS often elevated; reference is general female premenopausal.
  AMH: {
    follicular: [1.0, 6.8],
    ovulatory: [1.0, 6.8],
    luteal: [1.0, 6.8],
    postmenopausal: [0, 1.5],
  },
  // Prolactin (ng/mL)
  Prolactin: {
    follicular: [4.8, 23.3],
    ovulatory: [4.8, 23.3],
    luteal: [4.8, 23.3],
    postmenopausal: [4.8, 23.3],
  },
  // TSH (mIU/L). Critical exclusion check.
  TSH: {
    follicular: [0.4, 4.0],
    ovulatory: [0.4, 4.0],
    luteal: [0.4, 4.0],
    postmenopausal: [0.4, 4.0],
  },
  // 17-OH progesterone (ng/mL). Critical exclusion for CAH.
  '17OHP': {
    follicular: [0.2, 1.0],
    ovulatory: [0.2, 1.0],
    luteal: [0.2, 4.0],
    postmenopausal: [0.1, 1.0],
  },
};

export const follicularRanges: Partial<Record<keyof HormonePanel, [number, number]>> = (() => {
  const out: Partial<Record<keyof HormonePanel, [number, number]>> = {};
  for (const key of Object.keys(hormoneReferenceRanges) as Array<keyof HormonePanel>) {
    const range = hormoneReferenceRanges[key]?.follicular;
    if (range) {
      out[key] = range;
    }
  }
  return out;
})();

export type HormoneFlag = 'low' | 'normal' | 'high' | 'borderline';

/**
 * Classify a hormone value against the reference range for a given phase.
 *
 * Borderline = within 10% of range edges. UI should treat borderline as a
 * yellow flag rather than a red one.
 */
export function flagForHormoneValue(
  field: keyof HormonePanel,
  value: number,
  phase: CyclePhase = 'follicular',
): HormoneFlag {
  const range = hormoneReferenceRanges[field]?.[phase];
  if (!range) {
    return 'normal';
  }
  const [lo, hi] = range;
  if (value < lo * 0.9) return 'low';
  if (value > hi * 1.1) return 'high';
  if (value < lo || value > hi) return 'borderline';
  return 'normal';
}
