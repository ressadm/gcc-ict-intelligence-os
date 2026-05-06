'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DOMAINS, type DomainId, domainLabel } from '@/config/domains';
import { LAYERS, type LayerId } from '@/config/layers';
import { Tag } from '@/components/Tag';

interface SignalIndexEntry {
  id: string;
  headline: string;
  summary: string;
  domains: string[];
  layers: string[];
  signal_type: 'critical' | 'watch' | 'opportunity';
}

export interface BriefIndexEntry {
  date: string;
  title: string;
  executive_summary: string;
  signals: SignalIndexEntry[];
}

interface ArchiveBrowserProps {
  index: BriefIndexEntry[];
}

export function ArchiveBrowser({ index }: ArchiveBrowserProps) {
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState<DomainId | 'all'>('all');
  const [layer, setLayer] = useState<LayerId | 'all'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return index
      .filter((b) => {
        if (from && b.date < from) return false;
        if (to && b.date > to) return false;
        if (needle) {
          const hay = [
            b.title,
            b.executive_summary,
            ...b.signals.map((s) => `${s.headline} ${s.summary}`),
          ].join(' ').toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if (domain !== 'all') {
          const matches = b.signals.some((s) => s.domains.includes(domain));
          if (!matches) return false;
        }
        if (layer !== 'all') {
          const matches = b.signals.some((s) => s.layers.includes(layer));
          if (!matches) return false;
        }
        return true;
      })
      .map((b) => ({
        ...b,
        signals: b.signals.filter((s) => {
          if (needle) {
            if (!`${s.headline} ${s.summary}`.toLowerCase().includes(needle)) return false;
          }
          if (domain !== 'all' && !s.domains.includes(domain)) return false;
          if (layer !== 'all' && !s.layers.includes(layer)) return false;
          return true;
        }),
      }));
  }, [index, q, domain, layer, from, to]);

  if (index.length === 0) {
    return (
      <div className="border hairline rounded-sm p-6 text-sm text-ink-400">
        No briefs in archive yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <input
          type="search"
          placeholder="Search briefs and signals…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="input-search"
          className="bg-ink-900 border border-white/10 rounded-sm px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-teal/60"
          aria-label="Search archive"
        />
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value as DomainId | 'all')}
          data-testid="select-archive-domain"
          className="bg-ink-900 border border-white/10 rounded-sm px-2 py-2 text-xs uppercase tracking-[0.14em] text-ink-200 focus:outline-none focus:border-teal/60"
          aria-label="Filter by domain"
        >
          <option value="all">All domains</option>
          {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.short}</option>)}
        </select>
        <select
          value={layer}
          onChange={(e) => setLayer(e.target.value as LayerId | 'all')}
          data-testid="select-archive-layer"
          className="bg-ink-900 border border-white/10 rounded-sm px-2 py-2 text-xs uppercase tracking-[0.14em] text-ink-200 focus:outline-none focus:border-teal/60"
          aria-label="Filter by layer"
        >
          <option value="all">All layers</option>
          {LAYERS.map((l) => <option key={l.id} value={l.id}>{l.short}</option>)}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          data-testid="input-from"
          className="bg-ink-900 border border-white/10 rounded-sm px-2 py-2 text-xs text-ink-200"
          aria-label="From date"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          data-testid="input-to"
          className="bg-ink-900 border border-white/10 rounded-sm px-2 py-2 text-xs text-ink-200"
          aria-label="To date"
        />
      </div>

      <div className="text-xxs uppercase tracking-[0.18em] text-ink-500">
        {filtered.length} of {index.length} briefs match
      </div>

      <ul className="space-y-6">
        {filtered.map((b) => (
          <li key={b.date} className="border-t hairline pt-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-teal-bright">{b.date}</span>
              <span className="text-xxs uppercase tracking-[0.18em] text-ink-500">{b.signals.length} signal(s) match</span>
              <Link
                href={`/brief/${b.date}`}
                className="ml-auto text-xxs uppercase tracking-[0.18em] text-ink-300 hover:text-teal-bright"
                data-testid={`link-brief-${b.date}`}
              >
                Open brief →
              </Link>
            </div>
            <h3 className="text-base font-semibold text-ink-100 leading-snug">{b.title}</h3>
            <p className="mt-1.5 text-sm text-ink-400 leading-relaxed line-clamp-3">{b.executive_summary}</p>
            {b.signals.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {b.signals.slice(0, 5).map((s) => (
                  <li key={s.id} className="text-sm text-ink-200">
                    <Link href={`/brief/${b.date}#signal-body-${s.id}`} className="hover:text-teal-bright">
                      <span className="text-ink-500 mr-2 font-mono text-xs">›</span>{s.headline}
                    </Link>
                    <span className="ml-2">
                      {s.domains.slice(0, 2).map((d) => (
                        <Tag key={d} tone="teal" size="xs">{domainLabel(d)}</Tag>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
