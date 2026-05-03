# CampusNet — 3-Day Build Plan

A campus social network for a single college (Sinhgad Engineering, departments: COMP / ENTC / IT / MECH; years: FE / SE / TE / BE). Built on the existing React + Vite frontend; Node + Express + MongoDB backend to be built from a scaffold during this sprint.

## 1. Locked design decisions

These are settled. Do not relitigate during build sessions; come back to the planning chat if a real conflict arises.

### Identity
- Two account types: admin (single account), student (bulk-imported)
- Student email format: `firstname.rollnumber@college.edu` (e.g., `parth.fe2023comp042@sinhgad.edu`)
- `rollNumber` is the unique identifier in DB; email is secondary
- JWT-based auth; first-login forces password change
- Multi-state roles: a student can simultaneously be a Fresher / Club Member / Club President / Community Manager / Community Member, subject to constraints below

### Role state constraints
- Max 1 club membership per student at a time
- Max 1 community managed per student at a time
- Unlimited communities joined
- Students cannot leave a club voluntarily (president must remove them)
- Community managers cannot step down (only admin can revoke by deleting the community)
- Admin assigns club presidents from a student dropdown

### Post system
- Four post types in home feed:
  1. **Recruitment** (president-only) — Apply button, applicant list, accept/reject, accepted = club member. One active per club at a time. Has its own stats dashboard with breakdown by department and year.
  2. **Event** (president-only) — Register button, ticket with QR, scanner per event, attendance marked on scan. Many active per club. Has its own stats dashboard. Free or paid (paid not implemented but schema supports it).
  3. **General** (president-only) — informational, no action button.
  4. **Collab request** (community member-created in Collab Requests channel) — surfaces to home feed; Connect button uses two-stage opt-in.
- Tags: Technical, Cultural, Sports, Recruitment, Creative, Other (single tag per post; act as feed filters)

### Communities
- Four channels per community:
  1. Announcements (manager-only broadcasts)
  2. General (group chat, all members)
  3. Discussions (Reddit-style threaded posts with upvotes, comments, Hot/New/Top sort)
  4. Collab Requests (any member; surfaces to home feed)
- Manager powers: post in announcements, kick members, no other moderation tools

### Activity hub (profile tab)
- Aggregates all user interactions across the app
- Subsections: Event Tickets, Recruitment Applications, Collab Connections, General Connections
- Each entry is a floating card; click to expand/act

### Personal chat
- 4th profile tab (Instagram-style: list of past conversations)
- Real-time via Socket.io
- Connection-gated: chat only with mutually connected students (collab connect or general connect)

### AI services
- One Gemini integration powers three surfaces: AI Search, Live Ops Insights, Admin Dashboard Insights
- Same backend wrapper, different prompts

### QR scanner
- **Camera-based, real scanner** (decision reverted from manual entry — this was a core feature in your previous semester report)
- `html5-qrcode` library on frontend; per-event scope
- Manual ticket-ID fallback input as backup

### Architectural future-proofing (do now, defer real implementation)
- `college` field on every entity (hardcoded to one value initially)
- Schema accommodates: alumni read-only, yearly rollover, multi-tenant
- Payment schema: events store `paymentConfig: { enabled, recipient: { upiId, name }, amount }`; UPI deep-link + screenshot-upload flow described in writeup but not built

---

## 2. Feature inventory and cut list

The honest math: ~25–30 productive hours over 3 days. Everything below is scoped to fit.

### Tier 1 — Build real (must be functional in demo)
These are the demo backbone. Cut none.

| Feature | Hours | Notes |
|---|---|---|
| MongoDB Atlas setup + Mongoose models | 2 | All entities, relationships, indexes |
| Seed script (20 students, 5 clubs, 5 communities, posts, applications) | 2 | Replaces CSV upload UI for demo |
| JWT auth + admin and student login | 3 | Including first-login password change |
| Wire frontend to backend (replace mockData.js with Axios) | 4 | Touches every page |
| Post system: create + feed display + filter by tag | 3 | All four types |
| Recruitment flow: apply → applicant list → accept/reject → membership | 2 | The core loop |
| Event flow: register → ticket with QR → camera scanner → attendance mark | 3 | The wow feature |
| Live Ops stats (recruitment + event, with department/year breakdown) | 2 | Real aggregation |
| AI Search (Gemini-powered, returns clubs/communities/students) | 2 | The other wow feature |
| Activity hub (Event Tickets, Applications, Collab connections, General connections) | 2 | The central inbox |
| Personal chat (Socket.io, connection-gated) | 3 | Most polished real-time surface |
| Deployment (Vercel frontend, Render backend, MongoDB Atlas) | 2 | Done day 1, not day 3 |
| **Subtotal** | **30** | |

### Tier 2 — Build minimal (works but not polished)

| Feature | Hours | Approach |
|---|---|---|
| Admin: Manage Clubs (create/edit/delete) | 1 | Existing UI; wire backend |
| Admin: Manage Communities (approve/reject/delete) | 1 | Existing UI; wire backend |
| Admin: Post Announcements (with department/year targeting) | 1 | Existing UI; wire backend |
| Community channels: Announcements + General (group chat) | 2 | Use Socket.io infrastructure already built for personal chat |
| Community Discussions: read-only, seeded data | 0.5 | Show UI; no live posting/voting/commenting |
| Collab Requests channel | 1 | Create + surface to home feed |
| Notifications (basic list, polled) | 1 | Cross-feature alerts; no push |
| Live Ops AI Insights (Gemini summary on stats page) | 1 | Single endpoint, single prompt |
| Admin Dashboard AI Insights | 1 | Same Gemini wrapper, different prompt |
| Community manager: kick member action | 0.5 | Single endpoint |
| Club president: remove member action | 0.5 | Single endpoint |
| **Subtotal** | **10.5** | |

### Tier 3 — Faked or deferred
Not built; either staged with seeded data or out-of-scope with explanation in writeup.

- **CSV bulk upload UI** — seeded directly via script. Demo shows admin's student directory with imported users. Saves 2h.
- **Paid event registration** — schema in place; UI shows the toggle but submitting marks the event as paid-but-payment-pending. Writeup explains UPI deep-link upgrade path. Saves 4h.
- **Discussions full CRUD** — seeded threads with comments. Read-only in demo. Saves 4h.
- **Real-time community chat** — General channel uses polling (not Socket.io). Personal chat is the showcase real-time surface. Saves 2h.
- **Notifications push** — list view only; check on page load. No real-time push. Saves 2h.
- **Yearly rollover automation** — schema supports `joinYear`; rollover logic deferred. Writeup explains cron job.
- **Alumni view-only mode** — out of scope; mentioned in writeup as future work.
- **Multi-college / multi-university** — `college` field reserved; out of scope. Writeup is the deliverable.

### Total time budget
Tier 1 + Tier 2 = ~40 hours. Available = ~30 hours. Gap = 10 hours.

**Bridge the gap with these specific moves:**
- Day 1 deployment uses Vercel + Render auto-deploy on git push: **saves 1h** ongoing during build (no redeploy ceremony).
- Reuse the same Gemini wrapper for AI Search, Live Ops Insights, Admin Insights: **saves 2h** (one library, three prompts).
- Reuse Socket.io infrastructure between personal chat and community General channel: **saves 1h**.
- Component reuse: applicant card, registrant card, member card all share a `<UserChip>` component: **saves 2h**.
- AI does the typing — the realistic hours are ~70% of the unassisted hours for this kind of CRUD work: **saves ~10h** if we maintain discipline.

That bridges it, but only if you don't over-engineer. The plan only works if every Tier 2 feature stays "build minimal."

---

## 3. Day-by-day phase plan with gates

Each gate is a thing you must demonstrate in your browser before moving to the next phase. If a gate fails, stop and fix; do not push forward.

### Day 1 — Foundation (target: 9 hours)

**Phase 1.1 — Backend skeleton (2h)**
- Set up MongoDB Atlas free tier; get connection string
- Build all Mongoose models (User, Club, Community, Post, Application, Registration, Connection, Message, Announcement, etc.)
- One health-check endpoint that connects to DB
- **Gate**: `GET /api/health` returns `{ status: 'ok', dbConnected: true }`

**Phase 1.2 — Seed data (2h)**
- Write `seed.js` script that drops and recreates the database with 20 students, 5 clubs (each with assigned president), 5 communities (each with manager), realistic posts, applications, registrations
- One student should be a member of one club AND a community manager (proves multi-state)
- **Gate**: run seed script; admin login (manual JWT in Postman or similar) returns student list of 20

**Phase 1.3 — Auth (2h)**
- POST /api/auth/login (admin or student email + password)
- JWT issued, returned in response, stored in frontend localStorage
- POST /api/auth/change-password (forced on first login)
- Auth middleware on protected routes
- Replace the persona-modal on the landing page with real login form
- **Gate**: log in as a seeded student in the browser, see your name in the sidebar, log out, log back in

**Phase 1.4 — Deployment (1h)**
- Push frontend to Vercel (auto-deploy on git push)
- Push backend to Render (auto-deploy on git push)
- Confirm CORS works between deployed domains
- **Gate**: open the deployed URL in a different browser; log in works

**Phase 1.5 — Wire feed (2h)**
- Replace `mockData.js` imports in StudentFeed with Axios calls to `/api/posts`
- Posts return with: type, author club, tags, action button visibility based on user state
- Tag filter bar works
- **Gate**: feed renders real seeded posts; clicking Apply on a recruitment post shows a network call (action handling comes Day 2)

**End of Day 1 — what you have:** working login, deployed app, real posts on feed, no actions wired yet. Update NOTES.md.

### Day 2 — The engine (target: 10 hours)

**Phase 2.1 — Recruitment workflow (2h)**
- POST /api/posts/:id/apply
- Applicant list endpoint for president; aggregation grouped by department and year
- Accept/reject endpoints; accept flips student's role to member
- **Gate**: as student, apply to a recruitment post; switch to that club's president, see applicant in list, accept; switch back to student, sidebar shows membership

**Phase 2.2 — Event workflow + QR (3h)**
- Register endpoint creates Registration with UUID
- Ticket display in profile/Activity uses `react-qr-code` (already in dependencies)
- Scanner page using `html5-qrcode`; manual entry fallback input
- POST /api/registrations/:id/scan marks attended
- Per-event stats endpoint
- **Gate**: register for event as student → ticket appears in Activity → switch to club member, scan QR with phone (or manually enter ticket ID) → attendance marks → stats update

**Phase 2.3 — Live Ops stats UI (1h)**
- Recruitment stats card: total applied, by department, by year
- Event stats card: registered, attended, no-show, by department, by year, revenue if paid
- **Gate**: president sees real numbers matching seed + new actions

**Phase 2.4 — AI Search (2h)**
- One Gemini wrapper service in backend
- POST /api/ai/search takes natural-language query
- Service fetches all clubs/communities/students, includes in prompt as context
- Returns structured JSON: matched entities + reasoning
- Frontend renders result cards with Connect buttons on student matches
- **Gate**: type "I want to learn web development and meet people who code" → see relevant clubs (GDSC), communities (Web Dev Forum), and 2-3 student suggestions

**Phase 2.5 — Activity hub (2h)**
- Aggregator endpoint pulls registrations + applications + connection requests for current user
- Activity tab UI renders cards: Tickets, Applications, Collab Connections, General Connections
- Click ticket → modal with QR; click application → status; click connection → list/accept
- **Gate**: as student, Activity tab shows everything you've done (your applications, your tickets, connection requests sent and received)

**End of Day 2 — what you have:** demoable core. Recruitment + events + AI search + activity hub all real. Update NOTES.md.

### Day 3 — Polish, edges, and AI insights (target: 8 hours)

**Phase 3.1 — Personal chat (Socket.io) (3h)**
- Socket.io server; rooms per connection pair
- Frontend Chat tab in profile: list of past conversations, click to open thread
- Connection-gated: only opens if connection exists
- Messages persist to MongoDB; load history on open
- **Gate**: open two browser windows, log in as two connected students, send a message, see it appear instantly in both

**Phase 3.2 — Community channels (1.5h)**
- Announcements: manager creates, all see
- General: polled chat (not Socket.io to save time)
- Discussions: read-only, seeded threads with comments
- Collab Requests: create + surface to home feed
- Member kick action for manager
- **Gate**: open a community, post announcement, see it; another user posts in General, see it after polling refresh

**Phase 3.3 — Admin layer wiring (1.5h)**
- Manage Clubs: create/edit/delete with backend
- Manage Communities: approve/reject pending; delete existing
- Post Announcements: targeting works; appear on matching students' Announcements page only
- **Gate**: as admin, approve a pending community, switch to that student → "Create Community" button replaced with title card

**Phase 3.4 — AI Insights layers (1h)**
- Live Ops Insights: Gemini summary of recruitment/event performance
- Admin Dashboard Insights: Gemini summary of campus-wide trends
- Same wrapper, two prompts
- **Gate**: insights render with sensible narrative based on seed data

**Phase 3.5 — Buffer / polish / fix (1h)**
- Fix landing page rendering if needed
- Fix any broken pages
- Smoke-test the full demo flow end to end
- **Gate**: walk the entire demo script (login → feed → apply → register → scan → AI search → connect → chat → admin) without a hitch

**End of Day 3 — what you have:** demo-ready. Update NOTES.md with the final feature list and what was deferred.

---

## 4. Demo script (rehearse this)

For the first review, walk faculty through this exact path. ~7 minutes.

1. Land on landing page → click Login → log in as a Fresher student
2. Show feed: "I see posts from clubs I'm not in yet"
3. Open AI Search → type "I'm interested in robotics" → see Robotics Club + AI Hub community + 2 robotics-passionate students
4. Click on a recruitment post (Robotics Club) → Apply
5. Switch tabs / log out / log in as Robotics president → Live Ops → see your application; show stats by department/year; accept it
6. Switch back to student → Activity → see "Accepted into Robotics Club"; sidebar now shows Robotics Club membership
7. Show event flow: as student, register for AI Hackathon → Activity → ticket with QR
8. Switch to club member → open scanner → scan QR (use phone or manual entry) → attendance marks → stats update live
9. Show AI Insights on Live Ops page: "Most applicants are TE COMP students; FE participation is low"
10. Open Personal Chat → show ongoing conversation in real-time (open second window if needed)
11. Switch to admin → show analytics dashboard with AI insights → approve a pending community

Ten minutes max. Practice once before review.

---

## 5. Documentation discipline (running notes)

End of each day, append to `NOTES.md` in the project root:

```
## Day N (date)
- Built: [list features]
- Decisions: [list with reasoning]
- Bugs hit: [what broke and how it was fixed]
- Cut: [anything dropped from the plan and why]
- Tomorrow: [first task]
```

This is your research paper's methodology section, written 5 minutes a day instead of from memory in a single panic the night before submission. Do not skip this.
