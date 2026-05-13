import { useParams } from 'react-router-dom';

import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

// TODO P1: Render single CommunityStory with consent badge, anonymization
//         level, withdrawal contact. See ARCHITECTURE-v2.md §11.3.
export default function StoryDetail() {
  const { slug } = useParams();
  return (
    <RoutePlaceholder
      title={`故事 · ${slug ?? ''}`}
      description="即将开放：经作者授权的真实经历。"
    />
  );
}
