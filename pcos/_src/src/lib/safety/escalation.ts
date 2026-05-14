import { useSafety } from '@/store/safety';
import type { EmergencyContact, SafetyEvent } from '@/types/safety';
import type { CompiledRedFlag } from '@/lib/safety/redFlags';

/**
 * Hard-coded CN emergency contacts. UI renders these inside <EmergencyCard>.
 *
 * P1: zh-CN only. P1.5+ adds region detection so overseas users see the
 * appropriate hotline.
 */
export const EMERGENCY_CONTACTS_CN: EmergencyContact[] = [
  {
    label: '120 急救',
    phone: '120',
    description: '危及生命的医疗急症（胸痛、晕厥、大出血等）',
    region: 'CN',
  },
  {
    label: '110 警务',
    phone: '110',
    description: '安全危机或他人威胁',
    region: 'CN',
  },
  {
    label: '12320 卫生热线',
    phone: '12320',
    description: '健康咨询与就医指引',
    region: 'CN',
  },
  {
    label: '北京心理危机研究与干预中心',
    phone: '010-82951332',
    description: '24 小时心理危机干预热线',
    region: 'CN',
  },
];

/**
 * Convert a red-flag pattern match into a persisted SafetyEvent.
 */
export function createSafetyEvent(
  match: CompiledRedFlag,
  userInputSnippet?: string,
): SafetyEvent {
  return {
    id: `safety-${Date.now().toString(36)}`,
    occurredAt: new Date().toISOString(),
    matchedPatternId: match.id,
    category: match.category,
    severity: match.severity,
    userInputSnippet,
    action: 'stop-llm-call',
  };
}

/**
 * Push a safety event into the local store and return it. Callers should
 * also render the <EmergencyCard> in the UI.
 */
export function escalate(match: CompiledRedFlag, userInputSnippet?: string): SafetyEvent {
  const event = createSafetyEvent(match, userInputSnippet);
  useSafety.getState().pushEvent(event);
  return event;
}
