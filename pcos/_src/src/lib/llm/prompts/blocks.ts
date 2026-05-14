import type { PromptBlock } from '@/types/agent';

import { PCOS_KNOWLEDGE_BLOCK } from '@/lib/llm/prompts/medicalKnowledge';
import { SAFETY_RULES_BLOCK } from '@/lib/llm/prompts/safety';
import { buildUserContextText, type UserContextInput } from '@/lib/llm/prompts/userContext';

const TOOLS_SPEC_BLOCK = `# 可用工具

调用以下任意工具时，请提供完整 JSON 参数：

- compute_feature_map(input): 计算 PcosFeatureMap（2023 指南）。输入是已分类的 FeatureFlag。
- compute_homa_ir(fastingGlucoseMmolL, fastingInsulinUIUmL): HOMA-IR
- compute_bmi(heightCm, weightKg): BMI
- cycle_predict(lastPeriodStart, cycleAvgDays): 下次月经预计开始日期
- lookup_medication_info(query): 药物科普信息（机制/群体证据/副作用/与医生讨论清单）。
  禁止把返回结果改写成个体化处方建议。
- search_knowledge(query): 检索 curated KnowledgeCard
- search_stories(query): 检索经授权的 CommunityStory

不知道哪个工具能解决问题时，先调用 search_knowledge 检索相关卡片。`;

/**
 * Build the full system PromptBlock array for one chat turn.
 *
 * Ordering matters for Anthropic prompt caching: static blocks come first
 * (cache: 'ephemeral'), the dynamic user-context block comes last
 * (cache: false). This way a cycle-day update or new report summary
 * doesn't invalidate the safety / knowledge / tool-spec caches above.
 */
export function buildSystemBlocks(user: UserContextInput): PromptBlock[] {
  return [
    {
      id: 'safety-rules',
      kind: 'safety',
      cache: 'ephemeral',
      text: SAFETY_RULES_BLOCK,
    },
    {
      id: 'pcos-knowledge',
      kind: 'medical-knowledge',
      cache: 'ephemeral',
      text: PCOS_KNOWLEDGE_BLOCK,
    },
    {
      id: 'tools-spec',
      kind: 'tool-spec',
      cache: 'ephemeral',
      text: TOOLS_SPEC_BLOCK,
    },
    {
      id: 'user-context',
      kind: 'user-context',
      cache: false,
      text: buildUserContextText(user),
    },
  ];
}
