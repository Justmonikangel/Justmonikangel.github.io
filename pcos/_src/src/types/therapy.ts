import type { User } from '@/types/user';

export interface TherapyPlan {
  id: string;
  createdAt: string;
  phase: number;
  weeks: number;
  goals: User['goals'];
  medications: Medication[];
  lifestyle: Lifestyle;
  followUp: FollowUp[];
  rationale: string;
}

export interface Medication {
  drug: string;
  dose: string;
  schedule: string;
  duration: string;
  purpose: string;
  cautions: string[];
  adherence: AdherenceLog[];
}

export interface AdherenceLog {
  date: string;
  taken: boolean;
  note?: string;
}

export interface Lifestyle {
  diet: { type: 'low-GI' | 'mediterranean' | 'low-carb'; notes: string };
  workout: { sessionsPerWeek: number; mix: string[] };
  sleepHoursTarget: number;
}

export interface FollowUp {
  kind: 'lab' | 'imaging' | 'visit';
  dueAt: string;
  description: string;
  done: boolean;
}
