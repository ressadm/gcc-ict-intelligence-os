// Thin wrapper around the Perplexity Sonar HTTPS API.
// No SDK; only fetch. Uses PERPLEXITY_API_KEY from env.

const PPLX_URL = 'https://api.perplexity.ai/chat/completions';

export type SonarMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string };

export interface SonarOptions {
  model: string;
  messages: SonarMessage[];
  temperature?: number;
  max_tokens?: number;
  // Optional Sonar-specific knobs
  search_recency_filter?: 'hour' | 'day' | 'week' | 'month';
  return_related_questions?: boolean;
  search_domain_filter?: string[];
  response_format?: { type: 'json_schema'; json_schema: { name: string; schema: unknown } };
}

export interface SonarChoice {
  index: number;
  finish_reason?: string;
  message: { role: string; content: string };
}

export interface SonarResponse {
  id: string;
  model: string;
  created: number;
  citations?: string[];
  choices: SonarChoice[];
  usage?: Record<string, number>;
}

export class SonarError extends Error {
  constructor(public readonly status: number, message: string, public readonly body?: unknown) {
    super(message);
    this.name = 'SonarError';
  }
}

export async function callSonar(opts: SonarOptions): Promise<SonarResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new SonarError(0, 'PERPLEXITY_API_KEY is not set');
  }

  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.max_tokens) body.max_tokens = opts.max_tokens;
  if (opts.search_recency_filter) body.search_recency_filter = opts.search_recency_filter;
  if (opts.return_related_questions) body.return_related_questions = opts.return_related_questions;
  if (opts.search_domain_filter?.length) body.search_domain_filter = opts.search_domain_filter;
  if (opts.response_format) body.response_format = opts.response_format;

  const res = await fetch(PPLX_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new SonarError(res.status, `Sonar HTTP ${res.status}: ${text.slice(0, 500)}`, text);
  }

  const json = (await res.json()) as SonarResponse;
  return json;
}

export function extractContent(resp: SonarResponse): string {
  const c = resp.choices?.[0]?.message?.content ?? '';
  return c.trim();
}

export function extractCitations(resp: SonarResponse): string[] {
  return Array.isArray(resp.citations) ? resp.citations.filter((u): u is string => typeof u === 'string') : [];
}

// Sonar models. Override via env if Perplexity renames them.
export const MODEL_DISCOVERY = process.env.PERPLEXITY_MODEL_DISCOVERY || 'sonar-pro';
export const MODEL_SYNTHESIS = process.env.PERPLEXITY_MODEL_SYNTHESIS || 'sonar-pro';
