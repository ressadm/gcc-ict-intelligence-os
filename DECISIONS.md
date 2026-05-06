# Engineering Decisions Log

One line per decision. Format: `[YYYY-MM-DD] CHOSEN over REJECTED — reason.`

## Architecture

- [v1] Next.js 14 App Router over Remix/SvelteKit/Astro — required by brief; widest Vercel + static-rendering support; matches the React/TS skill assumption.
- [v1] Static rendering (`force-static`, `dynamicParams=false`) over SSR/ISR — briefs are file-driven and regenerate via commit, so static-at-build is correct and gives the Lighthouse target headroom.
- [v1] No database; briefs as versioned JSON files under `data/briefs/YYYY-MM-DD.json` over Postgres/SQLite/KV — read-only single-user product, source-controlled audit trail, no infra to operate.
- [v1] Pure Perplexity stack via raw `fetch` over the Perplexity SDK or any other LLM provider — explicit brief constraint; one less dependency to track.
- [v1] Two-stage Sonar flow (discovery `sonar-pro` → synthesis `sonar-reasoning-pro`) over single-shot synthesis — separates retrieval recency control from reasoning quality, makes citation provenance explicit per query.
- [v1] Master prompt read from `prompts/master-analyst-prompt.md` at runtime over inlining — explicit brief constraint; allows non-engineer edits without code change.
- [v1] Zod schema validation with structured retry over best-effort parsing — invalid output triggers up to two retries, then writes `data/status/latest-error.json` and exits non-zero. Previous brief is never overwritten by an invalid one.
- [v1] Atomic write via `*.tmp` + rename over direct write — protects against partial writes on cron interruption.
- [v1] `data/status/latest-error.json` deleted on successful refresh over leaving stale errors — UI surfaces only fresh failures.
- [v1] GitHub Actions cron + commit + Vercel auto-deploy over Vercel cron + Edge Function — keeps the web app fully static; deploys are observable as commits; rollback is `git revert`.
- [v1] Single ISO-date file ID over hash/slug — date is a natural primary key; idempotent refresh on the same date overwrites cleanly.

## Schema & data

- [v1] `schema_version: 1` literal field over no version — future-proofs migrations.
- [v1] Domain IDs as a closed enum derived from `config/domains.ts` over free-form strings — synthesis cannot drift into ad-hoc taxonomies.
- [v1] Layer IDs `L1`–`L5` as enum over numeric — keeps URL-safe, matches user-facing labels.
- [v1] `signal_type` enum (`critical | watch | opportunity`) over numeric severity — readable in JSON, maps directly to color tokens.
- [v1] Sources required (`min(1)`) on every signal and every deal over optional — brief rule: "every source URL clickable" implies presence.
- [v1] Force-correct `meta` and `date` fields after parsing over trusting model output — eliminates a class of validation flakes where the model echoes wrong values.
- [v1] JSON Schema contract sent via `response_format` AND inlined as text in the user prompt — belt-and-braces; some Sonar models honour structured output strictly, others only loosely.

## UI & design

- [v1] Dark mode default with class-based toggle over `prefers-color-scheme`-only — brief specifies dark default with toggle; FOUC-prevention script reads localStorage before paint.
- [v1] Warm dark slate (#0b0d10 / #11141a) over pure black or neutral grey — control-room feel without coldness; pairs with restrained teal/amber accents.
- [v1] Restrained teal (#5fb3a6) + amber (#d49a4a) accents over neon/purple/gradient palette — aligns with sober executive intelligence brief, avoids AI aesthetic.
- [v1] System sans-serif stack over Google Fonts — zero network cost, matches "precise, readable" requirement, no vendor dependency, better Lighthouse score.
- [v1] Contrarian View styled with amber left-border + grid backdrop over a coloured card — visually distinct without screaming; reads as a different register, not a different importance.
- [v1] Inline SVG logo (5 horizontal bars + scan line) over wordmark-only — encodes the L1–L5 stack semantically; works at 24px and 200px; uses `currentColor` for theme adaptability.
- [v1] Top Signals as collapsible cards (collapsed by default) over always-expanded — supports the 12-min/week reading mode; expand-on-tap matches mobile-first.
- [v1] Filters (domain + layer) as plain `<select>` over multi-select chips — single-user, low-friction, fully keyboard-accessible, no JS framework needed.
- [v1] Archive search as client-side `String.includes` over Fuse.js/MiniSearch — corpus is small (a few hundred briefs at most over years), zero dependency cost.
- [v1] Static SVG `app/icon.svg` over generated favicon set — Next.js auto-generates the link tag, one source of truth.

## Tooling & ops

- [v1] `tsx` for script execution over `ts-node` or compile-then-run — faster cold start in CI, less config.
- [v1] No client-side analytics, no telemetry, no third-party scripts — read-only single-user product; privacy and Lighthouse both benefit.
- [v1] Concurrency group on the refresh workflow over allowing parallel runs — prevents race condition on the same date file.
- [v1] `permissions: contents: write` scoped to the refresh workflow only over default `GITHUB_TOKEN` — least-privilege.
- [v1] `validate-briefs` as a separate step in CI over relying on build to catch malformed JSON — catches schema drift early.
- [v1] `output: 'standalone'` in `next.config.mjs` over default — deploys cleanly on Vercel and any Node runtime; keeps options open.
- [v1] Polite 400 ms spacing between discovery queries over fully parallel `Promise.all` — avoids burst rate-limit on Sonar; total wall-clock cost is minutes, not hours.

## Things explicitly out of scope (rejected)

- **Comments, accounts, email/push** — explicit v1 exclusion.
- **A second LLM (e.g. for headline rewriting)** — would violate the pure-Perplexity rule.
- **Server-side rendering for the brief page** — unnecessary; static is faster and cheaper.
- **Storing briefs in Vercel KV / Postgres / S3** — adds infra without product value at this scale.
- **A "regenerate now" button in the UI** — read-only product. Refresh runs via GitHub Actions only.
- **Numeric per-call cost estimates in README** — explicit brief instruction; pricing changes too often.
