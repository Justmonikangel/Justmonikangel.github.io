import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        cy: {
          primary: 'var(--cy-primary)',
          primaryInk: 'var(--cy-primary-ink)',
          accentWarm: 'var(--cy-accent-warm)',
          accentCool: 'var(--cy-accent-cool)',
          ink: {
            1: 'var(--cy-ink-1)',
            2: 'var(--cy-ink-2)',
            3: 'var(--cy-ink-3)',
          },
          line: 'var(--cy-line)',
          card: 'var(--cy-card)',
          success: 'var(--cy-success)',
          warn: 'var(--cy-warn)',
          danger: 'var(--cy-danger)',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'cy-gradient':
          'linear-gradient(135deg, var(--cy-bg-1) 0%, var(--cy-bg-2) 50%, var(--cy-bg-3) 100%)',
      },
      borderRadius: {
        xl2: '20px',
      },
      boxShadow: {
        cyster: '0 24px 80px rgba(31, 29, 44, 0.14)',
      },
    },
  },
  plugins: [],
} satisfies Config;
