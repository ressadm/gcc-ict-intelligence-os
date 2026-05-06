interface TagProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'teal' | 'amber' | 'critical' | 'opportunity' | 'watch';
  size?: 'xs' | 'sm';
}

const TONE_CLASSES: Record<NonNullable<TagProps['tone']>, string> = {
  neutral: 'border-white/10 text-ink-300',
  teal: 'border-teal/40 text-teal-bright',
  amber: 'border-amber/40 text-amber-bright',
  critical: 'border-signal-critical/50 text-signal-critical',
  opportunity: 'border-signal-opportunity/50 text-signal-opportunity',
  watch: 'border-signal-watch/40 text-signal-watch',
};

export function Tag({ children, tone = 'neutral', size = 'xs' }: TagProps) {
  const sizing = size === 'xs' ? 'text-[0.6rem] px-1.5 py-0.5' : 'text-xxs px-2 py-1';
  return (
    <span
      className={`inline-flex items-center uppercase tracking-[0.16em] font-medium border rounded-sm ${sizing} ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
