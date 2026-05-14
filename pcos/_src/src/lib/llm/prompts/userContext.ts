import type { AgentSessionContext } from '@/types/agent';

export interface UserContextInput {
  displayName: string;
  ageYears?: number;
  bmi?: number;
  cycleAvgDays?: number;
  population: AgentSessionContext['population'];
  pcosStatus: string;
  lastReportSummary?: string;
}

/**
 * Build the dynamic per-user context block. MUST be cache: false so a
 * cycle-day update doesn't invalidate the medical-knowledge and safety
 * prefix caches above it.
 */
export function buildUserContextText(input: UserContextInput): string {
  const lines = [
    '# 当前用户上下文（脱敏摘要）',
    `称呼: ${input.displayName}`,
    input.ageYears !== undefined ? `年龄: ${input.ageYears}` : '年龄: 未知',
    input.bmi !== undefined ? `BMI: ${input.bmi.toFixed(1)}` : 'BMI: 未知',
    `平均周期: ${input.cycleAvgDays ?? '未知'} 天`,
    `人群: ${input.population} (adult 或 adolescent；adolescent 时不要用超声/AMH 作为 PCOM 证据)`,
    `PCOS 状态: ${input.pcosStatus}`,
    input.lastReportSummary ? `最近报告摘要: ${input.lastReportSummary}` : '最近报告: 无',
    '',
    '请基于这些信息回答。如缺少必要信息，主动提问或调用工具，不要凭推测。',
  ];
  return lines.join('\n');
}
