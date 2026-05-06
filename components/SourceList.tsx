import type { Source } from '@/lib/schema';

interface SourceListProps {
  sources: Source[];
  compact?: boolean;
}

export function SourceList({ sources, compact = false }: SourceListProps) {
  if (!sources?.length) {
    return <p className="text-xxs uppercase tracking-[0.18em] text-ink-600">No sources cited</p>;
  }
  return (
    <ul className={`${compact ? 'space-y-1' : 'space-y-1.5'} text-sm`}>
      {sources.map((s, i) => (
        <li key={`${s.url}-${i}`} className="flex items-start gap-2 leading-snug">
          <span className="text-ink-600 mt-1.5 select-none" aria-hidden>
            <span className="block h-px w-2 bg-current" />
          </span>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-200 hover:text-teal-bright underline decoration-teal/30 underline-offset-4 break-words"
            data-testid={`link-source-${i}`}
          >
            {s.title}
          </a>
          {s.publisher ? (
            <span className="text-ink-500 text-xs whitespace-nowrap">· {s.publisher}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
