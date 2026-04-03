# AKIOR SESSION HANDOFF TEMPLATE

> Canonical templates for ending a ChatGPT control session and restoring the next one.  
> Path: ~/akior/docs/ssot/SESSION_HANDOFF_TEMPLATE.md  
> Used by ChatGPT (the CTO brain) to transfer state between short control sessions.

---

## WHEN TO HAND OFF

Hand off when any of these are true:
- You have completed 3–4 substantive working replies in this chat
- You detect drift, confusion, or degraded response quality
- The conversation thread is getting long or muddled
- The owner requests a handoff

**Always prefer early handoff over long-thread recovery.**

---

## HANDOFF BLOCK TEMPLATE

ChatGPT produces this block when ending a session. The owner copies it for the next chat.

```text
⚠️ HANDOFF — This session is complete.
Stop sending messages here. Open a new chat in this Project.
Paste the RESTORE BLOCK then paste this handoff below it.

---
AKIOR CTO HANDOFF
DATE: [YYYY-MM-DD]

1. MILESTONE: [name]
   DISTANCE: [NEAR / MODERATE / FAR / UNCERTAIN]
   ACTIVE LAYER: [L# — name]

2. LAST VERIFIED STEP:
   Task: [ID + title]
   Status: [COMPLETE / PARTIAL / FAIL / BLOCKED]
   Evidence: [what confirmed it — be specific]

3. LAYER STATUS:
   L1  | [DONE / IN PROGRESS / NOT STARTED / BLOCKED]
   L2  | [status]
   L3  | [status]
   L4  | [status]
   L5  | [status]
   L6  | [status]
   L7  | [status]
   L8  | [status]
   L9  | [status]
   L10 | [status]

4. OPEN BLOCKERS / RISKS:
   - [item or "none"]

5. NEXT STEP:
   Action: [CLAUDE CODE / MANUAL TEST / CONFIRM / STOP / UNBLOCK]
   Step: [one specific step]
   [If Claude Code: filled execution template or prompt below]

6. DO NOT DO:
   - [item]
   - [item]

7. RECENT LOG (last 5 entries):
   [paste last 5 lines from PROJECT_LOG.md]
   Full log: ~/akior/docs/ssot/PROJECT_LOG.md
```

---

## RESTORE BLOCK TEMPLATE

The owner pastes this at the top of a new ChatGPT chat, followed by the handoff block.

```text
AKIOR CTO — RESTORE

Resume CTO control from the handoff pasted below.
Before responding:
1) Re-anchor to SSOT files in Project Sources
2) Verify last step matches the handoff
3) Check for drift between handoff and current SSOT
4) Restore layer status
5) Give the single next correct step using the required response format

Do not restart work. Do not reopen closed steps.
Do not invent progress. Do not skip the response format.
If anything in the handoff is unclear or conflicts with SSOT, flag it immediately.

[HANDOFF PASTED BELOW]
```

---

## FRESH START BLOCK

Use this instead of RESTORE when there is no prior handoff (first session or full reset).

```text
AKIOR CTO — FRESH START

Re-anchor to SSOT files in Project Sources.
This is the first control session (or a full reset).

Target milestone: [fill in]
Active layer: [fill in or "determine from SSOT"]
Last verified step: [fill in or "none — first session"]
Project log: [fill in or "empty — see PROJECT_LOG.md"]

Inspect SSOT, confirm current state, and give me the single next correct step.
Use the required response format.
```

---

## HANDOFF VALIDATION CHECKLIST

Before using a handoff to restore a new chat, verify:

- [ ] **Last verified step is actually verified** — evidence is cited, not assumed
- [ ] **Next step is singular** — one action, not a list
- [ ] **Blockers are explicit** — listed clearly, or "none" stated
- [ ] **Recent log is included** — last 5 entries present
- [ ] **No future-vision work mixed in** — all items relate to the current milestone
- [ ] **Layer status is complete** — all 10 layers have a status
- [ ] **Date is current** — the handoff is from this session, not a stale copy

---

## COMMON FAILURE MODES

| Failure | Cause | Fix |
|---------|-------|-----|
| Restored chat immediately drifts | Handoff was vague or missing evidence | Re-verify last step before continuing |
| ChatGPT skips response format | Long thread degraded rule adherence | Hand off earlier next time |
| Next step is wrong after restore | Handoff next-step was not SSOT-aligned | Re-anchor to SSOT before accepting handoff's next step |
| Log entries pile up and bloat handoff | Full log pasted instead of last 5 | Only paste last 5; reference full log path |
| Owner pastes stale handoff | Reused an old handoff by mistake | Always use the handoff from the most recent session |
| Blocker not surfaced | Handoff marked "none" but step is actually stuck | Check evidence before proceeding — if missing, treat as BLOCKED |
