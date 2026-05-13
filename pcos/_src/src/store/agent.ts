import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AgentSession } from '@/types/agent';

interface AgentState {
  sessions: AgentSession[];
  activeSessionId: string | null;
}

export const useAgent = create<AgentState>()(
  persist(
    () => ({
      sessions: [],
      activeSessionId: null,
    }),
    { name: 'cyster.agent.v1' },
  ),
);
