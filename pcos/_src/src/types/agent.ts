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

export interface AgentSession {
  id: string;
  startedAt: string;
  messages: ChatMessage[];
  context: {
    userId: string;
    lastReportId?: string;
    cycleDay?: number;
  };
}
