# CampusNet — Build Notes

A running log. End of each day, append what was built, decided, broken, and deferred. This is the raw material for your final report and research paper.

---

## Day 0 — Setup (date: ___)

- Cloned repo to `C:\Projects\CampusNet\CampusNet`
- Enabled PowerShell script execution (`RemoteSigned`, CurrentUser scope)
- Antigravity added a root-level `package.json` with `dev:client`, `dev:server`, and `install:all` convenience scripts (this is fine; not a real monorepo, just a wrapper)
- Installed dependencies: 112 server packages, 212 client packages
- Verified: frontend renders at `localhost:5173`, backend hello-world at `localhost:5000`
- Walkthrough of all existing pages completed; feature inventory locked
- Plan documents written: `PLAN.md`, `project-rules.md`, `CLAUDE.md`

---

## Day 1 — Foundation (date: ___)

### Built
-

### Decisions
-

### Bugs hit
-

### Cut from plan
-

### Tomorrow's first task
-

---

## Day 2 — The engine (date: ___)

### Built
-

### Decisions
-

### Bugs hit
-

### Cut from plan
-

### Tomorrow's first task
-

---

## Day 3 — Polish + AI insights (date: ___)

### Built
- 2026-05-22: Production deployment — bundled ALL remaining feature work (phases 1.5 through 3.5, including AI Insights for Live Ops + Admin dashboard) + deployment hardening into commit 11e3999; pushed to main → Vercel + Render auto-deployed. Removed 35 localhost fallbacks; central `client/src/lib/config.js` with hard-fail on missing env; backend requires `ALLOWED_ORIGINS`; deleted unauthenticated `/api/dev/students` leak. Deployed health endpoint + CORS preflight verified server-side; localhost dev path retested and unaffected. App is feature-complete; remaining work is manual smoke-testing both environments for parity.
- 2026-05-22: Hotfix — UTF-8 mojibake regression caused by PowerShell 5.1's CP1252-default text encoding during the bulk localhost-fallback strip. 30 client source files were silently double-encoded; emoji + middle dots + ellipses + dropdown arrows rendered as `Â·` / `â€¦` / `ðŸ"¢` on both deployed and localhost. Fixed via reverse round-trip script (`scripts/fix-mojibake.js`); production build re-verified.
- 2026-05-28: Student lifecycle pass. (1) New `firstname.<random5><joiningYY>@sinhgad.edu` email scheme — code generated (NOT surname-derived), keyed to joining year so it survives rollover; one shared generator in `server/utils/studentIdentity.js`. (2) `User.phone` + `'Alumni'` year enum. (3) Safe in-place migration `scripts/migrateEmailsPhones.js` (dry-run default, `--commit` to write, touches only email+phone) — user runs it. (4) Dual-mode CSV import (college-provides-email vs generate-email; both require phone). (5) `POST /api/admin/advance-year` rollover (FE→SE→TE→BE→Alumni, roll prefix fe→se→te→be→al) with a count-summary confirm modal. (6) Alumni sidebar item + `/admin/alumni` page. (7) Student Directory dept/year filters + phone column. (8) Admin view-only student profile popups (no Connect button) in directory + alumni. Verified: client build clean, server modules load, generators sanity-checked. Browser smoke test + running the migration left to the user.
- 2026-06-25: AI Search rebuilt on embeddings (was flaky "no matches" because the generative call almost always failed — free-tier key has `limit:0`/429 on `gemini-2.5-flash` & `gemini-2.0-flash` generate; only `gemini-2.5-flash-lite` works). New flow: embed entities once via `gemini-embedding-001` (cached, per-item, 768-dim), cosine-rank the query locally (relative cutoff: top ≥0.62 then keep within 0.07), then `gemini-2.5-flash-lite` writes reasons + judges relevance (precision filter, best-effort w/ retry+timeout, synthesized on failure). Keyword search kept as last-resort fallback. `getModel()` default → flash-lite (also unblocks AI Insights). Verified end-to-end against live DB+API. Note: docs/report describe the old single-call design — to be reconciled in the report write-up.
- 2026-06-25: AI Search → TWO-STAGE HYBRID (same day, follow-up). The pure-embedding version reasoned too shallowly (e.g. missed GDSC for "web development" because its broad description sits only medium-close in vector space, and reasons were capped at 20 words). Fix: Stage 1 embeddings now pull a GENEROUS shortlist (top match ≥0.60 gate, then within 0.15 of top, cap 15) so broad entities reach the reasoner; Stage 2 flash-lite reads their full descriptions, filters by relevance, and writes 1-2 sentence reasons citing specifics (token cap 3072). Verified: GDSC resurfaces for "web development" with a detailed reason; reliability unchanged (retrieval still embedding-only, generative pass still best-effort w/ synthesized fallback). Warm queries now ~7-8s (was 1-3s) — accepted for the quality gain.

### Decisions
-

### Bugs hit
-

### Cut from plan
-

### Final state for review
-

---

## Open questions / parked

- (Note things that came up mid-build but weren't blocking. Revisit before final review week.)
