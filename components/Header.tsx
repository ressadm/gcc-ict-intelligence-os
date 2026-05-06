import Link from 'next/link';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  briefDate?: string;
  generatedAt?: string;
}

export function Header({ briefDate, generatedAt }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b hairline backdrop-blur-md bg-ink-950/80 dark:bg-ink-950/80 supports-[backdrop-filter]:bg-ink-950/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" aria-label="Home" className="text-ink-100 hover:text-teal-bright transition-colors">
          <Logo />
        </Link>

        <nav aria-label="primary" className="hidden sm:flex items-center gap-5 text-xxs uppercase tracking-[0.18em] text-ink-300">
          <Link href="/" className="hover:text-teal-bright">Today</Link>
          <Link href="/archive" className="hover:text-teal-bright">Archive</Link>
        </nav>

        <div className="flex items-center gap-2">
          {briefDate ? (
            <div className="hidden md:flex items-center gap-2 text-xxs uppercase tracking-[0.18em] text-ink-400 mr-1">
              <span className="block h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />
              <span>Brief · {briefDate}</span>
              {generatedAt ? <span className="text-ink-500">· {timeAgo(generatedAt)}</span> : null}
            </div>
          ) : null}
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden border-t hairline">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-4 text-xxs uppercase tracking-[0.18em] text-ink-300">
          <Link href="/" className="hover:text-teal-bright">Today</Link>
          <Link href="/archive" className="hover:text-teal-bright">Archive</Link>
          {briefDate ? <span className="ml-auto text-ink-500">{briefDate}</span> : null}
        </div>
      </div>
    </header>
  );
}

function timeAgo(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  } catch {
    return '';
  }
}
