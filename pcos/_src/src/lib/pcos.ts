import type { ExclusionStatus, FeatureFlag } from '@/types/common';
import type { PcosFeatureMap } from '@/types/report';

/**
 * Build a PcosFeatureMap from already-evaluated feature flags and exclusion
 * statuses, per the 2023 International PCOS Guideline.
 *
 * This function is intentionally a pure mapping — feature classification
 * (e.g. "is AFC >= 20?", "is irregular cycle?") happens upstream in agent
 * tools or UI forms. Here we only assemble the structured map.
 *
 * Key invariants:
 *  - For adolescent (years-since-menarche < 8): AMH and ultrasound MUST NOT
 *    count toward PCOM evidence. `polycysticOvarianMorphology.applicableForPopulation`
 *    is forced to `false` and both PCOM sub-flags are downgraded to 'unknown'.
 *  - For adult: AMH and ultrasound are independently usable; either-or is fine.
 *  - We never output the word "diagnosed" / "confirmed". The literacy summary
 *    is computed on the consistency of features after exclusion completeness.
 *  - disclaimer is always the literal string 'feature-map-only-not-diagnosis'.
 */
export interface PcosFeatureMapInput {
  id: string;
  reportId?: string;
  population: 'adult' | 'adolescent' | 'unknown';
  ovulatoryDysfunction: FeatureFlag;
  hyperandrogenism: {
    clinical: FeatureFlag;
    biochemical: FeatureFlag;
  };
  polycysticOvarianMorphology: {
    ultrasoundAFC: FeatureFlag;
    amh: FeatureFlag;
  };
  associated: {
    insulinResistance: FeatureFlag;
    centralAdiposity: FeatureFlag;
    depressionOrAnxietyRisk: FeatureFlag;
  };
  exclusions: PcosFeatureMap['exclusionsChecked'];
}

export function pcosFeatureMap(input: PcosFeatureMapInput): PcosFeatureMap {
  const isAdolescent = input.population === 'adolescent';

  const pcom = isAdolescent
    ? {
        ultrasoundAFC: downgradeForAdolescent(input.polycysticOvarianMorphology.ultrasoundAFC),
        amh: downgradeForAdolescent(input.polycysticOvarianMorphology.amh),
        applicableForPopulation: false,
      }
    : {
        ultrasoundAFC: input.polycysticOvarianMorphology.ultrasoundAFC,
        amh: input.polycysticOvarianMorphology.amh,
        applicableForPopulation: true,
      };

  const presentFeatures = countPresent([
    input.ovulatoryDysfunction,
    eitherPresent(input.hyperandrogenism.clinical, input.hyperandrogenism.biochemical),
    isAdolescent ? absent('not-applicable-adolescent') : eitherPresent(pcom.ultrasoundAFC, pcom.amh),
  ]);

  const consistentFeatures = buildConsistentList(input, isAdolescent);
  const inconclusiveFeatures = buildInconclusiveList(input, isAdolescent);
  const missingExclusions = buildMissingExclusionsList(input.exclusions);
  const suggestedDoctorQuestions = buildDoctorQuestions(presentFeatures, missingExclusions, isAdolescent);

  const summary = buildSummary({
    presentFeatures,
    missingExclusionsCount: missingExclusions.length,
    isAdolescent,
  });

  return {
    id: input.id,
    reportId: input.reportId,
    computedAt: new Date().toISOString(),
    population: input.population,
    criteriaReference: 'IntlPCOS2023',
    features: {
      ovulatoryDysfunction: input.ovulatoryDysfunction,
      hyperandrogenism: input.hyperandrogenism,
      polycysticOvarianMorphology: pcom,
    },
    associatedFeatures: input.associated,
    exclusionsChecked: input.exclusions,
    literacyOutput: {
      summary,
      consistentFeatures,
      inconclusiveFeatures,
      missingExclusions,
      suggestedDoctorQuestions,
      relatedKnowledgeCardIds: [],
    },
    disclaimer: 'feature-map-only-not-diagnosis',
  };
}

function countPresent(flags: FeatureFlag[]): number {
  return flags.filter((f) => f.status === 'present').length;
}

function eitherPresent(a: FeatureFlag, b: FeatureFlag): FeatureFlag {
  if (a.status === 'present') return a;
  if (b.status === 'present') return b;
  if (a.status === 'borderline' || b.status === 'borderline') {
    return { status: 'borderline', evidence: [...a.evidence, ...b.evidence] };
  }
  if (a.status === 'unknown' || b.status === 'unknown') {
    return { status: 'unknown', evidence: [...a.evidence, ...b.evidence] };
  }
  return { status: 'absent', evidence: [...a.evidence, ...b.evidence] };
}

function downgradeForAdolescent(flag: FeatureFlag): FeatureFlag {
  return {
    status: 'unknown',
    evidence: [
      ...flag.evidence,
      'Adolescent population: AMH and ultrasound are not used for PCOM evidence per 2023 Intl PCOS Guideline.',
    ],
  };
}

function absent(reason: string): FeatureFlag {
  return { status: 'absent', evidence: [reason] };
}

function buildConsistentList(input: PcosFeatureMapInput, isAdolescent: boolean): string[] {
  const out: string[] = [];
  if (input.ovulatoryDysfunction.status === 'present') out.push('排卵障碍特征存在');
  if (input.hyperandrogenism.clinical.status === 'present') out.push('临床高雄激素表现存在');
  if (input.hyperandrogenism.biochemical.status === 'present') out.push('生化高雄激素证据存在');
  if (!isAdolescent) {
    if (input.polycysticOvarianMorphology.ultrasoundAFC.status === 'present') {
      out.push('超声卵泡数提示 PCOM');
    }
    if (input.polycysticOvarianMorphology.amh.status === 'present') {
      out.push('AMH 升高');
    }
  }
  return out;
}

function buildInconclusiveList(input: PcosFeatureMapInput, isAdolescent: boolean): string[] {
  const out: string[] = [];
  const candidates: Array<[string, FeatureFlag]> = [
    ['排卵情况', input.ovulatoryDysfunction],
    ['临床高雄', input.hyperandrogenism.clinical],
    ['生化高雄', input.hyperandrogenism.biochemical],
  ];
  if (!isAdolescent) {
    candidates.push(['超声 AFC', input.polycysticOvarianMorphology.ultrasoundAFC]);
    candidates.push(['AMH 水平', input.polycysticOvarianMorphology.amh]);
  }
  for (const [label, flag] of candidates) {
    if (flag.status === 'unknown' || flag.status === 'borderline') {
      out.push(`${label}（${flag.status}）`);
    }
  }
  return out;
}

function buildMissingExclusionsList(ex: PcosFeatureMap['exclusionsChecked']): string[] {
  const missing: string[] = [];
  if (ex.thyroid.status === 'unchecked') missing.push('甲状腺功能（TSH）');
  if (ex.prolactin.status === 'unchecked') missing.push('催乳素（PRL）');
  if (ex.cah17OHP.status === 'unchecked') missing.push('17-OH 孕酮（排除 CAH）');
  if (ex.fsh.status === 'unchecked') missing.push('FSH（排除 POI/绝经过渡）');
  if (ex.cushing.status === 'unchecked') missing.push('库欣综合征筛查');
  if (ex.androgenSecretingTumor.status === 'unchecked') missing.push('雄激素分泌肿瘤评估');
  return missing;
}

function buildDoctorQuestions(presentCount: number, missingExclusions: string[], isAdolescent: boolean): string[] {
  const qs: string[] = [];
  if (missingExclusions.length > 0) {
    qs.push(`下次复诊请确认是否需要补充以下检查：${missingExclusions.join('、')}`);
  }
  if (presentCount >= 2 && missingExclusions.length === 0) {
    qs.push('我的报告特征符合 PCOS 常见模式，下一步是否需要进一步评估代谢和心血管风险？');
  }
  if (isAdolescent) {
    qs.push('青少年阶段不建议用超声/AMH 单独支持 PCOS 诊断，请问当前评估路径是否合理？');
  }
  qs.push('如果生活方式调整 3–6 个月效果有限，下一步的评估或治疗选择有哪些（请医生说明，而不是我自己判断）？');
  return qs;
}

function buildSummary(args: {
  presentFeatures: number;
  missingExclusionsCount: number;
  isAdolescent: boolean;
}): string {
  if (args.presentFeatures === 0) {
    return '当前可见的报告数据未呈现 PCOS 典型模式。';
  }
  if (args.missingExclusionsCount > 0) {
    return `报告中已出现 ${args.presentFeatures} 条与 PCOS 一致的特征，但还有 ${args.missingExclusionsCount} 项排除性检查未完成；在医生完成这些排除前，无法判断是否符合 PCOS 报告里常见的整体模式。`;
  }
  if (args.presentFeatures >= 2) {
    return args.isAdolescent
      ? '青少年阶段的报告特征与 PCOS 报告里常见的模式一致；请医生结合症状时长与发育阶段做整体判断。'
      : '报告特征与 PCOS 报告里常见的整体模式一致；请医生结合个体情况做最终判断。';
  }
  return `报告中出现 ${args.presentFeatures} 条与 PCOS 一致的特征，但仅凭这些尚不足以呈现完整模式。`;
}

// ---------------------------------------------------------------------------
// Legacy numeric helpers (kept for tests and supplementary tools)
// ---------------------------------------------------------------------------

export const homaIR = (fastingGlucoseMmolL: number, fastingInsulinUIUmL: number) =>
  (fastingGlucoseMmolL * fastingInsulinUIUmL) / 22.5;

export const bmi = (heightCm: number, weightKg: number) => weightKg / Math.pow(heightCm / 100, 2);
