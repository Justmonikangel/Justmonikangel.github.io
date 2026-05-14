import { AlertTriangle } from 'lucide-react';

interface RedFlagNoticeProps {
  message: string;
}

/**
 * Inline banner used on non-agent surfaces (e.g. AmITheOne self-assessment)
 * when a red-flag pattern matches a user-entered string.
 */
export function RedFlagNotice({ message }: RedFlagNoticeProps) {
  return (
    <div
      role="alert"
      className="cy-emergency flex items-start gap-3 rounded-2xl px-4 py-3 text-sm leading-6"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--cy-safety)' }} />
      <span>{message}</span>
    </div>
  );
}
