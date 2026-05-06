interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  count?: number;
  meta?: string;
}

export function SectionHeading({ eyebrow, title, count, meta }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4 border-b hairline pb-2">
      <div>
        <div className="eyebrow text-ink-500 dark:text-ink-400">{eyebrow}</div>
        <h2 className="text-base sm:text-lg font-semibold tracking-tight mt-1.5 text-ink-100 dark:text-ink-100">
          {title}
          {typeof count === 'number' ? (
            <span className="ml-2 text-ink-500 font-normal text-sm">{count}</span>
          ) : null}
        </h2>
      </div>
      {meta ? <div className="text-xxs uppercase tracking-[0.18em] text-ink-500">{meta}</div> : null}
    </div>
  );
}
