import { computeBMI } from '@/lib/tools/computeBMI';
import { computeFeatureMap } from '@/lib/tools/computeFeatureMap';
import { computeHomaIR } from '@/lib/tools/computeHomaIR';
import { cyclePredict } from '@/lib/tools/cyclePredict';
import { generateDoctorQuestions } from '@/lib/tools/generateDoctorQuestions';
import { lookupMedicationInfo } from '@/lib/tools/lookupMedicationInfo';
import { searchKnowledge } from '@/lib/tools/searchKnowledge';
import { searchStories } from '@/lib/tools/searchStories';

/**
 * Local-only tool registry the agent loop dispatches into.
 *
 * v2 names are aligned with the lib/llm/prompts/blocks.ts TOOLS_SPEC_BLOCK;
 * keep both in sync.
 */
export const TOOLS = {
  compute_homa_ir: computeHomaIR,
  compute_bmi: computeBMI,
  cycle_predict: cyclePredict,
  compute_feature_map: computeFeatureMap,
  lookup_medication_info: lookupMedicationInfo,
  search_knowledge: searchKnowledge,
  search_stories: searchStories,
  generate_doctor_questions: generateDoctorQuestions,
};

export type ToolName = keyof typeof TOOLS;
