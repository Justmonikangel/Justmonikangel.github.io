import { EmptyState } from '@/components/common/EmptyState';

interface RoutePlaceholderProps {
  title: string;
  description: string;
}

export function RoutePlaceholder({ title, description }: RoutePlaceholderProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
      <EmptyState title={title} description={description} />
    </div>
  );
}
