import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-cy-ink-1">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-cy-ink-2">{description}</p>
      </div>
      {action}
    </Card>
  );
}
