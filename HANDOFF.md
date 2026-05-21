# HANDOFF.md — opening prompt for any new chat

Use this every time you start a new chat to continue the CampusNet build. Designed for the "one chat per phase block" strategy: each chat handles 5 phases, then closes. Saves tokens.

## When to start a new chat
- Beginning of Day 1 → use **Day 1 prompt** below
- Beginning of Day 2 → use **Day 2 prompt** below
- Beginning of Day 3 → use **Day 3 prompt** below
- Mid-day if you blow through context unexpectedly → use **Resume prompt** below

## Files to attach
Always attach all 6 files to a new chat: `CONTEXT.md`, `PLAN.md`, `project-rules.md`, `CLAUDE.md`, `NOTES.md`, `STATE.md`. Drag-drop them in.

---

## Day 1 prompt

```
Day 1 of CampusNet 3-day build. Files attached.

Read in this order: CONTEXT.md → STATE.md → PLAN.md sections 1, 2, 3 (Day 1 only) → project-rules.md.

You're the strategic planner. Antigravity's Claude Code does the building. Stay out of code; give me prompts to paste into Claude Code, plus push back on scope creep.

Your job today:
1. Confirm in 3 lines you understand: who I am, what's done so far, what's next.
2. Give me ONE Claude Code prompt that runs phases 1.2 through 1.5 autonomously, with each phase verifying its gate before proceeding.
3. Stay quiet during build. I'll come back when a phase fails OR end of day.

Token discipline: this chat closes at EOD. Don't pad responses.
```

## Day 2 prompt

```
Day 2 of CampusNet 3-day build. Files attached. STATE.md shows Day 1 status.

Read CONTEXT.md → STATE.md → PLAN.md Day 2 section → project-rules.md. The Day 1 chat is closed; you are picking up fresh.

Today: phases 2.1 through 2.5 — recruitment, event QR, live ops stats, AI search, activity hub. Per PLAN.md. The wow features ship today.

Your job:
1. 3-line confirmation.
2. ONE Claude Code prompt for phases 2.1 + 2.2 (these need higher effort — recommend Sonnet 4.6 high or Opus for these two specifically).
3. Then a SECOND prompt I'll paste later for 2.3 + 2.4 + 2.5 once 2.1 and 2.2 pass.
4. Stay quiet between phase blocks.

If you see scope creep in STATE.md decisions or my messages, push back hard.
```

## Day 3 prompt

```
Day 3 — final day. Files attached. STATE.md shows Days 1-2 status.

Read CONTEXT.md → STATE.md → PLAN.md Day 3 section + section 4 (demo script). Days 1-2 chats are closed.

Today: phases 3.1 (Socket.io chat), 3.2 (community channels), 3.3 (admin wiring), 3.4 (AI insights), 3.5 (buffer + smoke test).

Your job:
1. 3-line confirmation.
2. Audit STATE.md for anything cut/skipped that breaks the demo script. Flag now if so.
3. ONE Claude Code prompt for phase 3.1 (Socket.io is genuinely tricky — recommend Sonnet 4.6 high effort).
4. SECOND prompt for 3.2 + 3.3 + 3.4 (CRUD-grade work, medium effort fine).
5. THIRD prompt for 3.5 — full demo-script smoke test, end-to-end.
6. End of day: rehearse demo script with me in chat, identify weak points before review.
```

## Resume prompt (mid-day, if you ran out of context)

```
Resuming mid-build. Files attached. STATE.md shows EXACTLY where I am.

Read CONTEXT.md and STATE.md only — that's enough to pick up.

I'm currently mid-phase. Last gate I verified was [PHASE NUMBER]. Last issue was [ONE LINE].

Pick up from there. Give me the next Claude Code prompt or the next decision question. Don't restart, don't re-plan.
```

---

## Rules every chat must follow (built into prompts above)

1. Read STATE.md before anything else
2. Don't write code in chat — only Claude Code prompts
3. Don't relitigate locked decisions (CONTEXT.md says this; enforce it)
4. Push back on scope creep
5. Update STATE.md at end of every phase block (you tell Claude Code to do this in the prompt)
6. Token discipline — short responses, no padding

---

## What you do between chats

When closing a chat at EOD:
1. Make sure NOTES.md has today's entry (the chat will help you write it)
2. Make sure STATE.md is updated with all phase ✅/❌ marks and any new decisions/bugs/cuts
3. Note which day you finished. Tomorrow's chat reads STATE.md and knows.

When opening a new chat next morning:
1. Drag all 6 files in
2. Paste the right Day prompt
3. Wait for 3-line confirmation
4. Paste the Claude Code prompt it gives you into Antigravity
5. Step away. Come back at next gate or end of day.
