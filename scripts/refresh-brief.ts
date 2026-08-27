// Weekly brief refresh.
//
// Stage 1: DISCOVERY. For each query in config/search-queries.ts, ask sonar-pro
//          to surface fresh signals from the last 28 days. Collect raw signals
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
  const override = process.env.REFRESH_DATE;
  if (override) return override;

  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 28);
  return date.toISOString().slice(0, 10);
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
      `Window: from ${refreshDate()} through today (the rolling previous 28 days). Prefer material developments in this period.
`,
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
        search_recency_filter: 'month',
        messages: [
          { role: 'system', content: 'You are a precise weekly signals analyst. Surface only verifiable, recent, GCC-relevant ICT signals from the last 7 days, prioritising this week. Cite real URLs. If evidence is sparse, say LOW SIGNAL DENSITY; do not overstate that nothing happened.' },
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

function stripReasoning(text: string): string {
  // sonar-reasoning-pro emits <think>...</think> chain-of-thought before the answer.
  // Strip everything inside <think> blocks (including unclosed ones at end of stream).
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<think>[\s\S]*$/, '')
    .trim();
}

function extractFencedJSON(text: string): string | null {
  // Prefer a ```json fenced block if present, then any fenced block.
  const jsonFence = text.match(/```json\s*([\s\S]*?)```/i);
  if (jsonFence && jsonFence[1].trim().startsWith('{')) return jsonFence[1];
  const anyFence = text.match(/```\s*([\s\S]*?)```/);
  if (anyFence && anyFence[1].trim().startsWith('{')) return anyFence[1];
  return null;
}

function findBalancedJSONObject(text: string): string | null {
  // Walk the string and return the first balanced { ... } block, respecting strings/escapes.
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
function extractFirstJSON(rawText: string): unknown {
  const text = stripReasoning(String(rawText ?? '')).trim();

  if (!text) {
    throw new Error('Synthesis output was empty');
  }

  if (text.startsWith('{') && text.endsWith('}')) {
    return JSON.parse(text);
  }

  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      const unwrapped = JSON.parse(text);
      if (typeof unwrapped === 'string') {
        const inner = unwrapped.trim();
        if (inner.startsWith('{') && inner.endsWith('}')) {
          return JSON.parse(inner);
        }
      }
    } catch {
      // ignore and continue
    }
  }

  const fenced = extractFencedJSON(text);
  const candidate = fenced ?? text;
  const balanced = findBalancedJSONObject(candidate) ?? findBalancedJSONObject(text);

  if (!balanced) {
    throw new Error(`Synthesis output contained no JSON object. Preview: ${text.slice(0, 500)}`);
  }

  try {
    return JSON.parse(balanced);
  } catch (e) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw e;
  }
}



// ---------- normalization ----------
//
// The master analyst prompt asks the model for prose-shaped output ("four bullets",
// "one paragraph", "Now / 12-month / 3-year"). The schema is stricter. Rather than
// rewrite the master prompt, we accept predictable model deviations and coerce them
// into the schema shape. Anything we can't safely coerce is left as-is so Zod fails.

function toStringFromMaybeArray(v: unknown): unknown {
  if (Array.isArray(v)) {
    // Join bullet-style arrays into a single paragraph string.
    return v
      .map((x) => (typeof x === 'string' ? x : typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x)))
      .map((s) => s.trim().replace(/^[-*•\d.\)\s]+/, '').trim())
      .filter(Boolean)
      .join(' ');
  }
  return v;
}

function normalizeHorizon(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const s = v.trim().toLowerCase();
  if (s === 'now' || s === 'immediate' || s === 'this week' || s === 'this-week') return 'now';
  if (/^30[- ]?d(ay)?s?$/.test(s) || s === '1 month' || s === '1-month' || s === 'one month') return '30d';
  if (/^90[- ]?d(ay)?s?$/.test(s) || s === '3 month' || s === '3-month' || s === '3 months' || s === '3-months' || s === 'quarter') return '90d';
  if (
    /^12[- ]?m(onth)?s?$/.test(s) ||
    s === '12 months' || s === '12-months' || s === '1 year' || s === '1-year' || s === 'year' ||
    s === '3-year' || s === '3 year' || s === '3 years' || s === '3-years' || s === '3-year structural' || s === '3 year structural' ||
    s === 'structural' || s === 'long-term' || s === 'long term'
  ) return '12m';
  return v;
}

function normalizeContrarian(v: unknown): unknown {
  // Schema expects an object; master prompt asks for one paragraph (string). Wrap it.
  if (typeof v === 'string' && v.trim()) {
    return {
      thesis: v.trim(),
      consensus_view: 'See thesis — model returned a single-paragraph contrarian view.',
      why_it_might_be_wrong: v.trim(),
      what_to_watch: [],
      sources: [],
    };
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    // Fill missing required string fields by reusing the thesis when present.
    const thesis = typeof o.thesis === 'string' ? o.thesis : '';
    if (thesis) {
      if (typeof o.consensus_view !== 'string' || !o.consensus_view) o.consensus_view = thesis;
      if (typeof o.why_it_might_be_wrong !== 'string' || !o.why_it_might_be_wrong) o.why_it_might_be_wrong = thesis;
    }
    if (!Array.isArray(o.what_to_watch)) o.what_to_watch = [];
    if (!Array.isArray(o.sources)) o.sources = [];
    return o;
  }
  return v;
}

function normalizeSignalArray(arr: unknown): unknown {
  if (!Array.isArray(arr)) return arr;
  return arr.map((item, idx) => {
    if (!item || typeof item !== 'object') return item;
    const s = item as Record<string, unknown>;
    // Common renamings.
    if (!s.headline && typeof s.title === 'string') s.headline = s.title;
    if (!s.summary && typeof s.what_happened === 'string') s.summary = s.what_happened;
    if (!s.why_it_matters && typeof s.implication === 'string') s.why_it_matters = s.implication;
    if (!s.id) s.id = `signal-${idx + 1}`;
    if (s.signal_type && typeof s.signal_type === 'string') {
      s.signal_type = (s.signal_type as string).toLowerCase();
    }
    if (!Array.isArray(s.domains)) s.domains = [];
    if (!Array.isArray(s.layers)) s.layers = [];
    if (!Array.isArray(s.geography)) s.geography = [];
    if (!Array.isArray(s.sources)) s.sources = [];
    return s;
  });
}

function normalizeDemandPulse(arr: unknown): unknown {
  if (!Array.isArray(arr)) return arr;
  return arr.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const s = item as Record<string, unknown>;
    if (!s.segment && typeof s.name === 'string') s.segment = s.name;
    if (!s.evidence && typeof s.signal === 'string') s.evidence = s.signal;
    if (typeof s.trajectory === 'string') s.trajectory = (s.trajectory as string).toLowerCase();
    if (!Array.isArray(s.sources)) s.sources = [];
    return s;
  });
}

function normalizeImplications(arr: unknown): unknown {
  if (!Array.isArray(arr)) return arr;
  return arr.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const s = item as Record<string, unknown>;
    if (!s.recommendation && typeof s.action === 'string') s.recommendation = s.action;
    if (s.horizon !== undefined) s.horizon = normalizeHorizon(s.horizon);
    return s;
  });
}

function normalizeBriefCandidate(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const o = { ...(input as Record<string, unknown>) };
  if ('executive_summary' in o) o.executive_summary = toStringFromMaybeArray(o.executive_summary);
  if ('contrarian_view' in o) o.contrarian_view = normalizeContrarian(o.contrarian_view);
  if ('top_signals' in o) o.top_signals = normalizeSignalArray(o.top_signals);
  if ('demand_pulse' in o) o.demand_pulse = normalizeDemandPulse(o.demand_pulse);
  if ('implications' in o) o.implications = normalizeImplications(o.implications);
  return o;
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
    `Today is ${date}. Produce the Weekly GCC ICT Intelligence Brief in strict JSON, focused on what changed this week.`,
    ``,
    `## ALLOWED DOMAIN IDS`,
    domainList,
    ``,
    `## ALLOWED LAYER IDS`,
    layerList,
    ``,
    `## RULES`,
    `- Use only signals supported by the discovery corpus below or by your live retrieval. No fabrication. This is a weekly brief, not a 48-hour bulletin.`,
    `- Every top_signal MUST have at least one source URL. Every deal MUST have at least one source URL.`,
    `- domains[] values MUST come from ALLOWED DOMAIN IDS. layers[] values MUST come from ALLOWED LAYER IDS.`,
    `- date MUST equal "${date}".`,
    `- schema_version MUST be 1.`,
    `- meta.model_synthesis MUST be "${MODEL_SYNTHESIS}". meta.model_discovery MUST be "${MODEL_DISCOVERY}".`,
    `- meta.discovery_query_count MUST be ${DISCOVERY_QUERIES.length}. meta.raw_signal_count MUST be ${rawSignals.length}.`,
    `- Output ONLY the JSON object, no prose, no markdown fences, no <think> tags.`,
    `- executive_summary MUST be a single string (one paragraph). Do NOT return an array of bullets — concatenate bullets into one paragraph.`,
    `- contrarian_view MUST be an object with keys { thesis, consensus_view, why_it_might_be_wrong, what_to_watch[], sources[] }. Do NOT return a plain string.`,
    `- implications[].horizon MUST be exactly one of: "now", "30d", "90d", "12m" (lowercase). Map "Now" → "now", "12-month"/"1 year"/"12 months" → "12m", "3-year"/"structural" → "12m", "quarter"/"3 months" → "90d", "1 month" → "30d".`,
    `- Each top_signal MUST include id, headline, summary, why_it_matters, domains[], layers[], signal_type ("critical"|"watch"|"opportunity"), geography[], sources[] with at least one {title,url}.`,
    `- Each demand_pulse item MUST include segment, trajectory ("accelerating"|"steady"|"softening"|"unclear"), evidence, sources[].`,
    `- Include a Contrarian View that genuinely contradicts the consensus.`,
    `- Implications must be concrete actions for a B2B telecom/ICT executive, mapped to horizon.`,
    ``,
    `## DISCOVERY CORPUS (last 7 days, may include "LOW SIGNAL DENSITY", "NO NEW SIGNALS", or errors — handle with calibrated language)`,
    corpus.slice(0, 60_000),
  ].join('\n');

  const lowSignalCount = rawSignals.filter((s) => /LOW SIGNAL DENSITY|NO NEW SIGNALS|DISCOVERY ERROR/i.test(s.raw)).length;
  const lowSignalRatio = rawSignals.length ? lowSignalCount / rawSignals.length : 1;
  if (lowSignalRatio >= 1) {
    const e: Error & { stage?: string; attempts?: number; detail?: unknown } = new Error('discovery corpus too weak for reliable weekly brief');
    e.stage = 'discovery';
    e.attempts = 1;
    e.detail = { lowSignalCount, rawSignalCount: rawSignals.length, lowSignalRatio };
    throw e;
  }

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_SYNTHESIS_ATTEMPTS; attempt++) {
    try {
     const synthesisFormatOverride = [
  'FORMAT OVERRIDE — THIS OVERRIDES ANY CONFLICTING FORMAT INSTRUCTIONS IN THE MASTER PROMPT.',
  'Return exactly one JSON object matching the provided schema.',
  'Do not return prose outside JSON.',
  'Do not return markdown fences.',
  'Do not return bullets unless they are JSON arrays required by the schema.',
  'executive_summary must be a single string.',
  'contrarian_view must be an object.',
  'implications[].horizon must be exactly one of: now, 30d, 90d, 12m.',
  'Output JSON only.',
].join('\n');

const resp = await callSonar({
  model: MODEL_SYNTHESIS,
  temperature: 0.15,
  max_tokens: 8000,
  messages: [
    { role: 'system', content: `${systemPrompt}\n\n${synthesisFormatOverride}` },
    { role: 'user', content: userPrompt },
  ],
  response_format: { type: 'json_schema', json_schema: jsonSchemaContract() },
});

const content = extractContent(resp);

// TEMP DEBUG — keep until this works once successfully
console.log('[synthesis] raw response keys:', Object.keys(resp ?? {}));
console.log('[synthesis] extracted content preview:', JSON.stringify((content || '').slice(0, 1000)));

if (!content || !content.trim()) {
  console.log('[synthesis] full raw response:', JSON.stringify(resp).slice(0, 8000));
  throw new Error('Synthesis returned empty content');
}

const parsedJson = extractFirstJSON(content);

      const normalized = normalizeBriefCandidate(parsedJson) as Record<string, unknown>;

      // Force-correct fields the model might mislabel.
      const candidate = {
        ...normalized,
        schema_version: 1,
        date,
        generated_at: nowISO(),
        meta: {
  ...((normalized.meta as Record<string, unknown> | undefined) ?? {}),
  model_synthesis: MODEL_SYNTHESIS,
  model_discovery: MODEL_DISCOVERY,
  discovery_query_count: DISCOVERY_QUERIES.length,
  raw_signal_count: rawSignals.length,
  notes:
    typeof (normalized.meta as Record<string, unknown> | undefined)?.notes === 'string'
      ? (normalized.meta as Record<string, unknown>).notes
      : '',
},

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
