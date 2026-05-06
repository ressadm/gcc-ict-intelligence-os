// Brief schema. Every Sonar synthesis output is validated against this Zod schema.
// Invalid output triggers retry, not silent acceptance.

import { z } from 'zod';
import { DOMAIN_IDS } from '@/config/domains';
import { LAYER_IDS } from '@/config/layers';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

export const SourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().optional(),
  published_at: z.string().optional(),
});

export const SignalSchema = z.object({
  id: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  why_it_matters: z.string().min(1),
  domains: z.array(z.enum(DOMAIN_IDS)).min(1),
  layers: z.array(z.enum(LAYER_IDS)).min(1),
  signal_type: z.enum(['critical', 'watch', 'opportunity']).default('watch'),
  geography: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).min(1, 'every signal must have at least one source URL'),
});

export const DemandPulseItemSchema = z.object({
  segment: z.string().min(1),
  trajectory: z.enum(['accelerating', 'steady', 'softening', 'unclear']),
  evidence: z.string().min(1),
  sources: z.array(SourceSchema).default([]),
});

export const DealItemSchema = z.object({
  type: z.enum(['M&A', 'Partnership', 'Investment', 'Contract', 'JV']),
  parties: z.array(z.string()).min(1),
  headline: z.string().min(1),
  value_or_scope: z.string().optional(),
  domains: z.array(z.enum(DOMAIN_IDS)).default([]),
  sources: z.array(SourceSchema).min(1),
});

export const ContrarianSchema = z.object({
  thesis: z.string().min(1),
  consensus_view: z.string().min(1),
  why_it_might_be_wrong: z.string().min(1),
  what_to_watch: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).default([]),
});

export const ImplicationSchema = z.object({
  audience: z.string().min(1),
  recommendation: z.string().min(1),
  horizon: z.enum(['now', '30d', '90d', '12m']),
});

export const BriefSchema = z.object({
  schema_version: z.literal(1),
  date: isoDate,
  generated_at: z.string(),
  title: z.string().default('GCC ICT Intelligence Brief'),
  executive_summary: z.string().min(1),
  top_signals: z.array(SignalSchema).min(1).max(12),
  demand_pulse: z.array(DemandPulseItemSchema).default([]),
  deals_and_partnerships: z.array(DealItemSchema).default([]),
  contrarian_view: ContrarianSchema,
  implications: z.array(ImplicationSchema).min(1),
  meta: z.object({
    model_synthesis: z.string(),
    model_discovery: z.string(),
    discovery_query_count: z.number().int().nonnegative(),
    raw_signal_count: z.number().int().nonnegative(),
    notes: z.string().optional(),
  }),
});

export type Brief = z.infer<typeof BriefSchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type DemandPulseItem = z.infer<typeof DemandPulseItemSchema>;
export type DealItem = z.infer<typeof DealItemSchema>;
export type Contrarian = z.infer<typeof ContrarianSchema>;
export type Implication = z.infer<typeof ImplicationSchema>;

export const StatusErrorSchema = z.object({
  date: isoDate,
  occurred_at: z.string(),
  stage: z.enum(['discovery', 'synthesis', 'validation', 'write']),
  message: z.string(),
  attempts: z.number().int().nonnegative(),
  detail: z.unknown().optional(),
});

export type StatusError = z.infer<typeof StatusErrorSchema>;
