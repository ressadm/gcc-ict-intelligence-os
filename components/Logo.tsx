// Custom inline SVG logo. Geometric: a vertical "stack" of five layers
// (the L1–L5 value stack) with a single horizontal scan line cutting across.
// Uses currentColor; works in dark and light modes.

interface LogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}

export function Logo({ size = 28, className = '', withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-label="GCC ICT Intelligence OS"
        role="img"
      >
        {/* Five horizontal bars representing the L1–L5 value stack */}
        <rect x="6" y="5"  width="20" height="2" rx="0.5" fill="currentColor" opacity="0.55" />
        <rect x="6" y="10" width="20" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
        <rect x="6" y="15" width="20" height="2" rx="0.5" fill="currentColor" />
        <rect x="6" y="20" width="20" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
        <rect x="6" y="25" width="20" height="2" rx="0.5" fill="currentColor" opacity="0.55" />
        {/* Teal accent — the "scan line" */}
        <line x1="2" y1="16" x2="30" y2="16" stroke="#5fb3a6" strokeWidth="1" />
        <circle cx="30" cy="16" r="1.4" fill="#5fb3a6" />
      </svg>
      {withWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="text-[0.95rem] font-semibold tracking-tight">GCC ICT</span>
          <span className="text-xxs uppercase tracking-[0.22em] text-ink-400 mt-0.5">Intelligence OS</span>
        </span>
      ) : null}
    </span>
  );
}
