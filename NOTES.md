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
