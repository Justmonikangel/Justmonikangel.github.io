import * as React from 'react';

import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('glass-card rounded-[28px] border border-white/60 p-6 shadow-cyster', className)}
      {...props}
    />
  ),
);

Card.displayName = 'Card';
