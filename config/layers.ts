// Value-stack layers (L1–L5). Each signal must be tagged with one or more layers.

export type LayerId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export interface Layer {
  id: LayerId;
  label: string;
  short: string;
  description: string;
}

export const LAYERS: Layer[] = [
  { id: 'L1', label: 'L1 — Compute Infrastructure', short: 'L1 Compute', description: 'Data centres, sub-sea cable, fibre, networks, edge, sovereign infra.' },
  { id: 'L2', label: 'L2 — Cloud, Data & AI Platforms', short: 'L2 Platforms', description: 'Hyperscaler regions, GPU capacity, model platforms, sovereign cloud.' },
  { id: 'L3', label: 'L3 — Enterprise Apps & Workflows', short: 'L3 Apps', description: 'SaaS, ERP/CRM, vertical platforms, AI-native apps, agentic workflows.' },
  { id: 'L4', label: 'L4 — Distribution & Customer Ownership', short: 'L4 Distribution', description: 'Telco B2B, channel, marketplaces, customer relationship and demand capture.' },
  { id: 'L5', label: 'L5 — Managed Services & Operations', short: 'L5 Services', description: 'IT services, SI, BPO, GBS, cyber operations, modernisation programmes.' },
];

export const LAYER_IDS = LAYERS.map((l) => l.id) as [LayerId, ...LayerId[]];

export function layerLabel(id: string): string {
  return LAYERS.find((l) => l.id === id)?.label ?? id;
}
