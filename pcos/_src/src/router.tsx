import { createHashRouter, Navigate } from 'react-router-dom';

import App from '@/App';

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        async lazy() {
          const module = await import('@/routes/Dashboard');
          return { Component: module.default };
        },
      },
    ],
  },
]);
