import { Outlet } from 'react-router-dom';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-cy-gradient text-cy-ink-1">
        <Outlet />
      </div>
    </ErrorBoundary>
  );
}
