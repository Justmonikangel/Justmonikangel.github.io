import type { PropsWithChildren } from 'react';

import { AgentDock } from './AgentDock';
import { AgentPanel } from './AgentPanel';
import { Rail } from './Rail';
import { Sidebar } from './Sidebar';

/**
 * Three-column shell on >= md (Rail 64 / Sidebar 240 / Main 1fr).
 * On mobile we collapse Rail + Sidebar (they self-render with `hidden md:flex`)
 * and let the main view occupy the whole width. Mobile-first navigation
 * polish (top bar + hamburger) is deferred to P1.8.
 */
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
