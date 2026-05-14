import storiesSeed from '@/mocks/stories.json';

import type { CommunityStory } from '@/types/stories';

/**
 * Search curated community stories by simple substring on title/body/themes.
 *
 * v2: only stories with consentStatus starting with "granted-" are searchable.
 */
export function searchStories(query: string): CommunityStory[] {
  const stories = storiesSeed as CommunityStory[];
  const visible = stories.filter((s) => s.consentStatus.startsWith('granted'));
  if (!query) return visible;
  const q = query.toLowerCase();
  return visible.filter((s) =>
    s.authorPseudonym.toLowerCase().includes(q) ||
    s.excerpt.toLowerCase().includes(q) ||
    s.body.toLowerCase().includes(q) ||
    s.themes.some((t) => t.includes(q)),
  );
}
