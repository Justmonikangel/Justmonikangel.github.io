import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { NavLink, useParams } from 'react-router-dom';

import { ConsentNotice } from '@/components/stories/ConsentNotice';
import { THEME_LABELS } from '@/components/stories/StoryCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getKnowledgeCardById } from '@/lib/knowledge';
import { useStories } from '@/store/stories';

export default function StoryDetail() {
  const { slug } = useParams();
  const story = useStories((s) => s.stories.find((x) => x.slug === slug));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 lg:px-10">
      <div>
        <NavLink to="/stories" className="text-xs text-cy-ink-3 hover:text-cy-ink-1">
          ← 返回故事列表
        </NavLink>
      </div>

      {story ? (
        <article className="space-y-6">
          <Card className="space-y-4">
            <header className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-cy-primary-ink">
                {story.authorPseudonym}
                {story.ageRange ? ` · ${story.ageRange}` : ''}
                {story.yearsFromSymptomToDiagnosis !== undefined
                  ? ` · 症状到确诊 ${story.yearsFromSymptomToDiagnosis} 年`
                  : ''}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-cy-ink-1 sm:text-3xl">
                {story.excerpt}
              </h1>
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
            </header>

            <div className="prose-cyster text-sm leading-7 text-cy-ink-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{story.body}</ReactMarkdown>
            </div>
          </Card>

          <ConsentNotice story={story} variant="block" />

          {story.relatedCardIds && story.relatedCardIds.length > 0 ? (
            <Card className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-cy-ink-3">
                这篇故事关联的科普
              </p>
              <ul className="space-y-2 text-sm leading-6">
                {story.relatedCardIds
                  .map((id) => getKnowledgeCardById(id))
                  .filter(Boolean)
                  .map((card) =>
                    card ? (
                      <li key={card.id}>
                        <NavLink
                          to={`/knowledge/${card.slug}`}
                          className="text-cy-ink-1 hover:underline"
                        >
                          {card.title}
                        </NavLink>
                        <p className="mt-0.5 text-xs text-cy-ink-3">{card.shortAnswer}</p>
                      </li>
                    ) : null,
                  )}
              </ul>
            </Card>
          ) : null}

          <p className="text-xs leading-5 text-cy-ink-3">
            这是 {story.authorPseudonym} 的真实经历，已经过 ta 本人授权。这不构成任何医学建议。
            如果你最近遭遇严重不适或情绪危机，请直接拨打 120 或心理危机干预热线 010-82951332。
          </p>
        </article>
      ) : (
        <Card className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">找不到这篇故事</h2>
          <p className="text-sm leading-6 text-cy-ink-2">
            URL 里的 slug "{slug}" 不在当前 curated 故事中，可能作者撤回了授权，
            或链接已过时。
          </p>
          <NavLink to="/stories">
            <Button type="button">回到故事列表</Button>
          </NavLink>
        </Card>
      )}
    </div>
  );
}
