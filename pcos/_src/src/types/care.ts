import type { User } from '@/types/user';

/**
 * v2 replacement for v1 TherapyPlan.
 *
 * Key invariants:
 * - AI must NEVER author CareNote contents involving specific drug, dose,
 *   frequency, or treatment "plan". All medication info is user-entered.
 * - AI can: suggest questionsForNextVisit, help organize doctorPrepChecklist,
 *   summarize doctorTold notes. Not: recommend prescriptions.
 */
export interface CareNote {
  id: string;
  createdAt: string;
  updatedAt: string;
  kind: 'doctor-prep' | 'visit-log' | 'medication-log' | 'follow-up';
  visitDate?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorPrepChecklist?: DoctorPrepItem[];
  doctorTold?: string[];
  prescribed?: PrescribedMedication[];
  questionsForNextVisit?: string[];
  followUps?: FollowUp[];
  freeText?: string;
  goals?: User['goals'];
}

export interface DoctorPrepItem {
  id: string;
  text: string;
  category: 'symptoms' | 'lifestyle' | 'history' | 'medications' | 'questions';
  done: boolean;
}

/**
 * A medication record entered by the user from a real prescription.
 *
 * AI is strictly read-only with respect to drug/dose/frequency fields.
 */
export interface PrescribedMedication {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
  log: MedicationTakeLog[];
}

export interface MedicationTakeLog {
  date: string;
  taken: boolean;
  notedSideEffect?: string;
}

export interface FollowUp {
  id: string;
  kind: 'lab' | 'imaging' | 'visit' | 'self-check';
  dueAt: string;
  description: string;
  done: boolean;
}
