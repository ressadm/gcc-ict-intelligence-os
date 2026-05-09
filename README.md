# GCC ICT Intelligence OS

A web app that publishes a fresh strategic intelligence brief every 24 hours for the GCC B2B telecom, ICT, cloud, AI, cyber, BPO/GBS, and digital infrastructure market.

This is a **decision product**, not a news aggregator. Built for an executive who has 12 minutes a week.

## What it is

- A Next.js 14 (App Router) static-first web app.
- A daily, single-page intelligence brief on `/`.
- A searchable, filterable archive on `/archive`.
- Per-date deep links at `/brief/YYYY-MM-DD`.
- A custom inline SVG logo and a dark-mode-default control-room aesthetic.

## How it works

1. **Discovery** — A Node script (`scripts/refresh-brief.ts`) iterates over the queries in `config/search-queries.ts`. Each query is sent to the Perplexity Sonar API (`sonar-pro`) with a 48-hour recency filter.
2. **Synthesis** — The collected raw signals are then fed to `sonar-reasoning-pro`, with the master analyst prompt (`prompts/master-analyst-prompt.md`) as the system message and an explicit JSON schema contract.
3. **Validation** — The output is parsed and validated against `lib/schema.ts` (Zod). Invalid output triggers up to two retries; a final failure writes `data/status/latest-error.json` and leaves the previous brief untouched.
4. **Publishing** — A valid brief is written atomically to `data/briefs/YYYY-MM-DD.json`. A GitHub Actions cron commits the change. Vercel auto-deploys on push.

There is no database. There is no second LLM. The web app reads the JSON files at build time and renders fully static pages.

## Run locally

```bash
npm install
cp .env.example .env.local
# add PERPLEXITY_API_KEY to .env.local

# UI only (uses the seed brief):
npm run dev

# Generate a fresh brief:
npm run refresh-brief

# Lint / typecheck / build:
npm run lint
npm run typecheck
npm run build
```

The seed brief lives at `data/briefs/2025-01-15.json` and exists so the UI renders without any API calls.

## Daily refresh

A scheduled GitHub Actions workflow (`.github/workflows/refresh-brief.yml`) runs at **05:00 UTC** every day. It:

- Calls `npm run refresh-brief`.
- Validates every brief (`npm run validate-briefs`).
- Commits the new JSON if anything changed.
- Pushes to `main`. Vercel auto-deploys.

You can trigger it manually under **Actions → Refresh daily brief → Run workflow**, optionally with a `date` input (`YYYY-MM-DD`) to backfill or replay a date.

## Editing what is tracked

All data configuration is colocated in `config/`:

- `config/domains.ts` — the ten intelligence domains. Each has a stable ID used in JSON briefs and URLs. **Changing a domain ID is a breaking change** for older briefs.
- `config/layers.ts` — the L1–L5 value-stack layers.
- `config/search-queries.ts` — the discovery queries that drive Stage 1. Add, remove, or rewrite freely; queries are short keyword phrases, not natural-language questions.

The master analyst prompt lives in `prompts/master-analyst-prompt.md`. It is read from disk at runtime; **never inlined** into the script. Edit the file directly.

## Secrets / environment

| Name                            | Where                                | Required | Purpose                              |
| ------------------------------- | ------------------------------------ | -------- | ------------------------------------ |
| `PERPLEXITY_API_KEY`            | GitHub repo secrets, local `.env.local` | yes  | Sonar API auth                       |
| `PERPLEXITY_MODEL_DISCOVERY`    | env (optional)                       | no       | Override discovery model             |
| `PERPLEXITY_MODEL_SYNTHESIS`    | env (optional)                       | no       | Override synthesis model             |
| `REFRESH_DATE`                  | env / workflow input (optional)      | no       | Replay or backfill a specific date   |

The web app itself does **not** read `PERPLEXITY_API_KEY`. It only reads JSON files. Keys are only required for the refresh script (locally and in GitHub Actions).

### Troubleshooting: "Refresh daily brief" workflow fails immediately

If the GitHub Actions run fails at the **Preflight — verify PERPLEXITY_API_KEY is configured** step with an annotation about a missing repository secret, the cron is running without an API key. To fix:

1. Open the repo on GitHub → **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Name it exactly `PERPLEXITY_API_KEY` and paste the Perplexity Sonar API key as the value.
4. Re-run the failed workflow under **Actions → Refresh daily brief → Run workflow**, or wait for the next 05:00 UTC schedule.

Environment-scoped secrets are not used by this workflow; the secret must be a **repository** secret.

## Deployment

1. Push to GitHub.
2. Connect the repo to Vercel — Next.js project, default settings.
3. In GitHub repo settings → Secrets, add `PERPLEXITY_API_KEY`.
4. Done. Each commit triggers a Vercel deploy. Each daily run produces a commit.

No Vercel-side environment variables are required for the web app itself; the build is pure static rendering.

## Cost expectations

Perplexity Sonar is metered per request and per token. The daily refresh issues:

- One `sonar-pro` call per discovery query (defined in `config/search-queries.ts`).
- One `sonar-reasoning-pro` synthesis call per brief, occasionally up to three on retry.

Cost is therefore roughly linear in the number of discovery queries × Sonar's per-request pricing. **No numeric estimates are provided here** — check Perplexity's current pricing before turning the cron on.

To control cost, edit `config/search-queries.ts`: fewer queries = lower spend per day, narrower coverage.

## Limitations (v1)

- Read-only and single-user. No accounts, sign-in, comments, email/push, or integrations.
- One brief per day, one schema, no per-domain mini-briefs.
- The brief schema is intentionally narrow. Adding fields requires a coordinated change across `lib/schema.ts`, `scripts/refresh-brief.ts` (the JSON-schema contract sent to Sonar), and `components/BriefView.tsx`.
- No DB. Briefs are JSON files in the repo. This is an explicit choice (see `DECISIONS.md`).
- Sonar URL hallucinations are mitigated but not eliminated; sources are always shown to the reader so they can sanity-check.
- Dates are UTC-based; users in GMT+3 (KSA) will see the previous UTC day until ~03:00 local.

## File map

```
app/                          # Next.js App Router pages
  page.tsx                    # Today's brief
  archive/                    # /archive — search across all briefs
  brief/[date]/               # /brief/YYYY-MM-DD
  api/health/                 # health-check endpoint
components/                   # UI components (Header, BriefView, etc.)
config/                       # domains, layers, discovery queries
data/
  briefs/YYYY-MM-DD.json      # generated, committed
  status/latest-error.json    # generated when a refresh fails
lib/                          # schema (Zod), Sonar client, brief loaders
prompts/master-analyst-prompt.md  # system prompt — VERBATIM, do not edit casually
scripts/
  refresh-brief.ts            # daily generation entrypoint
  validate-briefs.ts          # CI/dev validation
.github/workflows/
  refresh-brief.yml           # daily cron + manual dispatch
  ci.yml                      # lint, typecheck, validate, build
```

See `DECISIONS.md` for the engineering decisions log.
