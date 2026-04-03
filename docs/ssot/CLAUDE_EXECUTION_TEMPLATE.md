# AKIOR CLAUDE EXECUTION TEMPLATE

> Canonical template for running a single execution step in Claude Code on the Mac Mini.  
> Path: ~/akior/docs/ssot/CLAUDE_EXECUTION_TEMPLATE.md  
> ChatGPT fills this template per step. The owner copies it and pastes into Claude Code.

---

## WHEN TO USE

Use this template every time ChatGPT produces a "NEXT ACTION: CLAUDE CODE" step. ChatGPT fills in the fields. The owner pastes it into Claude Code without modification. Claude Code executes and returns a structured report.

---

## PRE-PASTE CHECKLIST

Before pasting into Claude Code, confirm:
- [ ] Milestone, layer, and task are filled in (no blanks)
- [ ] Allowed scope is specific, not open-ended
- [ ] Forbidden scope lists at least one item
- [ ] Evidence required is defined
- [ ] The task is singular — one step, not multiple

---

## EXECUTION TEMPLATE

```text
AKIOR EXECUTION — SINGLE STEP

You are executing one bounded task for the AKIOR project.
Do exactly what is specified below. Nothing more.

CONTEXT:
- Runtime root: ~/akior/
- SSOT folder: ~/akior/docs/ssot/
- Current milestone: [FILL — e.g., v1 bootstrap / operational readiness]
- Active layer: [FILL — e.g., L2 — Bootstrap / runtime foundation]
- Last verified step: [FILL — e.g., Task 05 | Scheduled tasks config created]

TASK:
- Task ID: [FILL — e.g., Task 06]
- Title: [FILL — e.g., Verify cron job registration]
- Description: [FILL — 1-3 sentences max, specific]

ALLOWED SCOPE:
- [FILL — what Claude may do]
- [FILL — what files/dirs Claude may touch]

FORBIDDEN SCOPE:
- Do not modify files outside the allowed scope
- Do not install new packages unless explicitly listed above
- Do not refactor, reorganize, or "improve" code not related to this task
- Do not create new workstreams or open future-layer work
- Do not mark this task complete unless evidence confirms it
- [FILL — any task-specific restrictions]

EVIDENCE REQUIRED:
- [FILL — e.g., "output of crontab -l showing the registered job"]
- [FILL — e.g., "cat of the config file showing correct values"]

IF BLOCKED:
- Stop immediately
- State what is blocking and why
- Do not attempt workarounds unless the task description explicitly allows it
- Return the blocker in your report so ChatGPT can assess

REPORT FORMAT — YOU MUST RETURN THIS:
After execution, return exactly this structure:

TASK: [task id + title]
STATUS: [COMPLETE / PARTIAL / BLOCKED / FAIL]
WHAT WAS DONE: [factual summary — what commands ran, what changed]
FILES CHANGED: [list every file created, modified, or deleted]
EVIDENCE:
[paste terminal output, file contents, test results, or other proof]
BLOCKED BY: [if blocked — specific reason; otherwise "none"]
NOTES: [anything the reviewer needs to know; otherwise "none"]
```

---

## DO NOT DO (CLAUDE CODE RULES)

These rules apply to Claude Code during every AKIOR execution:

- Do not silently expand scope beyond the task description
- Do not "clean up" or refactor unrelated code
- Do not install packages not specified in the task
- Do not create files outside the allowed scope
- Do not delete or move existing files unless the task explicitly requires it
- Do not claim completion without producing evidence
- Do not skip the report format
- Do not propose follow-up work — just report what happened
- Do not modify SSOT governance files unless the task explicitly requires it

---

## EXAMPLE (FILLED)

```text
AKIOR EXECUTION — SINGLE STEP

You are executing one bounded task for the AKIOR project.
Do exactly what is specified below. Nothing more.

CONTEXT:
- Runtime root: ~/akior/
- SSOT folder: ~/akior/docs/ssot/
- Current milestone: v1 bootstrap / operational readiness
- Active layer: L3 — Connectors / scheduled tasks / channel readiness
- Last verified step: Task 08 | WhatsApp connector config created

TASK:
- Task ID: Task 09
- Title: Verify WhatsApp connector heartbeat
- Description: Run the heartbeat check script and confirm the connector responds within 5 seconds.

ALLOWED SCOPE:
- May run: node ~/akior/scripts/whatsapp-heartbeat.js
- May read: ~/akior/config/whatsapp.json
- May read: ~/akior/logs/

FORBIDDEN SCOPE:
- Do not modify the WhatsApp connector code
- Do not modify config files
- Do not install new packages
- Do not touch any other connector

EVIDENCE REQUIRED:
- Terminal output showing heartbeat response with timestamp
- Response time under 5 seconds

IF BLOCKED:
- Stop immediately
- Report the error output

REPORT FORMAT — YOU MUST RETURN THIS:
[as defined above]
```
