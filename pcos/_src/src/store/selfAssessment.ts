import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import questionsSeed from '@/mocks/selfAssessmentQuestions.json';
import type { AmITheOneSession, SelfAssessmentQuestion } from '@/types/selfAssessment';

interface SelfAssessmentState {
  questions: SelfAssessmentQuestion[];
  sessions: AmITheOneSession[];
  activeSessionId: string | null;
  startSession: () => string;
  recordAnswer: (sessionId: string, questionId: string, value: unknown) => void;
  completeSession: (sessionId: string, result: AmITheOneSession['result']) => void;
}

export const useSelfAssessment = create<SelfAssessmentState>()(
  persist(
    (set, get) => ({
      questions: questionsSeed as SelfAssessmentQuestion[],
      sessions: [],
      activeSessionId: null,
      startSession: () => {
        const id = `am-${Date.now().toString(36)}`;
        set((state) => ({
          sessions: [
            { id, startedAt: new Date().toISOString(), answers: [] },
            ...state.sessions,
          ],
          activeSessionId: id,
        }));
        return id;
      },
      recordAnswer: (sessionId, questionId, value) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  answers: [
                    ...s.answers.filter((a) => a.questionId !== questionId),
                    { questionId, value },
                  ],
                }
              : s,
          ),
        }));
      },
      completeSession: (sessionId, result) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, completedAt: new Date().toISOString(), result }
              : s,
          ),
        }));
        void get;
      },
    }),
    {
      name: 'cyster.self-assessment.v1',
      partialize: (state) => ({ sessions: state.sessions, activeSessionId: state.activeSessionId }),
    },
  ),
);
