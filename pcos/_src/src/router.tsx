import type { ComponentType } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';

import App from '@/App';
import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';

const lazyRoute = (loader: () => Promise<{ default: ComponentType }>) => ({
  async lazy() {
    const mod = await loader();
    return { Component: mod.default };
  },
});

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, ...lazyRoute(() => import('@/routes/AmITheOne')) },
      { path: 'report', ...lazyRoute(() => import('@/routes/Report')) },
      { path: 'report/upload', ...lazyRoute(() => import('@/routes/Upload')) },
      { path: 'report/:id', ...lazyRoute(() => import('@/routes/ReportDetail')) },
      { path: 'stories', ...lazyRoute(() => import('@/routes/Stories')) },
      { path: 'stories/:slug', ...lazyRoute(() => import('@/routes/StoryDetail')) },
      { path: 'knowledge', ...lazyRoute(() => import('@/routes/Knowledge')) },
      { path: 'knowledge/:slug', ...lazyRoute(() => import('@/routes/KnowledgeDetail')) },
      { path: 'care', ...lazyRoute(() => import('@/routes/Care')) },
      { path: 'cycle', ...lazyRoute(() => import('@/routes/Cycle')) },
      { path: 'doctors', ...lazyRoute(() => import('@/routes/Doctors')) },
      { path: 'doctors/:id', ...lazyRoute(() => import('@/routes/DoctorDetail')) },
      { path: 'agent', ...lazyRoute(() => import('@/routes/Agent')) },
      { path: 'profile', ...lazyRoute(() => import('@/routes/Profile')) },
      { path: 'profile/settings', ...lazyRoute(() => import('@/routes/Settings')) },
      // Legacy v1 redirects
      { path: 'dashboard', element: <Navigate to="/" replace /> },
      { path: 'community', element: <Navigate to="/stories" replace /> },
      { path: 'community/:slug', element: <Navigate to="/stories" replace /> },
      { path: 'therapy', element: <Navigate to="/care" replace /> },
      { path: 'upload', element: <Navigate to="/report/upload" replace /> },
      { path: 'settings', element: <Navigate to="/profile/settings" replace /> },
      // Not found
      {
        path: '*',
        element: (
          <RoutePlaceholder
            title="找不到页面"
            description="检查 URL，或回到首页。"
          />
        ),
      },
    ],
  },
]);
