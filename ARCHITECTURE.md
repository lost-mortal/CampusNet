# CampusNet — Architecture (Ground Truth)

Source-of-truth reference for the B.E. Project Report Stage 2. Every claim below is grounded in code that exists on `main` as of 2026-05-22. Text only; diagrams come later.

---

## 1. Stack Inventory

### Frontend (`client/package.json`)

Runtime dependencies (exact versions):

| Package | Version |
|---|---|
| `react` | ^19.2.0 |
| `react-dom` | ^19.2.0 |
| `react-router-dom` | ^7.13.0 |
| `axios` | ^1.13.4 |
| `socket.io-client` | ^4.8.3 |
| `framer-motion` | ^12.30.0 |
| `lucide-react` | ^0.563.0 |
| `react-qr-code` | ^2.0.18 |
| `html5-qrcode` | ^2.3.8 |
| `@tailwindcss/postcss` | ^4.1.18 |
| `tailwindcss` | ^4.1.18 |

Dev tooling: `vite` ^7.2.4, `@vitejs/plugin-react` ^5.1.1, `eslint` ^9.39.1 (+ react-hooks / react-refresh plugins), `postcss` ^8.5.6, `autoprefixer` ^10.4.24.

No state-management library (no Redux / Zustand). No `react-query`. No auth-context provider — session lives in `sessionStorage` (see §4).

### Backend (`server/package.json`)

CommonJS, Node + Express. Runtime dependencies:

| Package | Version |
|---|---|
| `express` | ^5.2.1 |
| `mongoose` | ^9.1.5 |
| `socket.io` | ^4.8.3 |
| `jsonwebtoken` | ^9.0.3 |
| `bcryptjs` | ^3.0.3 |
| `cors` | ^2.8.6 |
| `dotenv` | ^17.2.3 |
| `@google/generative-ai` | ^0.24.1 |
| `xlsx` | ^0.18.5 |
| `nodemon` | ^3.1.11 (dev runner) |

No test framework wired in (`npm test` prints an error). No request validator (e.g. Zod / Joi). No rate limiter, no Helmet. Request body limit is `10mb` (set in `server/server.js`) to accommodate base64 image uploads.

### Project root

The top-level `package.json` is just convenience scripts (`dev:client`, `dev:server`, `install:all`, `start:server`). No workspace tooling, no lockfile at root.

---

## 2. Data Models

All schemas live in `server/models/`. All use `{ timestamps: true }` unless noted. Every domain entity carries a `college: String` field (default `'SINHGAD_ENGINEERING'`) to keep the door open for multi-college without schema changes.

### User (`models/User.js`)

| Field | Type | Notes |
|---|---|---|
| `rollNumber` | String | unique, sparse (admin has none) |
| `email` | String | required, unique, lowercase |
| `passwordHash` | String | required, bcrypt |
| `firstName` | String | required |
| `lastName` | String | required |
| `role` | String enum | `'admin' \| 'student'`, default `'student'` |
| `department` | String enum | `'COMP' \| 'ENTC' \| 'IT' \| 'MECH'` |
| `year` | String enum | `'FE' \| 'SE' \| 'TE' \| 'BE' \| 'Alumni'` (Alumni = graduated, final state) |
| `joinYear` | Number | derived from roll number; the email keys off this so it survives rollover |
| `phone` | String | default `''`; 10-digit Indian mobile, shown in admin directory |
| `mustChangePassword` | Boolean | default `true` (drives first-login screen) |
| `motherName` | String | default `''` — used in initial password (late addition) |
| `birthDate` | String | DDMMYY, default `''` — used in initial password (late addition) |
| `bio` | String | default `''` |
| `skills` | [String] | feeds AI search |
| `profilePic`, `bannerImage` | String | base64 data-URLs |
| `college` | String | default `'SINHGAD_ENGINEERING'` |
| `lastAnnouncementsReadAt` | Date | null until first read; used for unread-count diffing |
| `isRestricted` | Boolean | default `false` (late addition — blocks login) |
| `restrictionReason` | String | default `''` (late addition) |

### Post (`models/Post.js`)

The "spine" of the app. One model serves four post types.

| Field | Type | Notes |
|---|---|---|
| `type` | String enum required | `'Recruitment' \| 'Event' \| 'General' \| 'Collab'` |
| `title` | String required | |
| `body` | String | default `''` |
| `author` | ObjectId → User | required |
| `club` | ObjectId → Club | only for Recruitment/Event/General |
| `community` | ObjectId → Community | only for Collab (when posted from a community) |
| `tag` | String enum | `'Technical' \| 'Cultural' \| 'Sports' \| 'Recruitment' \| 'Creative' \| 'Other'` |
| `skills` | [String] | free-form tags for Collab posts |
| `isActive` | Boolean | default `true`; for Recruitment, only one active per club |
| `eventDate` | Date | Event only |
| `venue` | String | Event |
| `image` | String | base64 data-URL |
| `registrationDeadline` | Date | late addition — apply/register cutoff |
| `isPaid` | Boolean | default `false` |
| `amount` | Number | default `0` |
| `paymentQrImage` | String | base64 data-URL of the club's UPI QR |
| `paymentConfig` | nested | `{ enabled, recipient: { upiId, name }, amount }` — reserved for future payment-gateway swap |
| `college` | String | default `'SINHGAD_ENGINEERING'` |

### Club (`models/Club.js`)

| Field | Type | Notes |
|---|---|---|
| `name` | String required, unique | |
| `description` | String | |
| `tags` | [String enum] | matches Post tag enum |
| `president` | ObjectId → User | |
| `members` | [ObjectId → User] | seed data may include the president; routes de-dupe |
| `logoUrl`, `logoEmoji`, `profilePhoto`, `bannerImage` | String | |
| `channels` | [String] | president-created custom chat channel slugs |
| `college` | String | |

### Community (`models/Community.js`)

| Field | Type | Notes |
|---|---|---|
| `name` | String required | |
| `description` | String | |
| `icon`, `profilePhoto`, `bannerImage` | String | |
| `manager` | ObjectId → User | one community per manager (enforced at create) |
| `members` | [ObjectId → User] | |
| `joinRequests` | [{ user, createdAt }] | for private communities |
| `tags` | [String] | free-form |
| `isPrivate` | Boolean | default `false` |
| `reason` | String | student's justification at request time |
| `status` | String enum | `'pending' \| 'approved' \| 'rejected'`, default `'pending'` |
| `college` | String | |

### Application (`models/Application.js`)

Recruitment apply/accept/reject. Compound unique index `{ post, applicant }` prevents double-apply.

| Field | Type | Notes |
|---|---|---|
| `post` | ObjectId → Post required | |
| `applicant` | ObjectId → User required | |
| `club` | ObjectId → Club required | |
| `status` | String enum | `'pending' \| 'accepted' \| 'rejected'`, default `'pending'` |
| `college` | String | |

### Registration (`models/Registration.js`)

Event tickets. Compound unique `{ post, registrant }`.

| Field | Type | Notes |
|---|---|---|
| `post` | ObjectId → Post required | |
| `registrant` | ObjectId → User required | |
| `club` | ObjectId → Club | |
| `ticketId` | String unique sparse | UUID v4. Issued at registration for free events, only on payment-approval for paid events |
| `attended` | Boolean | default `false` (flipped by QR scan) |
| `attendedAt` | Date | |
| `paymentStatus` | String enum | `'free' \| 'pending_verification' \| 'approved'` |
| `paymentScreenshot` | String | base64 data-URL of student's UPI receipt |
| `college` | String | |

### Connection (`models/Connection.js`)

DM gating + collab acceptance. Compound unique `{ requester, recipient }`.

| Field | Type | Notes |
|---|---|---|
| `requester`, `recipient` | ObjectId → User required | |
| `type` | String enum | `'collab' \| 'general'`, default `'general'` |
| `status` | String enum | `'pending' \| 'accepted' \| 'rejected'`, default `'pending'` |
| `sourcePost` | ObjectId → Post | set only for collab connections |
| `college` | String | |

### Message (`models/Message.js`)

Personal DMs. `roomId` is `[a,b].sort().join('_')` so the same room ID is computed regardless of who initiates.

| Field | Type | Notes |
|---|---|---|
| `roomId` | String required, indexed | |
| `sender`, `receiver` | ObjectId → User required | |
| `body` | String required | |
| `readAt` | Date | (currently never set by code) |
| `college` | String | |

Index: `{ roomId: 1, createdAt: -1 }`.

### Notification (`models/Notification.js`)

| Field | Type | Notes |
|---|---|---|
| `recipient` | ObjectId → User required, indexed | |
| `message` | String required | |
| `type` | String | default `'generic'`; semantic tag like `'recruitment_accepted'`, `'payment_approved'` |
| `read` | Boolean | default `false` |

Index: `{ recipient: 1, createdAt: -1 }`.

### Announcement (`models/Announcement.js`)

Admin-broadcast, scoped by department and year.

| Field | Type | Notes |
|---|---|---|
| `title`, `body` | String required | |
| `author` | ObjectId → User required | (admin) |
| `targetDepartments` | [enum incl. `'ALL'`] | |
| `targetYears` | [enum incl. `'ALL'`] | |
| `priority` | String enum | `'normal' \| 'high'` |

### ClubAnnouncement (`models/ClubAnnouncement.js`)

President-only posts to the club's `announcements` channel.

Fields: `club`, `author`, `body`. No title.

### ClubMessage (`models/ClubMessage.js`)

Per-channel chat (general + custom). Fields: `club`, `channel`, `author`, `body`.

### CommunityAnnouncement (`models/CommunityAnnouncement.js`)

Manager-only posts. Fields: `community` (indexed), `author`, `title`, `body`, `college`.

### CommunityMessage (`models/CommunityMessage.js`)

General-channel group chat (polled, not real-time). Fields: `community` (indexed), `sender`, `body`. Compound index `{ community, createdAt }`.

### Discussion (`models/Discussion.js`)

Reddit-style threads inside a community. Comments are an embedded subdocument array (`_id` enabled). Fields: `community`, `author`, `authorName` (fallback for seed-only authors), `title`, `body`, `upvotes`, `comments[]`. Each comment: `author`, `authorName`, `body`, `createdAt`.

### AdminProfile (`models/AdminProfile.js`)

Singleton (one doc with `scope: 'campus'`) for the admin's contact card. Auto-seeded on server start (`ensureAdminProfile()` in `server.js`).

Fields: `scope` (unique, default `'campus'`), `name`, `email`, `phone`, `designation`, `bio`, `college`.

### ClubInsight (`models/ClubInsight.js`)

Persisted output of one Gemini call per club. One doc per `clubId` (unique). Fields: `clubId`, `generatedAt`, `statsSnapshot` (Mixed — the full computed snapshot), `insightText` (JSON.stringify'd Gemini response).

### CommunityInsight (`models/CommunityInsight.js`)

Single global doc with `scope: 'campus'` (unique). Fields: `scope`, `generatedAt`, `insightText`. No per-community insights — this is the admin-level cross-campus analysis.

### Fields added late (post-Phase-1 schema drift)

Documented because they predate parts of the codebase that don't use them and post-date the original `PLAN.md`:

- `Post.registrationDeadline` (apply/register cutoff — `patchDeadlines.js` backfills old seed data)
- `Post.isPaid` / `amount` / `paymentQrImage` / `paymentConfig`
- `Registration.paymentStatus` / `paymentScreenshot`
- `User.motherName` / `birthDate` (initial-password derivation, bulk-import column requirements)
- `User.isRestricted` / `restrictionReason` (admin moderation action)
- `User.lastAnnouncementsReadAt` (unread-count diffing)
- `Club.channels` (custom channel slugs)
- `Community.joinRequests` / `isPrivate` / `reason` / `status`

---

## 3. API Endpoints

All routes mounted in `server/server.js`. `requireAuth` is JWT-bearer middleware. Admin-only routes additionally check `req.user.role === 'admin'`.

### `routes/auth.js` — `/api/auth`

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/login` | none | Verify credentials; 403 with `ACCESS_RESTRICTED` payload (incl. admin contact) if `isRestricted`; otherwise issue 7-day JWT and return shaped profile (incl. derived `role`: `admin`/`president`/`member`/`fresher`). |
| POST | `/change-password` | requireAuth | Update `passwordHash`, clear `mustChangePassword`, return a fresh token. |
| GET | `/me` | requireAuth | Refresh shaped profile (also recomputes club role). |
| PATCH | `/me` | requireAuth | Update own `profilePic` / `bannerImage` / `bio` only (whitelist). |

### `routes/posts.js` — `/api/posts`

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/` | requireAuth | Sorted feed: active-deadlined ASC, then no-deadline DESC, then closed DESC. Tags event posts with caller's registration status. Optional `?type=Collab` and `?author=me`. |
| POST | `/` | requireAuth | President-only. Creates Recruitment or Event. Enforces single-active-recruitment per club, requires `registrationDeadline`, requires `paymentQrImage`+`amount>0` for paid events. |
| POST | `/collab` | requireAuth | Any student creates a Collab post (`type='Collab'`). |
| DELETE | `/:id` | requireAuth | Collab: author-only (cascades Connection by sourcePost). Event/Recruitment: club president (cascades Registration / Application). General: rejected. Returns warning if approved paid regs were deleted. |
| PATCH | `/:id/close` | requireAuth | President flips `isActive=false` on recruitment. |

### `routes/applications.js` — mounted at `/api`

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/posts/:id/apply` | requireAuth | Student applies to a recruitment post. Blocks if already in any club, deadline passed, or post inactive. Notifies applicant. |
| GET | `/posts/:id/applicants` | requireAuth | Club members read applicants + dept/year aggregation. |
| PATCH | `/applications/:id/accept` | requireAuth | President accepts; adds applicant to `Club.members`; deletes that applicant's pending apps to other clubs; notifies applicant. |
| PATCH | `/applications/:id/reject` | requireAuth | President rejects; notifies applicant. |

### `routes/registrations.js` — `/api/registrations`

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/` | requireAuth | Register for an event. Free → ticket issued immediately. Paid → `pending_verification`, requires `paymentScreenshot`, no ticket yet. |
| PATCH | `/:id/approve-payment` | requireAuth | Any club member of owning club flips to `approved` and mints ticket; notifies registrant. |
| DELETE | `/:id/reject-payment` | requireAuth | Any club member deletes a `pending_verification` reg; notifies registrant. |
| GET | `/my` | requireAuth | Caller's tickets. |
| GET | `/event/:postId` | requireAuth | Club-member view of all registrants for one event. |
| POST | `/scan` | requireAuth | Mark attendance by `ticketId`. Idempotent — re-scan returns `alreadyAttended: true`. |

### `routes/clubs.js` — `/api/clubs`

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/my` | requireAuth | Sidebar payload for the caller's club: club summary, recruitment(s) with pending counts, upcoming events with approved-payment counts. |
| GET | `/my/members` | requireAuth | President + members list. |
| DELETE | `/my/members/:userId` | requireAuth | President removes a member; notifies them (optional reason). |
| GET | `/my/channels` | requireAuth | Static (`announcements`, `general`) + custom channels. |
| POST | `/my/channels` | requireAuth | President creates a slug-validated custom channel. |
| GET, POST | `/my/announcements` | requireAuth | List / president-only post. |
| GET, POST | `/my/channels/:channelId/messages` | requireAuth | Member-or-president read/write. |
| PATCH | `/my/profile` | requireAuth | President edits description/tags/logoEmoji/profilePhoto/bannerImage. |
| GET | `/my/insights` | requireAuth | Live computed snapshot + saved Gemini insight if any. |
| POST | `/my/insights/generate` | requireAuth | President regenerates insight via Gemini; saves to `ClubInsight`. |
| GET | `/:id` | requireAuth | Public club profile (active recruitment, upcoming events, recent General posts). |

### `routes/communities.js` — `/api/communities`

`router.param('id')` rejects non-ObjectIds with 404 instead of letting CastError 500.

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/` | requireAuth | Approved communities for the suggestions page. |
| GET | `/mine` | requireAuth | Caller's managed / pending / member-of communities. |
| POST | `/` | requireAuth | Create pending request; one-per-user enforcement. |
| GET | `/:id` | requireAuth | Public community profile with 3 recent activity items. |
| PATCH | `/:id` | requireAuth | Manager-only edit. |
| POST | `/:id/join` | requireAuth | Instant join (public only). |
| POST | `/:id/request-join` | requireAuth | Pending join request (private); notifies manager. |
| POST | `/:id/accept-join/:userId` | requireAuth | Manager accepts; notifies user. |
| POST | `/:id/reject-join/:userId` | requireAuth | Manager rejects; notifies user. |
| GET | `/:id/members` | requireAuth | Manager + members + (manager-only) pending requests. |
| DELETE | `/:id/members/:userId` | requireAuth | Manager removes member; notifies removed user. |
| POST | `/:id/promote/:userId` | requireAuth | Manager swap. Returns `ALREADY_COMMUNITY_MANAGER` if target manages elsewhere. |
| GET, POST | `/:id/announcements` | requireAuth | Member read / manager-only post. |
| GET, POST | `/:id/messages` | requireAuth | Member read/write general channel. |
| GET, POST | `/:id/discussions` | requireAuth | List threads / member creates thread. |
| GET | `/:id/discussions/:discussionId` | requireAuth | Thread + comments. |
| POST | `/:id/discussions/:discussionId/comments` | requireAuth | Member adds comment. |
| POST | `/:id/discussions/:discussionId/upvote` | requireAuth | Increment counter (no de-dupe — toggle UI is client-only). |
| GET, POST | `/:id/collabs` | requireAuth | List community collab posts / member creates one (writes to `Post` with `type='Collab'`). |

### `routes/connections.js` — `/api/connections`

| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/` | requireAuth | Send `general` (with `recipientId`) or `collab` (with `sourcePostId`) connection. |
| GET | `/status/:userId` | requireAuth | `connected \| sent \| received \| self \| none`. |
| PATCH | `/:id/accept` | requireAuth | Recipient accepts. |

### `routes/messages.js` — `/api/messages`

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/conversations` | requireAuth | Aggregated chat list with last preview (Mongo `$group` over `roomId`). |
| GET | `/with/:userId` | requireAuth | Gate-check for opening a thread; returns 403 if not an accepted connection. |

### `routes/admin.js` — `/api/admin` (admin-only except where noted)

Users: GET `/users` (active students only — excludes `year:'Alumni'`, includes phone), GET `/alumni` (graduated students), POST `/import-students` (base64 .xlsx/.csv via `xlsx`; validates columns, dept/year enums, DDMMYY birthDate, 10-digit phone; `mode:'provided'` requires + validates an `@sinhgad.edu` email column unique vs DB/file, `mode:'generated'` builds a unique random `firstname.<code><joinYY>` email; initial password = `motherName@birthDate`), POST `/advance-year` (academic-year rollover FE→SE→TE→BE→Alumni + roll prefix fe→se→te→be→al; only year+rollNumber change).

Email/identity helpers live in `server/utils/studentIdentity.js` (`randomCode`, `uniqueEmail`, `deterministicEmail`, `fakePhone`, `parseJoinYear`) — the single source for the `firstname.<5-letter-code><joinYY>@sinhgad.edu` scheme, shared by the import route, both seed scripts, and the migration.

Clubs: GET `/clubs`, POST `/clubs`, PATCH `/clubs/:id`, DELETE `/clubs/:id`. President eligibility is filtered **client-side** in `ManageClubs.jsx` (the API does not enforce it): create-club lists only students not already in any club; edit-club lists only that club's own members; both flows additionally exclude alumni (`year === 'Alumni'`). A current president who has rolled over to alumni is dropped from the dropdown but still shown in the picker via a `fallbackSelected` resolved from the full roster.

Communities: GET `/communities` (pending), GET `/communities/approved`, PATCH `/:id/approve`, PATCH `/:id/reject`, DELETE `/:id`.

Announcements: GET `/announcements`, POST `/announcements`.

Dashboard: GET `/dashboard/stats` (campus-wide counts + revenue + avg attendance), GET `/dashboard/clubs` (per-club rows for the dashboard table), GET `/clubs/:id/insights` (saved Gemini insight + club info), GET `/dashboard/community-insights`, POST `/dashboard/community-insights/generate`.

Admin profile: GET `/profile` (open to any logged-in user — used by student-facing Announcements and the restriction modal), PATCH `/profile` (admin-only).

Student admin actions: POST `/students/:id/reset-password`, PATCH `/students/:id/restrict`, PATCH `/students/:id/unrestrict`, GET `/students/:id/check-deletable`, DELETE `/students/:id` (cascades Club.members, Community.members, Connection, Application, Registration).

### `routes/ai.js` — `/api/ai`

POST `/search` — proxies query to `searchEntities(query)` in `services/gemini.js`.

### `routes/announcements.js` — `/api/announcements`

GET `/me` — student receives announcements where `targetDepartments ∈ {'ALL', user.department}` and `targetYears ∈ {'ALL', user.year}`.

### `routes/notifications.js` — `/api/notifications`

GET `/me`, GET `/unread-counts` (returns `{ notifications, announcements }` — announcements diffed against `User.lastAnnouncementsReadAt`), PATCH `/mark-read`, PATCH `/announcements-read`.

### `routes/activity.js` — `/api/activity`

GET `/me` — aggregated dashboard for student: tickets (excludes pending paid), applications, collab connections (sent + received), general connections (sent + received).

### `routes/health.js` — `/api/health`

GET `/` — `{ status: 'ok', dbConnected: <bool> }`. Used by Render's health probe.

### Misc

`GET /api/users/online` (requireAuth, in `server.js`) — returns array of currently-connected user IDs from Socket.io's in-memory `onlineMap`.

---

## 4. Authentication Flow

No React Context provider — confirmed by `grep`ing `createContext|AuthContext|useAuth` (zero matches). Auth state is held in `sessionStorage`.

### Password hashing
`bcryptjs` with cost factor 10. Both `seed.js` and `routes/admin.js` (bulk import) hash on insert.

### Initial password formula
`<motherName.toLowerCase()>@<birthDate>` where `birthDate` is 6-digit DDMMYY. Set during seed/import. `mustChangePassword: true` by default.

### Login (`POST /api/auth/login`)
1. Look up by lowercased email.
2. `bcrypt.compare` the supplied password.
3. **Restriction gate** — if `role === 'student'` and `isRestricted`, return 403 with `{ error: 'ACCESS_RESTRICTED', reason, admin: { name, email, phone } }`. The login modal renders a "Contact Campus Admin" card from this payload instead of an inline error.
4. Otherwise issue `jwt.sign({ _id, role }, JWT_SECRET, { expiresIn: '7d' })` and return the user's shaped profile.

### First-login change-password flow
- `routes/auth.js` returns the user profile with `mustChangePassword: true` after login.
- `LandingPage.jsx` reads that flag and switches the modal to a `change-password` step.
- Client `POST /api/auth/change-password` with the just-issued token; server updates `passwordHash`, sets `mustChangePassword: false`, returns a fresh token + user.
- Admin "reset password" action just re-flips `mustChangePassword: true`; the same modal flow fires on the user's next login.

### Token storage
`client/src/lib/session.js` uses `sessionStorage` (not `localStorage`) — this was a deliberate fix so simultaneous logins in different tabs of the same browser don't overwrite each other. Trade-off: closing the tab clears the session.

Keys: `token`, `user`, `userRole`.

### Request authentication
- Axios instance `client/src/lib/api.js` attaches `Authorization: Bearer <token>` from `getToken()` in a request interceptor.
- Server middleware `server/middleware/auth.js` verifies the token and sets `req.user = { _id, role }` from the JWT payload.

### Role evaluation
JWT carries only `{ _id, role }`. Higher-level "frontend roles" (`fresher`, `member`, `president`, `community_manager`) are recomputed at request time:
- `routes/auth.js` `buildProfile()` calls `findUserClub(userId)` (presidency wins over membership) to set `role` and `clubName/clubLogo` on every `/me` and `/login` response.
- Per-route authorization uses live DB checks (e.g. `Club.findOne({ president: req.user._id })`) rather than trusting the JWT.

### Route guards (frontend)
`App.jsx` `RequireAuth` wraps every authenticated route. `adminOnly` variant additionally reads `getUser().role !== 'admin'` and redirects to `/home`.

---

## 5. Real-Time Architecture

Honest split — three different transport mechanisms:

### Socket.io (real-time): personal DMs only
`server/socket.js`. Handshake authenticated with the same JWT (passed in `socket.handshake.auth.token`). The server:
- Maintains `onlineMap: Map<socketId, userId>` for presence (user is online if **any** of their sockets is connected).
- `join_room`: verifies an accepted Connection exists via `utils/chat.hasAcceptedConnection`, joins the deterministic room (`[a,b].sort().join('_')`), emits last 50 messages as `history`.
- `send_message`: re-verifies connection, persists to `Message`, broadcasts `new_message` to the room.
- `leave_room`: leaves a room.

Two sockets per browser tab in practice: one driven by `lib/presence.usePresenceSocket()` (mounted by every layout — DashboardLayout, ClubLayout, CommunityLayout) for presence-only, one driven by `components/ChatTab.jsx` for chat.

### Polling (every 3s): community general channel
`pages/community/GeneralChannel.jsx` calls `setInterval(fetchMessages, 3000)` against `GET /api/communities/:id/messages`. This is the only fixed-interval poll in the app.

### Pure REST (no real-time): everything else
- Community announcements
- Discussions (threads, comments, upvotes)
- Club chat (announcements + general + custom channels)
- Notifications (fetched on demand; no polling, no socket push)
- Feeds, profiles, dashboards

The `Notification` collection is read on demand by `GET /api/notifications/me` and `/unread-counts`. Notifications are created server-side via `lib/notify.js`, but never pushed.

### Presence endpoint
`GET /api/users/online` returns `Array<userId>` from the in-memory `onlineMap`. Used to show the green dot on user avatars.

---

## 6. AI Integration

Single Gemini wrapper at `server/services/gemini.js` using `@google/generative-ai`.

### Model
`gemini-2.5-flash` (lazy-instantiated per call via `getModel()`; throws if `GEMINI_API_KEY` is not set).

### Response parsing
Shared `extractJSON(text)` helper: strips ```json fences, parses; falls back to extracting the first `{...}` block; returns `null` if both fail. All three callers handle parse failure gracefully (returning `EMPTY` or `{ error: 'parse_failed' }`).

### Use sites
Three endpoints call Gemini. None are streamed; all are one-shot generate-content calls.

**1. AI Search — `POST /api/ai/search`** (`searchEntities(query)`)
- Loads all clubs, approved communities, and students (with bio + skills) from Mongo.
- Prompt (verbatim): instructs Gemini to act as a campus search engine for Sinhgad Engineering, gives the JSON context, asks for a strict JSON shape `{clubs:[{id,name,reason}], communities:[...], students:[...]}`. Rules emphasize: only use IDs from data, each reason one sentence, match students by bio AND skills, return 2–3 students for collab-ish queries, at most 5 per category. Response is parsed and returned directly to the client. Not persisted.

**2. Live Ops Insights — `GET /api/clubs/my/insights` + `POST /api/clubs/my/insights/generate`** (`generateClubInsights(snapshot)`)
- President-only generation. `computeClubStatsSnapshot(clubId)` (in `routes/clubs.js`) computes a deep stats object: member counts by dept/year; per-recruitment-post applicant aggregates; per-event registration/attendance/revenue; loyalty (students attending ≥2 events).
- Prompt asks for JSON with keys: `healthSummary`, `departmentInsights`, `yearInsights`, `eventInsights`, `paidVsFree`, `recruitmentFunnel`, `loyaltyInsight`, `recommendations[]`. Instructs to omit any key where data is too sparse and to reference real event/dept names in recommendations.
- **Save-and-refresh pattern**: on generate, the result is stored as `JSON.stringify(insight)` in `ClubInsight` (one doc per club, upserted via `findOneAndUpdate`). The GET endpoint always returns the live snapshot + the most-recent saved insight (if any) — so a viewer never triggers Gemini, only the president can.

**3. Admin Community Insights — `GET /api/admin/dashboard/community-insights` + `POST .../generate`** (`generateCommunityInsights({ communities, collabsByCommunity })`)
- Admin-only generation. Loads approved communities (shaped: name, description, tags, memberCount) and all Collab posts grouped by community name.
- Prompt asks for JSON: `interestMap`, `topicClusters[{theme, communities[], totalMembers}]`, `adminSuggestions[]`, `underservedInterests`.
- Same save-and-refresh pattern, but on a singleton document (`CommunityInsight` with `scope: 'campus'`).

### Free-tier considerations
`gemini-2.5-flash` is on the free tier. Every save-and-refresh endpoint deliberately separates **read** (no Gemini call) from **generate** (one Gemini call). This keeps the per-day quota low and means the dashboard renders instantly from the saved JSON instead of waiting on the model. No retry logic, no rate limiter — failures degrade to `{ error: 'parse_failed' }` and the UI shows "no insight available yet."

---

## 7. Frontend Architecture

### Entry point and routing
`client/src/main.jsx` imports `./lib/config` first so missing env vars throw before any component renders. `App.jsx` wires React Router v7 with a single `RequireAuth` component that checks `getToken()`/`getUser()` and supports an `adminOnly` mode.

### State pattern
- **No React Context for auth.** User data is read with `getUser()` from `sessionStorage` everywhere it's needed (sidebars, layouts, profile pages).
- **No global state library.** Each page does its own fetching with `axios` + `useEffect`. Re-fetches are explicit via callback props (e.g. `refreshClub` passed through `Outlet context` in `ClubLayout`).
- **Children read parent state via `useOutletContext()`** — e.g. `CommunityLayout` exposes `{ community, members, currentUserId, ... }` to its children (`GeneralChannel`, `DiscussionBoard`, etc.).

### Axios configuration
Two patterns coexist in the codebase:
- The configured instance `client/src/lib/api.js` (axios with a request interceptor that pulls the token from `session.js`).
- Inline `axios.get/post(..., { headers: { Authorization: ... } })` calls using `getToken()` directly — most page components do this.

Both work because the interceptor only adds the header if the call goes through the `api` instance; inline calls add it manually. There is no global response interceptor for 401 handling — expired tokens just surface as errors.

### Layout components
- `layout/DashboardLayout.jsx` — student feed/profile/announcements/etc. Mounts `usePresenceSocket()`, refreshes the user profile from `/api/auth/me` on mount.
- `layout/ClubLayout.jsx` — club routes. Fetches `/api/clubs/my`, exposes `{ clubId, isPresident, currentUserId, refreshClub }` via Outlet context.
- `layout/CommunityLayout.jsx` — community routes. Fetches `/communities/:id` + `/members`, detects mid-session removal (was a member → redirects to non-member preview).
- `layout/AdminLayout.jsx` — admin routes. Just sidebar + content (no shared fetch).

### Route map (verbatim from `App.jsx`)
- `/` → `LandingPage` (login modal lives here)
- Authenticated: `/home`, `/profile`, `/announcements`, `/search`, `/settings`, `/notifications`, `/clubs/:clubId`, `/students/:studentId`, `/communities/:communityId` (non-member preview).
- Club: `/club/{chat, chat/:channelId, profile, stats/:eventId, recruitment/:postId, insights}` (default → `chat`).
- Community: `/community/:id/{about, chat/announcements, chat/general, forum/discussions, forum/discussions/:postId, collabs}` (default → `about`).
- Admin: `/admin/{dashboard, clubs, communities, announcements, users, settings}` (default → `dashboard`).

`ErrorBoundary` wraps each non-trivial layout (Club, Community, Admin).

### Visual style
Tailwind v4 (CSS-first config), dark theme, indigo/purple accents, `lucide-react` icons, occasional `framer-motion` animations on the landing page. The Tailwind v4 migration moved theme tokens into `@theme` blocks (no `tailwind.config.js`).

### `mockData.js`
`client/src/data/mockData.js` still exists but is no longer imported by routed pages (the migration to real APIs is complete). It survives as a reference for component prop shapes during development.

---

## 8. Deployment

### Topology
- **Frontend**: Vercel — `https://campus-net-9r6r7.vercel.app`. Auto-deploys on push to `main`. `vercel.json` (at `client/` and root) rewrites all routes to `/index.html` for SPA routing. The Vite build outputs to `dist`.
- **Backend**: Render (web service, free tier) — `https://campusnet-axvh.onrender.com`. Auto-deploys on push to `main`. Free tier sleeps after ~15 min idle, so first cold-start request can take 30–60s.
- **Database**: MongoDB Atlas, database name `campusnet` (must appear before `?` in the connection string).
- **Health probe**: `GET /api/health` returns `{ status, dbConnected }`.

### Backend env vars (Render)
| Var | What it does | What breaks without it |
|---|---|---|
| `MONGODB_URI` | Atlas connection string | `connectDB()` exits process |
| `JWT_SECRET` | Token signing | All auth fails |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist (incl. localhost + Vercel URL); `*.vercel.app` is also allowed via a regex | `server.js` exits with FATAL at startup |
| `GEMINI_API_KEY` | Gemini calls | AI features throw, parsed as `{ error: ... }` |
| `NODE_ENV` | Conventional | (not behaviorally gated) |
| `PORT` | Listen port | Defaulted to `5000`; Render auto-injects |

DNS hardening in `server.js` and seed scripts: `dns.setDefaultResultOrder('ipv4first')` + `dns.setServers(['8.8.8.8','1.1.1.1','8.8.4.4'])` to work around Node ≥17 DNS-order issues and ISPs that block SRV record queries (needed for `mongodb+srv://`).

### Frontend env vars (Vercel)
| Var | Default | Notes |
|---|---|---|
| `VITE_API_URL` | — (required, throws at startup if missing) | Render backend URL, no trailing slash |
| `VITE_SOCKET_URL` | falls back to `VITE_API_URL` | Set only if socket host differs |

### CORS policy
`server.js` reads `ALLOWED_ORIGINS` once at startup. The `cors()` callback:
- Allows requests with no `Origin` (server-to-server, curl).
- Allows any origin in `ALLOWED_ORIGINS`.
- Allows any origin ending in `.vercel.app` (handles preview URLs).
- Rejects everything else.

The same allowlist is applied to the Socket.io server in `initSocket()`.

### Asset uploads
Images (banner, profilePic, payment QR, payment screenshot) are stored as base64 data URLs in MongoDB documents. The `express.json({ limit: '10mb' })` setting is what makes this work. No object storage (S3 / Cloudinary).

---

## 9. Seed and Patch Scripts

### `server/seed.js` (`npm run seed`)
Destructive baseline. Drops 12 collections then inserts:
- 1 admin (`admin@sinhgad.edu`, password `CampusNet@123`, `mustChangePassword: false`).
- 20 students across all 4 years and 4 departments, each with bio + skills, `mustChangePassword: true`. Initial password = `motherName@birthDate` (lowercased, DDMMYY).
- 5 clubs (Robotics, GDSC, Music, AI/ML, Sports) with presidents and member lists. `rahul` is intentionally a GDSC member AND Web Dev Forum manager — the canonical multi-state proof from `CLAUDE.md`.
- 5 approved communities (Web Dev Forum, AI Hub, Startup Circle, Designers Guild, Photography Club) with managers and members.
- 13 posts: 3 Recruitment (1 closed), 2 Event, 3 General, 5 Collab.
- 7 applications spread across pending/accepted/rejected.
- 10 registrations (5 for a past hackathon with mixed attendance, 5 for a future workshop).
- 11 discussion threads with seeded comments across all 5 communities.

### `server/seedExtra.js`
**Additive** (idempotent — skips already-inserted students, events, and recruitment posts). Adds:
- 8 extra students (so total = 28).
- 15 events (3 per club) — mix of past/future, paid/free, with realistic attendance rates and paid-payment splits (approved + pending). Past events fill in attendance based on `attendRate`.
- 2 recruitment posts per club: 1 active (with `registrationDeadline` 30 days out) and 1 closed (from 90 days ago) with 8 historical applications cycling through statuses for Gemini comparison data.

Uses `Registration.collection.insertMany` (raw driver) so `ticketId` is *truly omitted* on pending-verification rows — Mongoose's `insertMany` coerces missing String fields to `null`, which would collide on the sparse unique index.

### `server/patchDeadlines.js`
One-off backfill. Finds `Event`/`Recruitment` posts missing `registrationDeadline` and sets it to `eventDate - 3 days` (past) or `eventDate - 2 days` (future). Skips posts without `eventDate`.

### `server/seedDiscussions.js`
Additional discussion threads seeded as part of Phase 3.2 community work (alongside the discussions inserted by `seed.js`).

### `server/scripts/fixAnanyaClubMembership.js`
One-off fix-up referenced by file name in `server/scripts/`.

### `server/scripts/migrateEmailsPhones.js`
One-off, **safe-by-design** migration that switches existing students to the joining-year email scheme and assigns a phone. Dry-run by default (prints the full before→after table, writes nothing); `--commit` applies. Touches **only** `email` and `phone` (`$set`) on `role:student`. Codes are deterministic (seeded from roll number) so the dry-run preview is exactly what `--commit` writes, and so the seed files match the migrated DB. Run by the operator, not automated.

### Final dataset shape after `seed.js` + `seedExtra.js`
1 admin · 28 students · 5 clubs · 5 communities · ~13 base posts + 15 events + 10 recruitment posts · ~88 registrations across paid/free/pending/approved/attended · ~7 base applications + ~80 historical applications · 11 discussion threads.

---

## 10. Known Constraints

Honest list — these are intentional or acknowledged limits to be defended in Report 2.

- **Render free-tier cold start** — first request after ~15 min idle takes 30–60s while Render wakes the dyno. Not a bug; visible to users as a delayed login.
- **Community general channel uses 3-second polling, not Socket.io** — group-chat real-time was deferred to save time. The infrastructure (Socket.io + auth) is already deployed for DMs and could be extended.
- **Discussion upvotes are not deduplicated server-side** — every `POST .../upvote` increments the counter. Toggle semantics are handled client-side. Trivially exploitable; tracked as a known limit.
- **No payment gateway integration** — `Post.paymentConfig` and `Post.paymentQrImage` are reserved; the actual flow is QR-image + screenshot upload + manual club approval. The schema is shaped so a Razorpay/Stripe integration would slot in without breaking changes.
- **No CSV/XLSX upload UI for student onboarding** — the backend `POST /api/admin/import-students` accepts a base64 .xlsx and validates fully (column normalization, dept/year enums, DDMMYY birthDate, duplicate-roll-number checks across both file and DB), but the admin UI for invoking it is not built. Data is loaded via the seed scripts instead.
- **No native mobile app** — responsive web only. No PWA manifest, no offline mode.
- **No real content moderation engine** — admins can restrict students (`isRestricted`) and remove members, but there's no automated flagging, no profanity filter, no abuse-reporting flow.
- **No file storage** — all images are stored as base64 in MongoDB. Document size cap (16 MB) and the `express.json({ limit: '10mb' })` setting are the only guards.
- **No request validation framework** — input validation is hand-written per route. No Zod / Joi / express-validator.
- **No automated tests** — `npm test` is the default echo stub. Verification is manual per the phase gates in `PLAN.md`.
- **JWT in `sessionStorage`** — survives reloads but not tab close, and a malicious script on the same origin can read it. The trade-off (no cross-tab session leakage) was a deliberate fix for a real bug seen during development. Production would use httpOnly cookies.
- **`Message.readAt`** exists on the schema but is never set by any code path.
- **`server.js` central error handler** returns raw `err.message` — fine for development; in production this could leak details and should be scrubbed.
- **No CSRF token** — relying on JWT-in-header (not cookie) to make CSRF non-applicable for state-changing requests.

---

*Every section above has been verified by reading the actual source file referenced. Where the code does X, this document says X.*
