import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppState } from "./types";

const KEY = "smartsplit:v1";

export const initialState: AppState = {
  squad: [
    { id: "p_yuki", name: "Yuki", emoji: "🌸" },
    { id: "p_maya", name: "Maya", emoji: "🌿" },
    { id: "p_ken", name: "Ken", emoji: "🍶" },
    { id: "p_tom", name: "Tom", emoji: "🎲" },
  ],
  receipt: null,
  history: [],
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as AppState;
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

interface Ctx {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
  reset: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      update: (updater) => setState((prev) => updater(prev)),
      reset: () => setState(initialState),
    }),
    [state],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export const newId = (prefix = "id"): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
