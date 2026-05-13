interface CycleDayBadgeProps {
  day: number;
}

export function CycleDayBadge({ day }: CycleDayBadgeProps) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-medium"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--cy-primary) 12%, white)',
        color: 'var(--cy-primary-ink)',
      }}
    >
      CD {day}
    </span>
  );
}
