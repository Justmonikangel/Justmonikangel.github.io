import { X } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui';
import { cn } from '@/lib/utils';

/**
 * Slide-in panel docked to the right.
 *
 * P1.1 ships the shell with empty body. P1.5 mounts <ChatStream> here once
 * the Anthropic adapter and PromptBlock pipeline are wired.
 *
 * We deliberately do NOT depend on the shadcn <Sheet> primitive yet (it
 * throws as a TODO P1 stub). A hand-rolled drawer keeps P1.1 self-contained.
 */
export function AgentPanel() {
  const open = useUiStore((s) => s.agentPanelOpen);
  const setOpen = useUiStore((s) => s.setAgentPanelOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-30 bg-cy-ink-1/30 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        role="dialog"
        aria-label="Cyster Agent 面板"
        aria-hidden={!open}
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col gap-4 border-l border-cy-line/60 bg-white/95 p-5 shadow-cyster backdrop-blur-xl transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-cy-ink-1">Cyster Agent</h2>
            <p className="mt-1 text-xs leading-5 text-cy-ink-3">
              PCOS 识读对话 · 在 P1.5 阶段会接入 Claude
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="关闭面板"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto rounded-2xl bg-cy-bg-2/40 p-4 text-sm leading-6 text-cy-ink-2">
          <p>
            这里会显示与 Cyster 的对话。Phase P1.1 只搭好了入口，对话流、工具调用与 red-flag 升级
            会在 P1.5 接通。
          </p>
        </div>

        <footer className="text-xs leading-5 text-cy-ink-3">
          请记得：Cyster 不替代医生，不开处方。涉及紧急医疗情况请直接拨打 120。
        </footer>
      </aside>
    </>
  );
}
