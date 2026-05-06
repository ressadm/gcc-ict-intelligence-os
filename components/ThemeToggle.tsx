'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    applyTheme('dark');
  }, []);

  function applyTheme(t: 'dark' | 'light') {
    const root = document.documentElement;
    root.classList.toggle('dark', t === 'dark');
    root.classList.toggle('light', t === 'light');
  }

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xxs uppercase tracking-[0.18em] text-ink-300 hover:text-teal-bright transition-colors border border-white/5 hover:border-teal/40 rounded-sm"
    >
      <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-teal" />
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}
