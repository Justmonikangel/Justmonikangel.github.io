/**
 * v2 replacement for v1 CommunityPost / CommunityComment.
 *
 * P1 community is curated-only (no real UGC). Every story carries explicit
 * consent + anonymization metadata. See ARCHITECTURE-v2.md §16.2 (S-1..S-6)
 * for the hard rules and DECISIONS.md D-009 / D-014 / D-016.
 */
export interface CommunityStory {
  id: string;
  slug: string;
  authorPseudonym: string;
  publishedAt: string;
  updatedAt: string;

  /** 5-year age bucket; smaller granularity reveals identity. */
  ageRange?: '<18' | '18-24' | '25-34' | '35+';
  yearsFromSymptomToDiagnosis?: number;

  themes: Array<
    | 'diagnosis-delay'
    | 'mood'
    | 'fertility'
    | 'metabolic'
    | 'weight'
    | 'workplace'
    | 'relationship'
    | 'cultural-pressure'
  >;

  body: string;
  excerpt: string;
  coverImage?: string;

  /** S-1: only granted-* statuses are eligible to render in UI. */
  consentStatus: 'granted-with-name' | 'granted-anonymous' | 'pending' | 'withdrawn';
  anonymous: boolean;

  /** S-2: required to be at least 'light' when anonymous=true. */
  anonymizationLevel: 'none' | 'light' | 'full';

  /** S-3: literal `true` — withdrawal is always possible. */
  withdrawable: true;

  /** Local file ref to the signed consent doc; never uploaded. */
  consentDocumentRef?: string;

  /** S-6: AI is read-modify only, never generative. */
  aiAssisted: boolean;
  aiAssistKind?: Array<'polish' | 'anonymize' | 'structure' | 'translate'>;

  relatedCardIds?: string[];
}
