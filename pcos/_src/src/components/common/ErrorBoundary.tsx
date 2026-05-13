import type { ReactNode } from 'react';
import { Component } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
          <Card className="w-full space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Cyster 遇到了一点问题</h1>
              <p className="mt-2 text-sm leading-6 text-cy-ink-2">
                P0 先保留最小错误兜底，后续 phase 会补充更完整的错误态和恢复流程。
              </p>
            </div>
            <Button type="button" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
