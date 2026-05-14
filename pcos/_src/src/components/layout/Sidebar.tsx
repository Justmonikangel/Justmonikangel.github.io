import { NavLink, useLocation } from 'react-router-dom';

import { presetKeyForPath, sidebarPresets } from '@/components/layout/SidebarPresets';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const location = useLocation();
  const presetKey = presetKeyForPath(location.pathname);
  const preset = sidebarPresets[presetKey];

  return (
    <aside className="hidden md:flex h-full flex-col gap-6 overflow-y-auto border-r border-cy-line/60 bg-white/25 px-5 py-6 backdrop-blur-xl">
      <header className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-cy-ink-1">{preset.title}</h2>
        <p className="text-xs leading-5 text-cy-ink-3">{preset.subtitle}</p>
      </header>

      <nav className="flex flex-col gap-1 text-sm">
        {preset.links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              cn(
                'block rounded-xl px-3 py-2 text-cy-ink-2 transition-colors hover:bg-white/70 hover:text-cy-ink-1',
                isActive && 'bg-white/80 text-cy-ink-1 shadow-sm',
              )
            }
          >
            <div className="font-medium">{link.label}</div>
            {link.hint ? <div className="mt-0.5 text-xs text-cy-ink-3">{link.hint}</div> : null}
          </NavLink>
        ))}
      </nav>

      <footer className="mt-auto text-xs leading-5 text-cy-ink-3">
        <p>Cyster Phase 1 · 觉知 + 识读 + 共同体</p>
        <p className="mt-1">
          所有数据仅存在你的浏览器，不会上传。
        </p>
      </footer>
    </aside>
  );
}
