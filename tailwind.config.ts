import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm dark slate / ink — control-room feel, not neon
        ink: {
          950: '#0b0d10',
          900: '#11141a',
          850: '#161a21',
          800: '#1c2129',
          700: '#262c36',
          600: '#384050',
          500: '#566073',
          400: '#7a8497',
          300: '#a3acbd',
          200: '#c5ccd9',
          100: '#e3e7ee',
        },
        teal: {
          DEFAULT: '#5fb3a6',
          dim: '#3f8c81',
          bright: '#7ad0c2',
        },
        amber: {
          DEFAULT: '#d49a4a',
          dim: '#a87833',
          bright: '#e8b56a',
        },
        signal: {
          critical: '#c97064',
          watch: '#d49a4a',
          opportunity: '#5fb3a6',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Inter', 'Helvetica Neue', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xxs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      maxWidth: {
        'reading': '68ch',
      },
    },
  },
  plugins: [],
};

export default config;
