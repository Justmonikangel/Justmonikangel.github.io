import * as React from 'react';

import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-2xl border border-cy-line bg-white/80 px-4 py-2 text-sm text-cy-ink-1 shadow-sm outline-none ring-offset-white placeholder:text-cy-ink-3 focus-visible:ring-2 focus-visible:ring-cy-primary',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
