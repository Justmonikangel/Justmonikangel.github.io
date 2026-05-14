import type { Citation } from '@/types/common';

/**
 * A curated knowledge card.
 *
 * v2 hard rules (Content Governance §16.1):
 * - K-1: citations.length >= 1
 * - K-2: lastReviewedAt set; UI shows "needs review" when > 18 months
 * - K-3: body authored by humans; AI only polishes/translates/summarizes
 * - K-4: third-person voice (no "you should")
 * - K-5: medication cards explain mechanism / population evidence /
 *        cautions only; no dose, no individual fit advice
 */
export interface KnowledgeCard {
  id: string;
  slug: string;
  title: string;
  shortAnswer: string;
  category:
    | 'criteria'
    | 'hormone'
    | 'metabolic'
    | 'mental'
    | 'lifestyle'
    | 'medication-info'
    | 'doctor-visit'
    | 'misconception';
  body: string;
  applicablePopulation: Array<'adult' | 'adolescent'>;

  /** K-1: >= 1 citation required. */
  citations: Citation[];

  /** K-2: refresh discipline. */
  lastReviewedAt: string;
  reviewedBy?: string;

  authoredBy: 'owner' | 'invited-doctor' | 'invited-patient' | 'editorial-team';

  aiAssisted: boolean;
  aiAssistKind?: Array<'polish' | 'translate' | 'summarize'>;

  relatedCardIds?: string[];
  relatedStoryIds?: string[];
}
