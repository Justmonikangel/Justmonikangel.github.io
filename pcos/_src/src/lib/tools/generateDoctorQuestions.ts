import type { PcosFeatureMap } from '@/types/report';

/**
 * Build a list of "what to ask your doctor next visit" questions based on a
 * PcosFeatureMap. Pure derivation — does not call the LLM.
 *
 * The map already carries `literacyOutput.suggestedDoctorQuestions`; this
 * tool can extend it with general PCOS-care questions when the map's list
 * is short or empty.
 */
export function generateDoctorQuestions(map: PcosFeatureMap): string[] {
  const base = map.literacyOutput.suggestedDoctorQuestions.slice();

  const generic = [
    '我目前的检查里，是否有需要补充的项目？',
    '如果生活方式调整 3–6 个月后仍无明显改善，下一步的评估或选择有哪些？',
    '现在阶段，我应该多久复诊一次？',
    '哪些症状属于需要立刻回来看医生的"警示信号"？',
  ];

  for (const q of generic) {
    if (!base.includes(q) && base.length < 6) {
      base.push(q);
    }
  }
  return base;
}
