# Claude Desktop Scheduled Tasks — Ready to Paste

**Purpose:** Paste these into Claude Desktop → Cowork → Scheduled when available.

---

## 1. Morning Briefing — 7:00 AM daily

```
Run morning briefing: Read the 20 most recent Gmail inbox messages and today's Google Calendar events. Classify each email as URGENT / ACTION_NEEDED / ROUTINE / INFORMATIONAL. Write a structured daily briefing to ~/akior/evidence/terminal/daily-briefing-latest.md with today's meetings, urgent items, action items, and top 3 priorities. Append a summary line to ~/akior/ledgers/action.md. Do not send any replies.
```

## 2. Email Triage — Hourly (temporary)

```
Run email triage: Check Gmail for new unread messages since last triage. Classify each as URGENT / ACTION_NEEDED / ROUTINE / INFORMATIONAL. If any are from Wix (wixsiteautomations.com) flag as Live Pilates customer activity. Write results to ~/akior/evidence/terminal/email-triage-latest.md. Append a summary line to ~/akior/ledgers/action.md. Do not send any replies.
```

## 3. Evening Summary — 8:00 PM daily

```
Run evening summary: Review today's action ledger entries, decision log entries, and any customer pipeline changes. Produce a concise end-of-day summary covering: actions taken today, decisions made, customer pipeline status, outstanding items for tomorrow, and any issues requiring owner attention. Write to ~/akior/evidence/terminal/evening-summary-latest.md. Append a summary line to ~/akior/ledgers/action.md.
```

## 4. Live Pilates Inbox Sweep — Every 4 hours

```
Run Live Pilates inbox sweep: Check Wix Inbox via browser for any new customer replies from Michelle Liu, Shin Kai, Nora Gallardo, Danielle Luttje, or Karen Berg. If a reply is found, extract the message content and write to ~/akior/evidence/terminal/livepilates-inbox-sweep-latest.md. Flag urgency. Reference the appropriate reply playbook. Append result to ~/akior/ledgers/action.md. Do not send replies without owner authorization.
```

## 5. Ops Console + Canary Health — 6:00 AM daily

```
Run daily health check: Execute all canary scripts in ~/akior/config/canary/. Execute morning resume check. Verify tmux session alive, ops console responding, ollama responding, docker responding. Write results to ~/akior/evidence/terminal/daily-canary-summary.md. If any canary fails, flag in action ledger with FAIL classification.
```

---

*Paste each task text into Claude Desktop → Scheduled Tasks with the indicated schedule.*
