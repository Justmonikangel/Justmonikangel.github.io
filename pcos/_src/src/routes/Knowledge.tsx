import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

// TODO P1: Index of KnowledgeCard categories: criteria / hormone / metabolic /
//         mental / lifestyle / medication-info / doctor-visit / misconception.
//         Each card shows citation count and lastReviewedAt badge.
//         See ARCHITECTURE-v2.md §11.4.
export default function Knowledge() {
  return (
    <RoutePlaceholder
      title="科普卡片"
      description="带引用的 PCOS 知识库。20–30 张 curated cards 即将上线。"
    />
  );
}
