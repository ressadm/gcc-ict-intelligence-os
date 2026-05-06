// Daily brief refresh.
//
// Stage 1: DISCOVERY. For each query in config/search-queries.ts, ask sonar-pro
//          to surface fresh signals from the last 48 hours. Collect raw signals
//          plus citations.
// Stage 2: SYNTHESIS. Feed the raw signals into sonar-reasoning-pro using the
//          master analyst prompt as the system message and a strict JSON schema
//          contract. Validate against BriefSchema. Retry up to 2 times.
// Stage 3: WRITE. Atomically write data/briefs/YYYY-MM-DD.json. Idempotent —
//          same date overwrites cleanly. On failure, write
//          data/status/latest-error.json and DO NOT touch existing brief.
//
// Hard rules:
//  - No fabrication. If discovery returns nothing for a query, that's recorded.
//  - Env var PERPLEXITY_API_KEY only.
//  - Validate every Sonar response. Invalid output triggers retry, never silent acceptance.
//  - Fail loudly: error JSON written, process exits non-zero.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { callSonar, extractContent, extractCitations, MODEL_DISCOVERY, MODEL_SYNTHESIS } from '../lib/perplexity';
import { BriefSchema, type Brief } from '../lib/schema';
import { DOMAINS } from '../config/domains';
import { LAYERS } from '../config/layers';
import { DISCOVERY_QUERIES } from '../config/search-queries';

const ROOT = process.cwd();
const BRIEFS_DIR = path.join(ROOT, 'data', 'briefs');
const STATUS_DIR = path.join(ROOT, 'data', 'status');
const PROMPT_PATH = path.join(ROOT, 'prompts', 'master-analyst-prompt.md');

const MAX_SYNTHESIS_ATTEMPTS = 3;

// ---------- helpers ----------

function todayUTC(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function nowISO(): string {
  return new Date().toISOString();
}

async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}

async function writeJSON(p: string, data: unknown): Promise<void> {
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, p);
}

async function writeError(stage: 'discovery' | 'synthesis' | 'validation' | 'write', message: string, attempts: number, detail?: unknown): Promise<void> {
  await ensureDir(STATUS_DIR);
  const errorPayload = {
    date: refreshDate(),
    occurred_at: nowISO(),
    stage,
    message,
    attempts,
    detail,
  };
  await writeJSON(path.join(STATUS_DIR, 'latest-error.json'), errorPayload);
  console.error(`[refresh-brief] ERROR @ ${stage} (attempts=${attempts}): ${message}`);
}

async function clearError(): Promise<void> {
  // Remove stale error if a brief now succeeds.
  const p = path.join(STATUS_DIR, 'latest-error.json');
  try { await fs.unlink(p); } catch { /* not present */ }
}

function refreshDate(): string {
  return process.env.REFRESH_DATE || todayUTC();
}

// ---------- discovery ----------

interface RawSignal {
  query_id: string;
  domain: string;
  raw: string;             // assistant content (markdown/text)
  citations: string[];     // url list from Sonar
}

async function runDiscovery(): Promise<RawSignal[]> {
  const out: RawSignal[] = [];
  for (const q of DISCOVERY_QUERIES) {
    const userPrompt = [
      `You are doing rapid signal discovery for a GCC B2B ICT intelligence brief.`,
      `Topic: ${q.query}`,
      `Window: only the last 48 hours. If nothing genuinely new in 48h, say "NO NEW SIGNALS" and stop.`,
      `Return up to 5 distinct, verifiable signals. For each:`,
      `- One-line headline`,
      `- 1-2 sentence what-happened`,
      `- Why it matters for a B2B telecom/ICT executive`,
      `- The exact source URL (no shorteners, no paraphrased URLs)`,
      `- Date if available`,
      `Do NOT speculate. Do NOT invent. If unsure, omit.`,
    ].join('\n');

    try {
      const resp = await callSonar({
        model: MODEL_DISCOVERY,
        temperature: 0.1,
        search_recency_filter: 'day',
        messages: [
          { role: 'system', content: 'You are a precise signals analyst. Surface only verifiable, recent, GCC-relevant ICT signals. Cite real URLs. If nothing material, say so.' },
          { role: 'user', content: userPrompt },
        ],
      });
      const content = extractContent(resp);
      const citations = extractCitations(resp);
      out.push({ query_id: q.id, domain: q.domain, raw: content, citations });
      // Polite pacing — Sonar handles concurrency but spacing avoids burst rate-limits.
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      // One discovery query failing is not fatal; record an empty result and continue.
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[discovery] query ${q.id} failed: ${msg}`);
      out.push({ query_id: q.id, domain: q.domain, raw: `DISCOVERY ERROR: ${msg}`, citations: [] });
    }
  }
  return out;
}

// ---------- synthesis ----------

function jsonSchemaContract() {
  // JSON schema mirrors lib/schema.ts. Used both as the response_format and inlined
  // into the user prompt so the model has an explicit contract.
  return {
    name: 'gcc_ict_brief',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: [
        'schema_version', 'date', 'generated_at', 'title',
        'executive_summary', 'top_signals', 'demand_pulse',
        'deals_and_partnerships', 'contrarian_view', 'implications', 'meta',
      ],
      properties: {
        schema_version: { type: 'integer', const: 1 },
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        generated_at: { type: 'string' },
        title: { type: 'string' },
        executive_summary: { type: 'string' },
        top_signals: {
          type: 'array', minItems: 1, maxItems: 12,
          items: {
            type: 'object', additionalProperties: false,
            required: ['id', 'headline', 'summary', 'why_it_matters', 'domains', 'layers', 'signal_type', 'geography', 'sources'],
            properties: {
              id: { type: 'string' },
              headline: { type: 'string' },
              summary: { type: 'string' },
              why_it_matters: { type: 'string' },
              domains: { type: 'array', items: { type: 'string' } },
              layers: { type: 'array', items: { type: 'string' } },
              signal_type: { type: 'string', enum: ['critical', 'watch', 'opportunity'] },
              geography: { type: 'array', items: { type: 'string' } },
              sources: {
                type: 'array', minItems: 1,
                items: {
                  type: 'object', additionalProperties: false,
                  required: ['title', 'url'],
                  properties: {
                    title: { type: 'string' },
                    url: { type: 'string' },
                    publisher: { type: 'string' },
                    published_at: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        demand_pulse: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false,
            required: ['segment', 'trajectory', 'evidence', 'sources'],
            properties: {
              segment: { type: 'string' },
              trajectory: { type: 'string', enum: ['accelerating', 'steady', 'softening', 'unclear'] },
              evidence: { type: 'string' },
              sources: { type: 'array', items: { type: 'object', required: ['title', 'url'], properties: { title: { type: 'string' }, url: { type: 'string' }, publisher: { type: 'string' }, published_at: { type: 'string' } } } },
            },
          },
        },
        deals_and_partnerships: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false,
            required: ['type', 'parties', 'headline', 'domains', 'sources'],
            properties: {
              type: { type: 'string', enum: ['M&A', 'Partnership', 'Investment', 'Contract', 'JV'] },
              parties: { type: 'array', items: { type: 'string' } },
              headline: { type: 'string' },
              value_or_scope: { type: 'string' },
              domains: { type: 'array', items: { type: 'string' } },
              sources: { type: 'array', minItems: 1, items: { type: 'object', required: ['title', 'url'], properties: { title: { type: 'string' }, url: { type: 'string' }, publisher: { type: 'string' }, published_at: { type: 'string' } } } },
            },
          },
        },
        contrarian_view: {
          type: 'object', additionalProperties: false,
          required: ['thesis', 'consensus_view', 'why_it_might_be_wrong', 'what_to_watch', 'sources'],
          properties: {
            thesis: { type: 'string' },
            consensus_view: { type: 'string' },
            why_it_might_be_wrong: { type: 'string' },
            what_to_watch: { type: 'array', items: { type: 'string' } },
            sources: { type: 'array', items: { type: 'object', required: ['title', 'url'], properties: { title: { type: 'string' }, url: { type: 'string' }, publisher: { type: 'string' }, published_at: { type: 'string' } } } },
          },
        },
        implications: {
          type: 'array', minItems: 1,
          items: {
            type: 'object', additionalProperties: false,
            required: ['audience', 'recommendation', 'horizon'],
            properties: {
              audience: { type: 'string' },
              recommendation: { type: 'string' },
              horizon: { type: 'string', enum: ['now', '30d', '90d', '12m'] },
            },
          },
        },
        meta: {
          type: 'object', additionalProperties: false,
          required: ['model_synthesis', 'model_discovery', 'discovery_query_count', 'raw_signal_count'],
          properties: {
            model_synthesis: { type: 'string' },
            model_discovery: { type: 'string' },
            discovery_query_count: { type: 'integer' },
            raw_signal_count: { type: 'integer' },
            notes: { type: 'string' },
          },
        },
      },
    },
  } as const;
}

function extractFirstJSON(text: string): unknown {
  // Sonar reasoning models sometimes wrap output in ```json ... ```. Strip and parse.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  // Find first { ... } balanced block.
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Synthesis output contained no JSON object');
  }
  const slice = candidate.slice(start, end + 1);
  return JSON.parse(slice);
}

async function runSynthesis(rawSignals: RawSignal[]): Promise<Brief> {
  const systemPrompt = await fs.readFile(PROMPT_PATH, 'utf8');

  const date = refreshDate();
  const domainList = DOMAINS.map((d) => `- ${d.id}: ${d.label}`).join('\n');
  const layerList = LAYERS.map((l) => `- ${l.id}: ${l.label}`).join('\n');

  const corpus = rawSignals
    .map((s) => `## QUERY ${s.query_id} (domain=${s.domain})\n\n${s.raw}\n\nCITATIONS:\n${s.citations.map((u) => `- ${u}`).join('\n') || '(none)'}`)
    .join('\n\n---\n\n');

  const userPrompt = [
    `Today is ${date}. Produce the daily GCC ICT Intelligence Brief in strict JSON.`,
    ``,
    `## ALLOWED DOMAIN IDS`,
    domainList,
    ``,
    `## ALLOWED LAYER IDS`,
    layerList,
    ``,
    `## RULES`,
    `- Use only signals supported by the discovery corpus below or by your live retrieval. No fabrication.`,
    `- Every top_signal MUST have at least one source URL. Every deal MUST have at least one source URL.`,
    `- domains[] values MUST come from ALLOWED DOMAIN IDS. layers[] values MUST come from ALLOWED LAYER IDS.`,
    `- date MUST equal "${date}".`,
    `- schema_version MUST be 1.`,
    `- meta.model_synthesis MUST be "${MODEL_SYNTHESIS}". meta.model_discovery MUST be "${MODEL_DISCOVERY}".`,
    `- meta.discovery_query_count MUST be ${DISCOVERY_QUERIES.length}. meta.raw_signal_count MUST be ${rawSignals.length}.`,
    `- Output ONLY the JSON object, no prose, no markdown fences.`,
    `- Include a Contrarian View that genuinely contradicts the consensus.`,
    `- Implications must be concrete actions for a B2B telecom/ICT executive, mapped to horizon.`,
    ``,
    `## DISCOVERY CORPUS (last 48h, may include "NO NEW SIGNALS" or errors — reflect that honestly)`,
    corpus.slice(0, 60_000),
  ].join('\n');

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_SYNTHESIS_ATTEMPTS; attempt++) {
    try {
      const resp = await callSonar({
        model: MODEL_SYNTHESIS,
        temperature: 0.15,
        max_tokens: 8000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_schema', json_schema: jsonSchemaContract() },
      });
      const content = extractContent(resp);
      const parsedJson = extractFirstJSON(content);

      // Force-correct fields the model might mislabel.
      const candidate = {
        ...(parsedJson as Record<string, unknown>),
        schema_version: 1,
        date,
        generated_at: nowISO(),
        meta: {
          ...((parsedJson as Record<string, unknown>).meta as Record<string, unknown> | undefined ?? {}),
          model_synthesis: MODEL_SYNTHESIS,
          model_discovery: MODEL_DISCOVERY,
          discovery_query_count: DISCOVERY_QUERIES.length,
          raw_signal_count: rawSignals.length,
        },
      };

      const result = BriefSchema.safeParse(candidate);
      if (!result.success) {
        lastErr = result.error.flatten();
        console.warn(`[synthesis] attempt ${attempt} failed validation:`, JSON.stringify(lastErr).slice(0, 800));
        continue;
      }
      return result.data;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      console.warn(`[synthesis] attempt ${attempt} threw:`, lastErr);
    }
  }

  const e: Error & { stage?: string; attempts?: number; detail?: unknown } = new Error('synthesis failed after retries');
  e.stage = 'synthesis';
  e.attempts = MAX_SYNTHESIS_ATTEMPTS;
  e.detail = lastErr;
  throw e;
}

// ---------- main ----------

async function main(): Promise<void> {
  const date = refreshDate();
  console.log(`[refresh-brief] start date=${date}`);

  if (!process.env.PERPLEXITY_API_KEY) {
    await writeError('discovery', 'PERPLEXITY_API_KEY is not set', 0);
    process.exit(1);
  }

  await ensureDir(BRIEFS_DIR);
  await ensureDir(STATUS_DIR);

  let rawSignals: RawSignal[];
  try {
    rawSignals = await runDiscovery();
    console.log(`[discovery] collected ${rawSignals.length} raw query results`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await writeError('discovery', msg, 1);
    process.exit(1);
  }

  let brief: Brief;
  try {
    brief = await runSynthesis(rawSignals);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const detail = (err as { detail?: unknown }).detail;
    const attempts = (err as { attempts?: number }).attempts ?? MAX_SYNTHESIS_ATTEMPTS;
    await writeError('synthesis', msg, attempts, detail);
    process.exit(1);
  }

  // Final validation pass already done inside runSynthesis. Write atomically.
  try {
    const filePath = path.join(BRIEFS_DIR, `${brief.date}.json`);
    await writeJSON(filePath, brief);
    console.log(`[write] ${filePath}`);
    await clearError();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await writeError('write', msg, 1);
    process.exit(1);
  }

  console.log('[refresh-brief] done');
}

main().catch(async (err) => {
  const msg = err instanceof Error ? err.message : String(err);
  await writeError('synthesis', `unexpected: ${msg}`, 0).catch(() => {});
  console.error(err);
  process.exit(1);
});
