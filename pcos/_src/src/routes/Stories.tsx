import { useMemo, useState } from 'react';

import { StoryCard, THEME_LABELS } from '@/components/stories/StoryCard';
import { Button } from '@/components/ui/button';
import { useStories } from '@/store/stories';
import { cn } from '@/lib/utils';
import type { CommunityStory } from '@/types/stories';

type Theme = CommunityStory['themes'][number];

export default function Stories() {
  const stories = useStories((s) => s.stories);
  const [activeThemes, setActiveThemes] = useState<Set<Theme>>(new Set());

  const allThemes = useMemo(() => {
    const all = new Set<Theme>();
    for (const s of stories) for (const t of s.themes) all.add(t);
    return Array.from(all);
  }, [stories]);

  const visible = useMemo(() => {
    if (activeThemes.size === 0) return stories;
    return stories.filter((s) => s.themes.some((t) => activeThemes.has(t)));
  }, [stories, activeThemes]);

  const toggleTheme = (theme: Theme) => {
    setActiveThemes((prev) => {
      const next = new Set(prev);
      if (next.has(theme)) next.delete(theme);
      else next.add(theme);
      return next;
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10 lg:px-10">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cy-primary-ink">
          Cyster · Sisters
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-cy-ink-1 sm:text-4xl">
          你不是一个人
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-cy-ink-2">
          每一篇都是真实的 PCOS 经历，由作者本人书面授权后发布。Cyster 不让 AI 生成虚构故事，
          作者随时可以撤回。这些故事不构成医学建议——它们的价值是：你看到的"糟糕感受"，
          其实有很多人也走过。
        </p>
      </header>

      {allThemes.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-cy-ink-3">按主题筛选</p>
          <div className="flex flex-wrap gap-2">
            {allThemes.map((theme) => {
              const active = activeThemes.has(theme);
              return (
                <Button
                  key={theme}
                  type="button"
                  variant={active ? 'default' : 'secondary'}
                  size="sm"
                  className={cn(active && 'shadow-sm')}
                  onClick={() => toggleTheme(theme)}
                >
                  {THEME_LABELS[theme]}
                </Button>
              );
            })}
            {activeThemes.size > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveThemes(new Set())}
              >
                清除
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">
        {visible.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </section>

      {visible.length === 0 ? (
        <p className="text-sm text-cy-ink-3">当前筛选下没有故事。试试切换或清除主题。</p>
      ) : null}
    </div>
  );
}
