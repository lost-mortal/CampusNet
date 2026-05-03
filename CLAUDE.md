# CLAUDE.md — CampusNet

You are working on CampusNet, a campus social network for a single college (Sinhgad Engineering). React + Vite frontend (existing, mostly built), Node + Express + MongoDB backend (scaffold only). Three-day sprint.

## Read these first, in order
1. `STATE.md` — current build state, last gate passed, next phase, decisions/bugs/cuts logs
2. `project-rules.md` — coding rules, stack constraints, what not to do
3. `PLAN.md` — feature inventory, cut list, day-by-day phase plan with gates
4. `NOTES.md` — running log of what's been built (less critical than STATE.md)

If any of those files contradict each other, the most recent one wins. STATE.md > NOTES.md > PLAN.md when in conflict. Ask the user before resolving anything ambiguous.

## Core principles for this project

**Plan before code.** For any task touching more than 2 files, draft the plan first and confirm with the user. Use plan mode for non-trivial changes. The phase plan in PLAN.md has gates — do not move past a gate without demonstrating it works in the browser.

**Match existing patterns.** The frontend already has a Tailwind dark/neon aesthetic, lucide-react icons, axios for HTTP, react-router v7. Read existing components before writing new ones. Imitate, don't reinvent.

**No new libraries without asking.** The stack is locked: React 19, Vite, Tailwind v4, lucide-react, react-router-dom, axios, framer-motion, react-qr-code on the frontend; express, mongoose, jsonwebtoken (to be installed), bcryptjs (to be installed), socket.io (to be installed), dotenv, cors on the backend. The only NEW libraries that should be installed are: `jsonwebtoken`, `bcryptjs`, `socket.io`, `socket.io-client`, `html5-qrcode`, `@google/generative-ai`. If you think you need anything else, stop and ask.

**Mocking allowed; deletion isn't.** If backend isn't ready, mock on the frontend with a `// MOCK:` comment. Do not delete or rewrite working code to "clean it up."

**Secrets stay in `.env`.** Never hardcode `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, or any other secret. Add new env vars to `.env.example` with placeholder values when introducing them.

## Architecture summary
- **Two account types**: admin (1 hardcoded), student (20 seeded)
- **Multi-state roles for students**: a student may simultaneously be Fresher / Club Member / Club President / Community Manager / Community Member, with constraints (max 1 club, max 1 community managed)
- **Post system is the spine**: 4 types (Recruitment, Event, General, Collab); recruitment has accept/reject, events have ticket QR + scan-to-attend
- **AI services**: one Gemini wrapper, three uses (Search, Live Ops Insights, Admin Insights)
- **Real-time**: Socket.io for personal DMs only; community channels poll every 3s
- **Future-proofing**: every entity has `college` field, payment schema is reserved on Event documents

## Working method

When starting a task:
1. Open `STATE.md` first — confirm where the build is, what's done, what's next
2. Open `PLAN.md`, find the phase you're working on, re-read its gate
3. Open `project-rules.md` if the task involves new patterns
4. Use plan mode (`Shift+Tab`) for any task that will touch 3+ files
5. After the change, run the dev servers and verify the gate manually in the browser
6. After verifying, do these THREE updates:
   - Mark the phase ✅ in `STATE.md`'s phase tracker
   - Add new decisions / bugs / cuts to STATE.md's logs
   - Append a one-line entry to `NOTES.md` under today's date
7. STATE.md must be current at all times. It is the bridge between chat sessions.

When stuck:
- Stop. Don't loop on a failed approach.
- Open the planning chat (claude.ai) and ask. Do not improvise architecture.

When tempted to add a feature:
- Check PLAN.md. If it's not in the cut list as Tier 1 or Tier 2, do not add it.
- If it's in Tier 3 (faked/deferred), do not add it without explicit instruction.

## Key files in the existing repo
- `client/src/App.jsx` — root component with routing
- `client/src/data/mockData.js` — fake data; replace progressively with API calls
- `client/src/layout/` — DashboardLayout, AdminLayout, ClubLayout, CommunityLayout
- `client/src/pages/` — organized by role (admin/, club/, community/, student/, landing/, shared/)
- `client/src/components/` — shared UI components (sidebars, modals)
- `server/server.js` — entry point, currently a hello-world Express scaffold

## When this file gets out of date
If the user has corrected behavior repeatedly, append the rule here with a short reason. Keep this file under 100 lines. The file's job is to onboard a fresh Claude Code session in 60 seconds — not to be exhaustive.
