import { NavLink } from 'react-router-dom';

import { ConsentNotice } from '@/components/stories/ConsentNotice';
import { Card } from '@/components/ui/card';
import type { CommunityStory } from '@/types/stories';

const THEME_LABELS: Record<CommunityStory['themes'][number], string> = {
  'diagnosis-delay': '确诊延误',
  mood: '情绪',
  fertility: '生育',
  metabolic: '代谢',
  weight: '体重',
  workplace: '职场',
  relationship: '亲密关系',
  'cultural-pressure': '社会期待',
};

interface StoryCardProps {
  story: CommunityStory;
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <NavLink to={`/stories/${story.slug}`}>
      <Card className="h-full space-y-3 transition-shadow hover:shadow-cyster">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-cy-primary-ink">
            {story.authorPseudonym}
            {story.ageRange ? ` · ${story.ageRange}` : ''}
          </p>
          <ConsentNotice story={story} variant="badge" />
        </div>

        <p className="text-sm leading-7 text-cy-ink-1">{story.excerpt}</p>

        <div className="flex flex-wrap gap-1.5">
          {story.themes.map((theme) => (
            <span
              key={theme}
              className="rounded-full bg-cy-bg-2 px-2 py-0.5 text-xs text-cy-ink-3"
            >
              {THEME_LABELS[theme]}
            </span>
          ))}
        </div>

        <p className="text-xs text-cy-ink-3">
          {story.yearsFromSymptomToDiagnosis !== undefined
            ? `从症状到确诊：${story.yearsFromSymptomToDiagnosis} 年 ·`
            : ''}{' '}
          阅读全文 →
        </p>
      </Card>
    </NavLink>
  );
}

export { THEME_LABELS };
