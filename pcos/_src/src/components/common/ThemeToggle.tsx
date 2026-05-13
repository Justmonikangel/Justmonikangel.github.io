import { MoonStar, SunMedium } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui';

export function ThemeToggle() {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={theme === 'light' ? '切换到深色主题' : '切换到浅色主题'}
      onClick={toggleTheme}
    >
      {theme === 'light' ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
    </Button>
  );
}
