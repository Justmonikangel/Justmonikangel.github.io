import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileSearch,
  HelpCircle,
  MessageCircle,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';

interface RailItem {
  to: string;
  title: string;
  Icon: typeof HelpCircle;
  /** Mark which top-level subtree is "active" so /report/:id still highlights Report. */
  matchPrefix?: string;
}

const RAIL_ITEMS: RailItem[] = [
  { to: '/', title: '是我吗（自测）', Icon: HelpCircle, matchPrefix: '/' },
  { to: '/report', title: '报告识读', Icon: FileSearch, matchPrefix: '/report' },
  { to: '/stories', title: '姐妹故事', Icon: Users, matchPrefix: '/stories' },
  { to: '/knowledge', title: '科普卡片', Icon: BookOpen, matchPrefix: '/knowledge' },
  { to: '/care', title: '看医生准备', Icon: ClipboardList, matchPrefix: '/care' },
  { to: '/cycle', title: '周期追踪', Icon: CalendarDays, matchPrefix: '/cycle' },
  { to: '/doctors', title: '医生信息', Icon: Stethoscope, matchPrefix: '/doctors' },
  { to: '/agent', title: 'Cyster Agent', Icon: MessageCircle, matchPrefix: '/agent' },
  { to: '/profile', title: '个人', Icon: UserRound, matchPrefix: '/profile' },
];

export function Rail() {
  return (
    <aside className="hidden md:flex flex-col items-center gap-1 border-r border-cy-line/60 bg-white/30 py-4 backdrop-blur-xl">
      <NavLink
        to="/"
        end
        className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-cy-primary text-sm font-semibold text-white shadow-sm"
        aria-label="Cyster home"
      >
        CY
      </NavLink>
      <nav className="flex flex-1 flex-col items-center gap-1">
        {RAIL_ITEMS.map(({ to, title, Icon, matchPrefix }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={title}
            className={({ isActive }) =>
              cn(
                'group relative grid h-10 w-10 place-items-center rounded-2xl text-cy-ink-2 transition-colors hover:bg-white/60 hover:text-cy-ink-1',
                (isActive || isPrefixActive(matchPrefix)) &&
                  'bg-white/80 text-cy-ink-1 ring-2 ring-cy-primary ring-offset-2 ring-offset-transparent',
              )
            }
          >
            <Icon className="h-4 w-4" />
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </aside>
  );
}

/**
 * Best-effort check for hash-router subpaths. NavLink's isActive only matches
 * the exact `to`, so for nested routes like /report/:id we mirror the active
 * state by looking at window.location.hash.
 */
function isPrefixActive(prefix: string | undefined): boolean {
  if (!prefix || prefix === '/') return false;
  if (typeof window === 'undefined') return false;
  const pathname = window.location.hash.replace(/^#/, '') || '/';
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
