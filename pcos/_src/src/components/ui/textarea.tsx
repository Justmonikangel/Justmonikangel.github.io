import * as React from 'react';

import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-28 w-full rounded-3xl border border-cy-line bg-white/80 px-4 py-3 text-sm text-cy-ink-1 shadow-sm outline-none ring-offset-white placeholder:text-cy-ink-3 focus-visible:ring-2 focus-visible:ring-cy-primary',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
