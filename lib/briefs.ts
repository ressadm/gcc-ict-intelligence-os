// Server-side brief loaders. Reads versioned JSON files under data/briefs/.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BriefSchema, type Brief, StatusErrorSchema, type StatusError } from './schema';

const BRIEFS_DIR = path.join(process.cwd(), 'data', 'briefs');
const STATUS_DIR = path.join(process.cwd(), 'data', 'status');

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function listBriefDates(): Promise<string[]> {
  try {
    const files = await fs.readdir(BRIEFS_DIR);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .filter((d) => DATE_RE.test(d))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function loadBrief(date: string): Promise<Brief | null> {
  if (!DATE_RE.test(date)) return null;
  const filePath = path.join(BRIEFS_DIR, `${date}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const result = BriefSchema.safeParse(parsed);
    if (!result.success) {
      // Don't throw at request time — log and return null so the UI can show an error state.
      console.error(`Invalid brief at ${filePath}:`, result.error.flatten());
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

export async function loadLatestBrief(): Promise<Brief | null> {
  const dates = await listBriefDates();
  for (const d of dates) {
    const b = await loadBrief(d);
    if (b) return b;
  }
  return null;
}

export async function loadAllBriefs(): Promise<Brief[]> {
  const dates = await listBriefDates();
  const briefs: Brief[] = [];
  for (const d of dates) {
    const b = await loadBrief(d);
    if (b) briefs.push(b);
  }
  return briefs;
}

export async function loadLatestError(): Promise<StatusError | null> {
  const filePath = path.join(STATUS_DIR, 'latest-error.json');
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const result = StatusErrorSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
