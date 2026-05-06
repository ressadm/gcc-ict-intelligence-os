// Validate every JSON file in data/briefs/ against BriefSchema.
// Used by CI to fail loudly if a malformed brief was committed.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BriefSchema } from '../lib/schema';

async function main() {
  const dir = path.join(process.cwd(), 'data', 'briefs');
  let files: string[];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    console.log('No data/briefs directory; nothing to validate.');
    return;
  }

  let bad = 0;
  for (const f of files) {
    const p = path.join(dir, f);
    const raw = await fs.readFile(p, 'utf8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error(`INVALID JSON: ${f}`);
      bad++; continue;
    }
    const r = BriefSchema.safeParse(parsed);
    if (!r.success) {
      console.error(`INVALID SCHEMA: ${f}`);
      console.error(JSON.stringify(r.error.flatten(), null, 2));
      bad++;
    } else {
      console.log(`ok: ${f}`);
    }
  }
  if (bad > 0) {
    console.error(`${bad} invalid brief(s)`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
