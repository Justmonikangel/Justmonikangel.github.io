import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

// TODO P1: Implement AmITheOne self-assessment flow per ARCHITECTURE-v2.md §11.1.
//         12–20 questions across cycle / androgen / metabolic / mental / fertility /
//         history; result page shows feature count + strong CTA to /report/upload.
export default function AmITheOne() {
  return (
    <RoutePlaceholder
      title="是我吗？"
      description="30 秒自测：你最近的感觉，可能不是你的问题——可能是 PCOS。即将开放。"
    />
  );
}
