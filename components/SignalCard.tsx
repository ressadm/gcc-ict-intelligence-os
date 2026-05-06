'use client';

import { useState } from 'react';
import type { Signal } from '@/lib/schema';
import { domainLabel } from '@/config/domains';
import { layerLabel } from '@/config/layers';
import { Tag } from './Tag';
import { SourceList } from './SourceList';

interface SignalCardProps {
  signal: Signal;
  index: number;
  initiallyOpen?: boolean;
}

export function SignalCard({ signal, index, initiallyOpen = false }: SignalCardProps) {
  const [open, setOpen] = useState(initiallyOpen);

  const toneMap = {
    critical: 'critical',
    watch: 'watch',
    opportunity: 'opportunity',
  } as const;

  return (
    <article
      className="border-l-2 border-white/5 hover:border-teal/40 transition-colors pl-4 sm:pl-5 py-3"
      data-testid={`card-signal-${signal.id}`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`signal-body-${signal.id}`}
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left flex flex-col gap-2 group"
        data-testid={`button-toggle-${signal.id}`}
      >
        <div className="flex items-center gap-3 text-xxs uppercase tracking-[0.18em] text-ink-500">
          <span className="font-mono text-ink-400">{String(index + 1).padStart(2, '0')}</span>
          <Tag tone={toneMap[signal.signal_type]}>{signal.signal_type}</Tag>
          {signal.geography?.length ? (
            <span className="text-ink-500">{signal.geography.join(' · ')}</span>
          ) : null}
          <span className="ml-auto text-ink-600 group-hover:text-teal-bright transition-colors">
            {open ? '−' : '+'}
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-semibold tracking-tight text-ink-100 leading-snug group-hover:text-teal-bright transition-colors">
          {signal.headline}
        </h3>
        <p className="text-sm text-ink-300 leading-relaxed max-w-reading">
          {signal.summary}
        </p>
      </button>

      {open ? (
        <div id={`signal-body-${signal.id}`} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-3">
            <div>
              <div className="eyebrow text-ink-500 mb-1.5">Why it matters</div>
              <p className="text-sm text-ink-200 leading-relaxed max-w-reading">{signal.why_it_matters}</p>
            </div>
            <div>
              <div className="eyebrow text-ink-500 mb-1.5">Sources</div>
              <SourceList sources={signal.sources} />
            </div>
          </div>
          <aside className="space-y-3 text-sm">
            <div>
              <div className="eyebrow text-ink-500 mb-1.5">Domains</div>
              <div className="flex flex-wrap gap-1.5">
                {signal.domains.map((d) => (
                  <Tag key={d} tone="teal">{domainLabel(d)}</Tag>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow text-ink-500 mb-1.5">Layers</div>
              <div className="flex flex-wrap gap-1.5">
                {signal.layers.map((l) => (
                  <Tag key={l} tone="amber">{layerLabel(l)}</Tag>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </article>
  );
}
