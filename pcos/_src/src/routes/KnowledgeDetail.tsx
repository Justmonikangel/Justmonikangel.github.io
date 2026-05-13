import { useParams } from 'react-router-dom';

import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

// TODO P1: Render single KnowledgeCard: markdown body + citation list +
//         LastReviewedBadge + aiAssisted footnote when applicable.
//         See ARCHITECTURE-v2.md §11.4.
export default function KnowledgeDetail() {
  const { slug } = useParams();
  return (
    <RoutePlaceholder
      title={`卡片 · ${slug ?? ''}`}
      description="即将开放：完整科普内容 + 真实文献引用。"
    />
  );
}
