# STATE.md — live build state (update after every phase)

This file is the bridge between chats. Whenever a chat ends, this file is what the next chat reads to know where I am. Update this file yourself (or have Claude Code update it) at the END of every phase.

Do not delete history. Append. The full build history lives here so any new chat picks up cleanly.

---

## Current position

**Day:** 3
**Last phase passed:** 3.3 + bulk import (Admin layer fully wired: ManageClubs CRUD, ManageCommunities two-tab with delete, AdminAnnouncements POST/GET, student Announcements page wired to real API; CSV/Excel bulk student import with full pre-flight validation; announcements targeting bug fixed)
**Next phase to start:** 3.4 (AI Insights — Live Ops + Admin dashboard summaries)
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
- ✅ 2.2 Event workflow + QR — register / ticket / scanner / attendance
- ✅ 2.3 Live Ops stats UI — attendance rate card + dept/year breakdowns for events & recruitment
- ✅ 2.4 AI Search + public profiles — Gemini-powered search + Club/Community/Student public profile pages
- ✅ 2.5 Activity hub — aggregator + 4 card types

### Day 3 — Polish + AI insights
- ✅ 3.1 Personal chat — Socket.io, connection-gated
- ✅ 3.2 Community channels — announcements + general (polled) + collab + kick
- ✅ 3.2-ext Club channels — announcements (president-post) + general/custom chat (polled) + club profile (real data + edit) + member list (real API + navigate)
- ✅ 3.3 Admin layer wiring — manage clubs / communities / announcements
- ⏳ 3.4 AI Insights — Live Ops + Admin dashboard summaries
- ⏳ 3.5 Buffer / polish / smoke test

---

## Decisions log (only NEW ones not in PLAN.md)

- 2026-04-28: Atlas URI must include database name `/campusnet` before `?` so Mongoose writes to correct DB, not default `test`
- 2026-05-04: 1.5 ActionModal does not POST on Apply/Register — UI transitions to success state locally; real POST wired in 2.1/2.2 per plan
- 2026-05-04: Club/Community models must be explicitly required in posts route so Mongoose can populate refs across models
- 2026-05-04: No dedicated recruitment stats page existed — created RecruitmentApplicants.jsx at /club/recruitment/:postId; ClubSidebarLeft now fetches real club from GET /api/clubs/my and links recruitment posts there
- 2026-05-04: DashboardLayout now calls GET /api/auth/me on mount to refresh user profile so club membership shows in sidebar immediately after acceptance without re-login
- 2026-05-15: 2.3 EventStats — added 4th stat card (Attendance Rate with green ≥70 / amber 40–69 / red <40 color thresholds) + side-by-side Department and Year breakdown tables (registered / attended / rate); all computed from `registrants` array already in API response, no extra endpoints
- 2026-05-15: 2.3 RecruitmentApplicants — replaced simple agg cards with 4 stat cards (Applied / Accepted / Pending / Acceptance Rate) + dept and year breakdown tables (applied / accepted / rate); cleaned up unused `aggregation` from destructure
- 2026-05-15: 2.4 AI Search uses `gemini-2.5-flash` — `gemini-1.5-flash` returned 404 (deprecated on v1beta), `gemini-2.0-flash` returned 429 with `limit: 0` on free tier
- 2026-05-15: 2.4 Gemini wrapper has 3-layer JSON extraction (direct parse, fence-strip, brace-find) with empty-result fallback on any error — service never crashes
- 2026-05-15: 2.4 Search loading state uses randomized catchy phrases (8 options) instead of literal "Gemini is searching"
- 2026-05-15: 2.4 Public profile pages live under plural routes (`/clubs/:id`, `/communities/:id`, `/students/:id`) to avoid collision with existing singular `/community/:id` workspace dashboard
- 2026-05-15: 2.4 Schema additions are backward-compatible — `User.skills` (array), `Club.logoEmoji` (default `🏆`), `Community.icon` (default `🌐`); existing docs read with defaults until re-seeded
- 2026-05-15: 2.4 Community public profile uses recent Collab posts as "Recent Activity" preview — `Announcement` model has no `community` field, true per-community announcements deferred
- 2026-05-15: 2.4 Profile EDIT wiring deferred to follow-up — existing StudentProfile/ClubProfile edit UIs exist but write to local state only; PATCH endpoints + form wiring is its own pass
- 2026-05-15: 2.4 Connect button reuses POST /api/connections; new GET /api/connections/status/:userId returns 'none' | 'sent' | 'received' | 'connected' | 'self' for profile-button state
- 2026-05-15: 2.5 Activity hub uses single GET /api/activity/me aggregator (6 parallel DB queries); PATCH /api/connections/:id/accept added to connections route; optimistic UI update on accept without page refresh; Chat button is a disabled placeholder (wired in 3.1)
- 2026-05-15: 3.1 Message schema rewritten — `roomId` (indexed) + explicit `sender`/`receiver` replace the old `connection` ref; roomId = sorted user IDs joined by '_' (deterministic, same room regardless of initiator)
- 2026-05-15: 3.1 Socket.io shares the same HTTP server as Express via `http.createServer(app)` then `initSocket(httpServer)` — single port, single deploy artifact
- 2026-05-15: 3.1 JWT verified in `io.use` middleware via `socket.handshake.auth.token`; rejected sockets never reach event handlers
- 2026-05-15: 3.1 Connection gate enforced server-side on both `join_room` and `send_message` — frontend pre-checks via GET /api/messages/with/:userId for the "You need to connect first" UX path
- 2026-05-15: 3.1 Optimistic send uses `clientId` (timestamp + random suffix) — server echoes it back on `new_message`, client replaces the temp entry; sender never sees a duplicate
- 2026-05-15: 3.1 Activity-hub Chat buttons navigate to `/profile?tab=chat&with=<userId>`; StudentProfile syncs `activeTab` with URL searchParams so deep-links auto-open the right thread
- 2026-05-15: 3.1 Switched session storage from `localStorage` → `sessionStorage` via new `client/src/lib/session.js` helper (`getToken`/`getUser`/`setSession`/`setUser`/`clearSession`). Reason: localStorage is shared across all tabs of an origin, so logging into a second account in another tab silently overwrote the first tab's token + user — Priya's tab started rendering Tanvi's data and using Tanvi's bearer token. sessionStorage is per-tab and fixes this cleanly. Trade-off: closing the tab clears the session (reloads still survive). All 18 client files migrated; logout goes through `clearSession()`.
- 2026-05-15: 3.2 Three new models — `CommunityMessage` (general channel polled chat), `CommunityAnnouncement` (manager-only posts), `Discussion` (Reddit-style threads with embedded comments). Kept the existing `Announcement` model for admin's department/year-targeted announcements; community announcements are a distinct collection.
- 2026-05-15: 3.2 Collab posts reuse the existing `Post` model with `type: 'Collab'` + `community` ref so they surface on the home feed via `/api/posts` for free. Added `skills: [String]` to Post schema for the collab tag list.
- 2026-05-15: 3.2 `CommunityLayout` fetches community + members once on mount and passes them to child channels via `<Outlet context={...} />` → `useOutletContext()`. Children get `{ community, members, currentUserId, isManager, isMember, refreshCommunity }` without re-fetching.
- 2026-05-15: 3.2 General channel polls `GET /api/communities/:id/messages` every 3000ms via `setInterval`; auto-scroll snaps to bottom only if the user was already near the bottom (anchors past-conversation scrolling).
- 2026-05-15: 3.2 Discussions sort is purely client-side — `Hot = upvotes / (hoursOldSincePost + 2)` (the +2 dampener prevents brand-new posts with 0 votes from dominating); `New` and `Top` are straight sorts. No new backend endpoint needed per the spec.
- 2026-05-15: 3.2 Extended `POST /api/connections` to accept `{ type: 'collab', sourcePostId }` — recipient is inferred from the post's author, and `sourcePost` is stored on the Connection so the Activity Hub's collab-connections tabs (built in 2.5) render correctly.
- 2026-05-15: 3.2 Member kick: manager-only `DELETE /api/communities/:id/members/:userId` with a two-step confirmation in the right sidebar (hover → trash icon → click → Confirm/× pair). Removing the manager is blocked at the API layer.
- 2026-05-16: 3.2-fix Wrong layout — `/communities/:id` (plural) was nested under `DashboardLayout` so the community profile rendered as a center pane inside the home page chrome. Removed that route; added a `CommunityRedirect` that maps `/communities/:id` → `/community/:id` so existing links (right sidebar, search results, student-profile community list) all land on the full-page workspace under `CommunityLayout`, matching how `/club/*` works.
- 2026-05-16: 3.2-fix Community sidebar now lists all four channels (Announcements, General, Discussions, Collab Requests) as uniform `NavLink`s in a single Channels group, matches the club sidebar layout, and shows "Managed by &lt;Name&gt;" + Manager/Member pulsing badge in the header. Header is now clickable → opens the new community About page.
- 2026-05-16: New `CommunityAbout` page at `/community/:id/about` (also the new default index for the workspace). Renders cover + icon + name + tags + description + 3 stat tiles (members / tags / manager) + recent activity. Manager sees an Edit Profile button that opens a modal posting to the new `PATCH /api/communities/:id` endpoint (manager-only, accepts name / description / icon / tags). On save, `refreshCommunity()` from outlet context re-fetches so sidebar header + center page update in lockstep without page reload.
- 2026-05-16: Old `client/src/pages/public/CommunityPublicProfile.jsx` is now an orphan (not routed, not imported). Left in place rather than deleted — the cover/description shape was adapted into the new in-workspace About page.
- 2026-05-16: Right sidebar rebuilt — removed "Explore Nexus" heading/subtitle; added Create Community button with four states (create / pending / manager card / rejected→retry); added My Communities list; added Suggested Communities with join/request-join per community type; clicking a suggestion navigates to /communities/:id public-profile preview.
- 2026-05-16: /communities/:communityId (plural) now renders CommunityPublicProfile inside DashboardLayout instead of hard-redirecting. Component self-redirects to /community/:id if caller is already a member/manager. Non-members see public profile with Join button; on join they land in the workspace. This covers Suggested Communities, AI search results, and Explore Communities.
- 2026-05-16: Community model additions — `reason: String` (admin review field, not shown publicly), `isPrivate: Boolean` (default false), `joinRequests: [{user, createdAt}]` (embedded array for private join requests).
- 2026-05-16: Private community join flow — POST /:id/join blocked (403) for private communities; new POST /:id/request-join pushes to joinRequests; new POST /:id/accept-join/:userId (manager-only) moves user from joinRequests → members. Public join flow unchanged.
- 2026-05-16: GET /api/communities (list) now returns isPrivate + hasRequested per community so suggestions sidebar can show lock icon and hourglass state without an extra fetch.
- 2026-05-16: CommunityMemberList now receives pendingRequests prop (from GET /:id/members, manager-only). Pending requests render at top of the panel with amber tint and a green UserPlus accept button; accepting calls POST /:id/accept-join/:userId then re-runs fetchAll in CommunityLayout.
- 2026-05-16: CreateCommunityModal rebuilt — scrollable flex-column layout (max-h-[90vh]); fields stack cleanly: Name, Description, Tags, Visibility (Public/Private toggle cards), Reason, buttons; portaled to document.body to escape sidebar overflow stacking context.

- 2026-05-17: 3.3 Admin clubs CRUD wired — GET/POST /api/admin/clubs, PATCH/DELETE /api/admin/clubs/:id; ManageClubs rewired from mockData to real API with real student dropdown for president assignment.
- 2026-05-17: 3.3 ManageCommunities gets two-tab layout — Pending (existing approve/reject) + Approved (new, with DELETE /api/admin/communities/:id); GET /api/admin/communities/approved added.
- 2026-05-17: 3.3 AdminAnnouncements wired to POST/GET /api/admin/announcements; fixed department names (CS→COMP, added ENTC/IT/MECH); added `priority` field to Announcement model; recent list loaded from API.
- 2026-05-17: 3.3 Student Announcements page wired to GET /api/announcements/me — filters by dept+year match (ALL or specific); replaces ANNOUNCEMENTS mockData import; new announcements route file mounted in server.js.
- 2026-05-17: 3.3 Bulk student import — POST /api/admin/import-students; accepts base64-encoded CSV or Excel; full pre-flight validation (missing fields, invalid dept/year, in-file duplicates, DB duplicates); creates NO accounts if any error exists; returns full error list with row+rollNumber labels; ManageUsers upload box now shows file chip + "Import Students" button; success/error feedback panel below box; student table auto-refreshes on success. xlsx installed on server.

- 2026-05-17: Event/Recruitment polish pass — Post schema gained `registrationDeadline`, `isPaid`, `amount`, `paymentQrImage`; Registration schema: `ticketId` now sparse (issued at approval for paid events), `paymentStatus` enum widened to `free | pending_verification | approved`, added `paymentScreenshot`. Server bumped express.json limit to 10mb to fit base64 QR + screenshots.
- 2026-05-17: Feed cards now expose `alreadyRegistered` + `myRegistrationStatus` per event (single bulk Registration query in GET /api/posts). Button state machine in StudentFeed: Verification Pending (amber) → Already Registered (grey) → Registration closed on [date] → Register Now. Recruitment cards block past deadline with "Applications closed on [date]".
- 2026-05-17: Paid event flow — CreatePostModal got Free/Paid toggle, html5-qrcode.scanFile() client-side QR validation (non-blocking hint), amount input. ActionModal widens to max-w-2xl for paid events; shows event detail block + QR + screenshot upload; Register button disabled until screenshot picked; new `pending_verification` success state. Activity hub `/api/activity/me` filters out pending_verification regs so broken tickets don't appear.
- 2026-05-17: Live Ops payment column in EventStats — `View Screenshot` modal, `Approve Payment` (PATCH /api/registrations/:id/approve-payment, any club member, generates ticketId on approval), `Reject Payment` (DELETE /api/registrations/:id/reject-payment with confirm prompt, deletes the reg so student can resubmit). Attendance left to QR scanner — no manual Mark Attendance button.

## Bugs fixed in this session
- 2026-05-17: BUG 1 React Router transition crash — ChannelChat's `navigate('/club/chat/general')` in useEffect fired twice under React 19 StrictMode (mount → cleanup → remount), throwing "Cannot transition to a new state, already under transition" which surfaced at /club/recruitment/:id via the ClubLayout-level ErrorBoundary. Fixed by wrapping the navigate in setTimeout(fn, 0) with a clearTimeout cleanup so StrictMode's simulated unmount cancels the pending nav.
- 2026-05-17: BUG 2 Already registered button — feed event card now grey-disables "Already Registered" pill instead of "Register Now" when GET /api/posts.alreadyRegistered is true.

(Append new decisions here as you build. One line each.)

---

## Bugs log (anything that broke + how it was fixed)

- 2026-04-28: Atlas URI was missing database name segment — fixed before first run
- 2026-05-15: QR Scanner in EventStats auto-started camera on page mount and rendered hidden — fixed by gating behind a Start Scanner button and keeping the `#qr-reader` div always visible in the DOM (html5-qrcode needs a visible element to size the video stream); innerHTML cleared after stop/decode so the frozen frame doesn't persist
- 2026-05-15: Sign-out confirmation modal in StudentLeftSidebar rendered behind feed content — the parent `<aside sticky>` creates a new CSS stacking context, so `z-50` was scoped to it; fixed with `ReactDOM.createPortal(..., document.body)` + bumped to `z-[9999]`
- 2026-05-15: MongoDB Atlas SRV lookup failed (`querySrv ECONNREFUSED`) on mobile hotspot — Indian carriers intercept DNS and block SRV queries; fixed by forcing Google + Cloudflare DNS in `server.js` AND `seed.js` via `dns.setServers([...])` + `dns.setDefaultResultOrder('ipv4first')` at process startup
- 2026-05-15: Gemini search returned clubs/communities but never students — context omitted the `skills` array even though schema had it; fixed by including skills in the context payload + tightening prompt to favor student matches when bios/skills relate
- 2026-05-15: Cross-tab session leak — logging into Account B in Tab B silently overwrote Account A's token in Tab A (both via `localStorage`, which is shared per origin). Profile header showed A while sidebar + API calls used B's identity; reload would flip the tab to B entirely. Fixed by migrating all token/user storage to `sessionStorage` through a new `client/src/lib/session.js` helper (18 files migrated).
- 2026-05-16: 500s on `GET /api/communities/comm_001` — the StudentRightSidebar's "Suggested Communities" was hardcoded to mockData IDs (`comm_001`/`comm_002`). Mongoose CastError on the string ID bubbled to a 500. Fixed by (a) `router.param('id', ...)` guard returning 404 for invalid ObjectIds, (b) new `GET /api/communities` list endpoint, (c) sidebar now fetches real communities.
- 2026-05-16 (open bug, not yet fixed): Collab card has TWO visual treatments — compact horizontal card on the home feed (community badge top, COLLAB pill, author, body, Connect button) vs. plain title/body/footer card inside the community's collab-requests channel. They display the same underlying post but look like different objects. Decide on one canonical visual; also: the community name and author name in the home-feed card should be clickable links into the community workspace and the student profile respectively. Logged for a polish pass.
- 2026-05-16: CreateCommunityModal clipped at top — sidebar's `overflow-y-auto` creates stacking context that traps `position: fixed` children; fixed with `ReactDOM.createPortal(..., document.body)` matching the sign-out modal pattern.
- 2026-05-16: Rejection notification for community request deferred — no Notification model exists yet; on rejection the right sidebar correctly shows the Create Community button again (mine.pending is null for rejected status). Notification to be wired in Phase 3.3 admin layer.
- 2026-05-17: CommunityPublicProfile reactivated from orphan — non-members see public preview with isPrivate badge + join/request-join button; members/managers auto-redirect to workspace; wired to real API; routed as /communities/:id inside DashboardLayout.
- 2026-05-17: isManager helper bug fix — community.manager.toString() returned JSON when manager was populated (Mongoose document, not raw ObjectId); fixed with (community.manager._id ?? community.manager).toString() pattern applied to all isManager/isMemberOrManager helpers in communities.js.
- 2026-05-17: Community collab Connect button — POST /api/connections with {type:'collab', sourcePostId}; button hidden for own posts (authorId vs currentUserId comparison); connectedIds Set tracks per-session state; shows green "Requested" badge after success or 409.
- 2026-05-17: Club channels wired — 2 new models (ClubAnnouncement, ClubMessage), Club.channels [String] field for custom channels; 8 new routes under /api/clubs/my/* (channels CRUD, announcements CRUD, messages CRUD, PATCH profile); ClubLayout now passes outlet context; ClubSidebarLeft fetches dynamic channels with president + inline form; ClubMemberList uses real API with dept-emoji avatars, clickable to /students/:id; ChannelChat rewrites announcements mode (president compose at top, 3s poll) and chat mode (newest-at-bottom, auto-scroll, Enter to send); ClubProfile wired with real data + Edit Profile modal (president edits emoji/description/tags via PATCH /api/clubs/my/profile).
- 2026-05-17: Community discussions fully wired — POST /:id/discussions (create thread), POST /:id/discussions/:did/comments (add comment), POST /:id/discussions/:did/upvote; DiscussionBoard polls every 3s, has inline new-thread form (members/manager only); PostDetail polls every 3s, has comment box with Ctrl+Enter submit, functional upvote button; `server/seedDiscussions.js` seeds 2-3 threads + comments per approved community, safe to re-run (skips communities that already have discussions).
- 2026-05-16: Admin community management wired — added GET /api/admin/communities (pending only), PATCH /api/admin/communities/:id/approve, PATCH /api/admin/communities/:id/reject to admin.js. ManageCommunities.jsx fully rewired from mockData to live API; shows isPrivate badge, tags, reason field, requester details with dept avatar; approve/reject have loading state.
- 2026-05-16: Kicked-member redirect — CommunityLayout tracks wasEverMember ref; on any fetchAll where isMember + isManager both become false for a previously-admitted user, immediately navigates to /communities/:id (public profile). Fires automatically since member-list kick calls onChanged → fetchAll.
- 2026-05-17: Club new-channel form missing cancel — Escape key was the only way to dismiss it; added an X button next to the Check confirm button so president can cancel without typing anything.
- 2026-05-17: Student Announcements page showed "No announcements" even after admin posted one — JWT only encodes `{_id, role}`, so `req.user.department` and `req.user.year` were undefined in the /api/announcements/me route; MongoDB $or query never matched. Fixed by fetching the student doc from DB inside the route to get real dept/year before querying.
- 2026-05-17: ManageClubs president picker upgraded from native `<select>` to a custom searchable dropdown (StudentPicker component) with query filter, keyboard-friendly, outside-click-to-close — native select was unusable at scale with 20+ students.

(Append. One line each.)

---

## Cuts log (deviations from PLAN.md, and why)

- 2026-05-15: Profile EDIT wiring deferred — only public read views built in 2.4 Part 2. Reason: edit has more UX surface (validation, save states, perms) and the 2.4 gate is read-only. Schema fields + seed data are in place so  the next pass is purely "wire existing form to PATCH endpoint."
- 2026-05-15: "Click student name anywhere in the app" only wired in Search results — feed posts, applicants list, and member lists still render names as plain text. Reason: cross-app pass is its own cleanup, not core to the 2.4 gate.
- 2026-05-15: Community public profile shows "Recent Activity" (Collab posts) instead of true Announcements — Announcement model has no `community` field. Reason: adding it + seeding per-community announcements is structural change outside the 2.4 scope. Faked with Collab posts which read identically.
- 2026-05-17: Analytics Dashboard deferred — PLAN.md 3.3 includes it; skipped for now, will handle in 3.5 polish pass if time allows. All other 3.3 items complete.
- 2026-05-17: CSV bulk import UI built (was Tier 3 / "seeded not uploaded" in PLAN.md) — demo value outweighed the cut; adds ~1h but removes the need to explain away the upload box on screen. Full validation-first flow makes it safe to demo live.

---

## Tokens / quota notes 

- Claude Pro session quota is SHARED between claude.ai chats AND Claude Code (confirmed). Plan accordingly.
- Strategy: one short chat per phase block (1.1–1.5, 2.1–2.5, 3.1–3.5). Open with HANDOFF, run phases, close.
- Save tokens by letting Claude Code drive autonomously between gates; only return to chat at end of phase blocks or when blocked.
