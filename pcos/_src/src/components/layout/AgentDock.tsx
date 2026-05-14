import { Sparkles } from 'lucide-react';

import { useSafety } from '@/store/safety';
import { useUiStore } from '@/store/ui';
import { cn } from '@/lib/utils';

export function AgentDock() {
  const open = useUiStore((s) => s.agentPanelOpen);
  const setOpen = useUiStore((s) => s.setAgentPanelOpen);
  const recentSafetyEvent = useSafety((s) => s.events[0]);

  const isHot = !!recentSafetyEvent && recentSafetyEvent.severity === 'critical';

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-label={open ? '关闭 Cyster Agent' : '打开 Cyster Agent'}
      className={cn(
        'fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-full bg-cy-primary text-white shadow-cyster transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cy-primary focus-visible:ring-offset-2',
        isHot && 'animate-pulse ring-4',
      )}
      style={isHot ? { boxShadow: '0 0 0 4px color-mix(in srgb, var(--cy-safety) 30%, transparent)' } : undefined}
    >
      <Sparkles className="h-5 w-5" />
    </button>
  );
}
