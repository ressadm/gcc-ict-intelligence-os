'use client';

import { useMemo, useState } from 'react';
import type { Brief } from '@/lib/schema';
import { DOMAINS, type DomainId } from '@/config/domains';
import { LAYERS, type LayerId } from '@/config/layers';
import { SignalCard } from './SignalCard';

interface FiltersProps {
  brief: Brief;
}

export function FiltersAndSignals({ brief }: FiltersProps) {
  const [domain, setDomain] = useState<DomainId | 'all'>('all');
  const [layer, setLayer] = useState<LayerId | 'all'>('all');

  const filtered = useMemo(() => {
    return brief.top_signals.filter((s) => {
      if (domain !== 'all' && !s.domains.includes(domain)) return false;
      if (layer !== 'all' && !s.layers.includes(layer)) return false;
      return true;
    });
  }, [brief.top_signals, domain, layer]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-5">
        <FilterSelect
          label="Domain"
          value={domain}
          onChange={(v) => setDomain(v as DomainId | 'all')}
          options={[{ value: 'all', label: 'All domains' }, ...DOMAINS.map((d) => ({ value: d.id, label: d.short }))]}
          testid="select-domain"
        />
        <FilterSelect
          label="Layer"
          value={layer}
          onChange={(v) => setLayer(v as LayerId | 'all')}
          options={[{ value: 'all', label: 'All layers' }, ...LAYERS.map((l) => ({ value: l.id, label: l.short }))]}
          testid="select-layer"
        />
        <div className="text-xxs uppercase tracking-[0.18em] text-ink-500 sm:ml-auto">
          {filtered.length} of {brief.top_signals.length} signals
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border hairline rounded-sm p-6 text-sm text-ink-400">
          No signals match this filter combination. Try clearing one of the filters.
        </div>
      ) : (
        <div className="divide-y hairline border-t border-b hairline">
          {filtered.map((s, i) => (
            <SignalCard key={s.id} signal={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  testid?: string;
}

function FilterSelect({ label, value, onChange, options, testid }: FilterSelectProps) {
  return (
    <label className="inline-flex items-center gap-2 text-xxs uppercase tracking-[0.18em] text-ink-400">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="bg-ink-900 dark:bg-ink-900 border border-white/10 rounded-sm px-2 py-1 text-xs uppercase tracking-[0.14em] text-ink-200 focus:outline-none focus:border-teal/60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
