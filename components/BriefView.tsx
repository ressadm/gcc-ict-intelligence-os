import type { Brief } from '@/lib/schema';
import { domainLabel } from '@/config/domains';
import { SectionHeading } from './SectionHeading';
import { Tag } from './Tag';
import { SourceList } from './SourceList';
import { FiltersAndSignals } from './Filters';

interface BriefViewProps {
  brief: Brief;
}

export function BriefView({ brief }: BriefViewProps) {
  return (
    <article className="space-y-12">
      {/* Hero / Date strip */}
      <section className="pt-6 sm:pt-10">
        <div className="flex items-center gap-3 text-xxs uppercase tracking-[0.22em] text-ink-400 mb-4">
          <span className="block h-1.5 w-1.5 rounded-full bg-teal animate-pulse" aria-hidden />
          <span>Daily Brief</span>
          <span className="text-ink-600">·</span>
          <span className="font-mono text-ink-300">{brief.date}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tightest text-ink-100 leading-tight max-w-3xl">
          {brief.title}
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          GCC B2B telecom · ICT · cloud · AI · cyber · BPO/GBS · digital infrastructure
        </p>
      </section>

      {/* 1. Executive Summary */}
      <section aria-labelledby="executive-summary">
        <SectionHeading eyebrow="Section 01" title="Executive Summary" />
        <p
          id="executive-summary"
          className="text-base sm:text-[1.05rem] leading-relaxed text-ink-100 max-w-reading"
        >
          {brief.executive_summary}
        </p>
      </section>

      {/* 2. Top Signals */}
      <section aria-labelledby="top-signals">
        <SectionHeading
          eyebrow="Section 02"
          title="Top Signals"
          count={brief.top_signals.length}
          meta="Tap a signal to expand"
        />
        <FiltersAndSignals brief={brief} />
      </section>

      {/* 3. Demand Pulse */}
      <section aria-labelledby="demand-pulse">
        <SectionHeading
          eyebrow="Section 03"
          title="Demand Pulse"
          count={brief.demand_pulse.length}
        />
        {brief.demand_pulse.length === 0 ? (
          <EmptyNote>No demand-pulse readings produced for this date.</EmptyNote>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {brief.demand_pulse.map((d, i) => (
              <div key={i} className="border hairline rounded-sm p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Tag tone={trajectoryTone(d.trajectory)}>{d.trajectory}</Tag>
                </div>
                <h3 className="text-sm font-semibold text-ink-100 leading-snug">{d.segment}</h3>
                <p className="mt-1.5 text-sm text-ink-300 leading-relaxed">{d.evidence}</p>
                {d.sources?.length ? (
                  <div className="mt-3 pt-3 border-t hairline">
                    <SourceList sources={d.sources} compact />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. M&A / Partnership Watch */}
      <section aria-labelledby="deals">
        <SectionHeading
          eyebrow="Section 04"
          title="M&A / Partnership Watch"
          count={brief.deals_and_partnerships.length}
        />
        {brief.deals_and_partnerships.length === 0 ? (
          <EmptyNote>No new deal activity surfaced for this window.</EmptyNote>
        ) : (
          <ul className="divide-y hairline border-t border-b hairline">
            {brief.deals_and_partnerships.map((d, i) => (
              <li key={i} className="py-3">
                <div className="flex items-center gap-2 mb-1 text-xxs uppercase tracking-[0.18em] text-ink-500">
                  <Tag tone="teal">{d.type}</Tag>
                  <span>{d.parties.join(' × ')}</span>
                </div>
                <p className="text-sm text-ink-100 leading-snug">{d.headline}</p>
                {d.value_or_scope ? (
                  <p className="text-xs text-ink-400 mt-1">Scope: {d.value_or_scope}</p>
                ) : null}
                {d.domains?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.domains.map((dom) => (
                      <Tag key={dom} tone="neutral">{domainLabel(dom)}</Tag>
                    ))}
                  </div>
                ) : null}
                <div className="mt-2.5">
                  <SourceList sources={d.sources} compact />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 5. Contrarian View — visually distinct */}
      <section aria-labelledby="contrarian">
        <SectionHeading
          eyebrow="Section 05"
          title="Contrarian View"
          meta="A view that contradicts the consensus"
        />
        <div
          className="relative overflow-hidden border-l-2 border-amber bg-amber/5 dark:bg-amber/[0.04] rounded-r-sm p-5 sm:p-6"
        >
          <div
            aria-hidden
            className="absolute inset-0 grid-backdrop opacity-50 pointer-events-none"
          />
          <div className="relative">
            <div className="eyebrow text-amber-bright mb-2">Contrarian thesis</div>
            <p className="text-base sm:text-lg text-ink-100 font-medium leading-snug max-w-reading">
              {brief.contrarian_view.thesis}
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <div className="eyebrow text-ink-500 mb-1.5">Consensus view</div>
                <p className="text-sm text-ink-300 leading-relaxed">{brief.contrarian_view.consensus_view}</p>
              </div>
              <div>
                <div className="eyebrow text-ink-500 mb-1.5">Why it might be wrong</div>
                <p className="text-sm text-ink-200 leading-relaxed">{brief.contrarian_view.why_it_might_be_wrong}</p>
              </div>
            </div>
            {brief.contrarian_view.what_to_watch?.length ? (
              <div className="mt-5">
                <div className="eyebrow text-ink-500 mb-1.5">What to watch</div>
                <ul className="text-sm text-ink-200 leading-relaxed list-disc list-inside space-y-1">
                  {brief.contrarian_view.what_to_watch.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {brief.contrarian_view.sources?.length ? (
              <div className="mt-4 pt-4 border-t border-amber/20">
                <SourceList sources={brief.contrarian_view.sources} compact />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 6. Implications */}
      <section aria-labelledby="implications">
        <SectionHeading
          eyebrow="Section 06"
          title="Implications"
          count={brief.implications.length}
        />
        <ul className="divide-y hairline border-t border-b hairline">
          {brief.implications.map((imp, i) => (
            <li key={i} className="py-3 grid grid-cols-[auto_1fr] sm:grid-cols-[8rem_1fr_5rem] gap-3 sm:gap-4 items-start">
              <Tag tone="amber">{imp.horizon}</Tag>
              <div>
                <div className="text-xxs uppercase tracking-[0.18em] text-ink-500 mb-0.5">{imp.audience}</div>
                <p className="text-sm text-ink-100 leading-snug">{imp.recommendation}</p>
              </div>
              <div className="hidden sm:block text-xxs uppercase tracking-[0.18em] text-ink-600 text-right font-mono">
                {String(i + 1).padStart(2, '0')} / {String(brief.implications.length).padStart(2, '0')}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Meta footer */}
      <section aria-label="brief metadata">
        <div className="border hairline rounded-sm p-4 text-xxs uppercase tracking-[0.18em] text-ink-500 grid gap-2 sm:grid-cols-4">
          <div>Synthesis · <span className="text-ink-300 font-mono normal-case tracking-normal">{brief.meta.model_synthesis}</span></div>
          <div>Discovery · <span className="text-ink-300 font-mono normal-case tracking-normal">{brief.meta.model_discovery}</span></div>
          <div>Queries · <span className="text-ink-300 font-mono normal-case tracking-normal">{brief.meta.discovery_query_count}</span></div>
          <div>Raw signals · <span className="text-ink-300 font-mono normal-case tracking-normal">{brief.meta.raw_signal_count}</span></div>
        </div>
      </section>
    </article>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="border hairline rounded-sm p-4 text-sm text-ink-400">
      {children}
    </div>
  );
}

function trajectoryTone(t: string): 'teal' | 'amber' | 'critical' | 'neutral' {
  switch (t) {
    case 'accelerating': return 'teal';
    case 'softening': return 'critical';
    case 'steady': return 'neutral';
    default: return 'amber';
  }
}
