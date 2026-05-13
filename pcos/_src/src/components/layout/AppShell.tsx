// TODO P1: Wire up real Rail / Sidebar / AgentDock / AgentPanel.
//         For now this is just a three-column skeleton so the layout
//         architecture is in place and routes render in the main slot.
//         See ARCHITECTURE-v2.md §11.1 AppShell.
import type { PropsWithChildren } from 'react';

import { AgentDock } from './AgentDock';
import { AgentPanel } from './AgentPanel';
import { Rail } from './Rail';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-cy-gradient md:grid-cols-[64px_240px_minmax(0,1fr)]">
      <Rail />
      <Sidebar />
      <main className="relative min-h-screen overflow-x-hidden">
        {children}
      </main>
      <AgentDock />
      <AgentPanel />
    </div>
  );
}
