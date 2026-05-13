import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

// TODO P1: Curated CommunityStory index. Owner-written + invited consent-based.
//         No real posting / commenting in P1. See ARCHITECTURE-v2.md §11.3.
//         Filterable by themes (diagnosis-delay / mood / fertility / ...).
export default function Stories() {
  return (
    <RoutePlaceholder
      title="姐妹的故事"
      description="你不是一个人。5–10 篇真实的 PCOS 故事即将上线。"
    />
  );
}
