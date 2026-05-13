import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface UiState {
  theme: ThemeMode;
  agentPanelOpen: boolean;
  sidebarCollapsed: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setAgentPanelOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      agentPanelOpen: false,
      sidebarCollapsed: false,
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: nextTheme });
        applyTheme(nextTheme);
      },
      setAgentPanelOpen: (agentPanelOpen) => set({ agentPanelOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: 'cyster.ui.theme.v1',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = theme;
}

export function initializeTheme() {
  applyTheme(useUiStore.getState().theme);
}
