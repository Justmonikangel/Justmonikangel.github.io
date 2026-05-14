/**
 * Safety / red-flag domain types.
 *
 * Patterns live in mocks/redFlagPatterns.json and are loaded by
 * lib/safety/redFlags.ts. Detection runs in lib/safety/detect.ts as the
 * FIRST step of every agent loop, before any LLM call.
 *
 * See ARCHITECTURE-v2.md §16.4 (R-1..R-5) and DECISIONS.md D-010.
 */
export type RedFlagCategory =
  | 'severe-bleeding'
  | 'cardiovascular'
  | 'mental-health'
  | 'acute-abdomen';

export type RedFlagSeverity = 'urgent' | 'critical';

export interface RedFlagPattern {
  id: string;
  category: RedFlagCategory;
  /** Serialized regex source. lib/safety/redFlags.ts re-hydrates via new RegExp(). */
  pattern: string;
  flags?: string;
  severity: RedFlagSeverity;
  emergencyMessage: string;
}

export interface SafetyEvent {
  id: string;
  occurredAt: string;
  matchedPatternId: string;
  category: RedFlagCategory;
  severity: RedFlagSeverity;
  /** Snippet kept local for context; never uploaded. */
  userInputSnippet?: string;
  action: 'show-emergency-card' | 'stop-llm-call';
}

export interface EmergencyContact {
  label: string;
  phone?: string;
  description: string;
  region: 'CN' | 'global';
}
