# STATE.md — live build state (update after every phase)

This file is the bridge between chats. Whenever a chat ends, this file is what the next chat reads to know where I am. Update this file yourself (or have Claude Code update it) at the END of every phase.

Do not delete history. Append. The full build history lives here so any new chat picks up cleanly.

---

## Current position

**Day:** 1
**Last phase passed:** 2.1 (recruitment workflow)
**Next phase to start:** 2.2 (event workflow + QR)
**Blocked on:** nothing

---

## Phase tracker

Mark each phase: ⏳ pending · 🔨 in progress · ✅ passed gate · ❌ blocked · ⚠️ skipped/cut

### Day 1 — Foundation
- ✅ 1.1 Backend skeleton — `/api/health` returns `{ status: 'ok', dbConnected: true }`
- ✅ 1.2 Seed data — 20 students / 5 clubs / 5 communities / posts / applications
- ✅ 1.3 Auth — JWT + first-login password change + replace persona modal
- ✅ 1.4 Deployment — Vercel frontend + Render backend
- ✅ 1.5 Wire feed — replace mockData.js with /api/posts

### Day 2 — The engine
- ✅ 2.1 Recruitment workflow — apply / accept / reject / membership flip
- ⏳ 2.2 Event workflow + QR — register / ticket / scanner / attendance
- ⏳ 2.3 Live Ops stats UI — real aggregation
- ⏳ 2.4 AI Search — Gemini-powered with seeded context
- ⏳ 2.5 Activity hub — aggregator + 4 card types

### Day 3 — Polish + AI insights
- ⏳ 3.1 Personal chat — Socket.io, connection-gated
- ⏳ 3.2 Community channels — announcements + general (polled) + collab + kick
- ⏳ 3.3 Admin layer wiring — manage clubs / communities / announcements
- ⏳ 3.4 AI Insights — Live Ops + Admin dashboard summaries
- ⏳ 3.5 Buffer / polish / smoke test

---

## Decisions log (only NEW ones not in PLAN.md)

- 2026-04-28: Atlas URI must include database name `/campusnet` before `?` so Mongoose writes to correct DB, not default `test`
- 2026-05-04: 1.5 ActionModal does not POST on Apply/Register — UI transitions to success state locally; real POST wired in 2.1/2.2 per plan
- 2026-05-04: Club/Community models must be explicitly required in posts route so Mongoose can populate refs across models
- 2026-05-04: No dedicated recruitment stats page existed — created RecruitmentApplicants.jsx at /club/recruitment/:postId; ClubSidebarLeft now fetches real club from GET /api/clubs/my and links recruitment posts there
- 2026-05-04: DashboardLayout now calls GET /api/auth/me on mount to refresh user profile so club membership shows in sidebar immediately after acceptance without re-login

(Append new decisions here as you build. One line each.)

---

## Bugs log (anything that broke + how it was fixed)

- 2026-04-28: Atlas URI was missing database name segment — fixed before first run

(Append. One line each.)

---

## Cuts log (deviations from PLAN.md, and why)

(Empty so far. Anything you cut, faked, or deferred goes here. With reasoning.)

---

## Tokens / quota notes

- Claude Pro session quota is SHARED between claude.ai chats AND Claude Code (confirmed). Plan accordingly.
- Strategy: one short chat per phase block (1.1–1.5, 2.1–2.5, 3.1–3.5). Open with HANDOFF, run phases, close.
- Save tokens by letting Claude Code drive autonomously between gates; only return to chat at end of phase blocks or when blocked.
