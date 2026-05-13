import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

// TODO P1: Cycle tracker. CycleRing (current day + ovulation window) +
//         CycleHistory + SymptomLog. Pulls from useCycle store.
//         See ARCHITECTURE-v2.md §11.6.
export default function Cycle() {
  return (
    <RoutePlaceholder
      title="周期追踪"
      description="月经周期、排卵窗口、症状日志。即将开放。"
    />
  );
}
