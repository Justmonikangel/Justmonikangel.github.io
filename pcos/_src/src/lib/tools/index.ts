import { computeBMI } from '@/lib/tools/computeBMI';
import { computeFeatureMap } from '@/lib/tools/computeFeatureMap';
import { computeHomaIR } from '@/lib/tools/computeHomaIR';
import { cyclePredict } from '@/lib/tools/cyclePredict';
import { lookupMedicationInfo } from '@/lib/tools/lookupMedicationInfo';
import { searchStories } from '@/lib/tools/searchStories';

/**
 * Local-only tool registry the agent loop dispatches into.
 *
 * v2 additions deferred to Commit 3:
 *   - search_knowledge (KnowledgeCard search)
 *   - generate_doctor_questions
 *
 * v2 removed: parse_report (was identity stub), rotterdam_check (replaced
 * by compute_feature_map), lookup_drug (replaced by lookup_medication_info),
 * search_community (renamed to search_stories).
 */
export const TOOLS = {
  compute_homa_ir: computeHomaIR,
  compute_bmi: computeBMI,
  cycle_predict: cyclePredict,
  compute_feature_map: computeFeatureMap,
  lookup_medication_info: lookupMedicationInfo,
  search_stories: searchStories,
};

export type ToolName = keyof typeof TOOLS;
