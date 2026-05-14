/**
 * Agent domain types.
 *
 * v2 changes:
 * - Adds PromptBlock to support Anthropic prompt caching at block granularity
 *   (see ARCHITECTURE-v2.md §12 and DECISIONS.md D-004).
 * - AgentSession.context adds `population` and `lastFeatureMapId` so the
 *   user-context prompt block knows which adult/adolescent branch to use.
 * - safetyEvents tracks red-flag triggers (local only, not uploaded).
 */

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: Role;
  createdAt: string;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  streaming?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'done' | 'error';
}

/**
 * A unit of system-prompt content with caching intent.
 *
 * - safety: hard rules from Content Governance §16.3. Must always be
 *           cached and put first so the model anchors on it.
 * - medical-knowledge: stable PCOS knowledge (criteria, hormone primer).
 * - tool-spec: stable tool descriptions.
 * - user-context: dynamic per-user data (cycleDay, last report summary);
 *                 MUST be `cache: false`.
 * - task: ad-hoc instructions for a single turn.
 */
export interface PromptBlock {
  id: string;
  kind: 'safety' | 'medical-knowledge' | 'tool-spec' | 'user-context' | 'task';
  text: string;
  cache?: 'ephemeral' | false;
}

export interface AgentSessionContext {
  userId: string;
  lastReportId?: string;
  lastFeatureMapId?: string;
  cycleDay?: number;
  population: 'adult' | 'adolescent' | 'unknown';
}

export interface AgentSession {
  id: string;
  startedAt: string;
  messages: ChatMessage[];
  context: AgentSessionContext;
  safetyEventIds?: string[];
}
