import { cyclePredict } from '@/lib/tools/cyclePredict';
import { lookupDrug } from '@/lib/tools/lookupDrug';
import { parseReport } from '@/lib/tools/parseReport';
import { rotterdamCheck } from '@/lib/tools/rotterdamCheck';
import { searchCommunity } from '@/lib/tools/searchCommunity';
import { computeBMI } from './computeBMI';
import { computeHomaIR } from './computeHomaIR';

export const TOOLS = {
  parse_report: parseReport,
  compute_homa_ir: computeHomaIR,
  compute_bmi: computeBMI,
  cycle_predict: cyclePredict,
  rotterdam_check: rotterdamCheck,
  lookup_drug: lookupDrug,
  search_community: searchCommunity,
};
