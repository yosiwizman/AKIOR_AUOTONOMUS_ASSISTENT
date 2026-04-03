# Live Pilates USA — Inbox Sweep Playbook

**Created:** 2026-04-01T22:05Z
**Version:** 1.0
**Canonical surface:** Wix Inbox — https://manage.wix.com/dashboard/a2a57663-b6b3-451f-b18f-e8fa79431222/inbox/
**Run frequency:** 3× daily (morning, midday, end of day)

---

## STEP 1: Access Wix Inbox

1. Open Wix Dashboard in Chrome (use Claude in Chrome MCP, tab already available)
2. Navigate to Inbox section
3. Confirm you are in the Live Pilates USA dashboard (check account name in top bar: "Livepilates")
4. Set conversation filter to: **All conversations**

---

## STEP 2: Check Order (Priority Sequence)

Check threads in this order every sweep:

| Priority | Contact | Email | Thread type |
|----------|---------|-------|-------------|
| 1 | Michelle Liu | hsuan8026@gmail.com | Awaiting reply — spec package sent |
| 2 | Shin Kai | adsl23399@gmail.com | Awaiting reply — color/spec sent |
| 3 | Nora Gallardo | (in thread) | Awaiting reply — initial outreach sent |
| 4 | Danielle Luttje | (in thread) | Awaiting reply — initial outreach sent |
| 5 | Karen Berg / klrb | karenberg12@gmail.com | Awaiting reply — initial outreach sent |
| 6 | Any new unread conversations | — | New inquiries |
| 7 | Griselda López Olivo | (in thread) | Not yet sent — do not initiate without owner approval |

---

## STEP 3: For Each Thread — Read and Classify

Open the thread. Read any new messages since last sweep. Classify as one of:

| Code | Classification | Action |
|------|---------------|--------|
| NR | No new reply | Log as no reply. Continue to next thread. |
| PR-PLAYBOOK | Positive reply — matches playbook scenario | Draft response using playbook. QA. Send or flag. |
| PR-OFFBOOK | Positive reply — off-playbook | Draft response. Flag for owner before sending. |
| ASK | Question — covered by playbook | Draft response using playbook. QA. Send. |
| ASK-OFF | Question — not covered by playbook | Flag for owner with draft suggestion. |
| NEG | Negative / not interested | Log. Do not send further unless owner instructs. |
| NEW | New inquiry (not in active list) | Capture contact details. Flag for owner. |
| LOGO | Logo file received (Shin Kai) | Acknowledge receipt. Use Shin Kai playbook scenario 5. |
| ADDR | Delivery address received | Acknowledge. Flag to owner for freight quote. |

---

## STEP 4: Pre-Send QA Checklist

**Run this before EVERY send. Zero exceptions.**

- [ ] Phone number shown: **+1-786-518-1777 only** (no 954 number, no other number)
- [ ] Shipping language: **Not included** / quoted separately (never say "free" or "included")
- [ ] Minimum order: **$25,000 USD** if pricing discussed
- [ ] Delivery: **Not included** / arranged through third-party (never "we deliver" / "delivery included")
- [ ] Signature: **Yossi W** / Live Pilates USA
- [ ] No invented specs (no dimensions/weights not in confirmed data)
- [ ] Subject line appropriate for thread
- [ ] Send channel: **Wix Inbox** (never Gmail reply surface)

If ANY item fails: DO NOT SEND. Fix first or escalate to owner.

---

## STEP 5: Policy Checklist

Before sending any message, confirm it does not:

- [ ] Promise a price below $9,995 USD per unit
- [ ] Agree to discount without owner approval
- [ ] Confirm shipping cost without a real quote
- [ ] Commit to a delivery date without owner confirmation
- [ ] State that delivery is included
- [ ] Mention any phone number other than +1-786-518-1777
- [ ] Reference products or specs not confirmed (V12 only — no other products)
- [ ] Make any warranty claim beyond 15 years
- [ ] Represent legal, compliance, or payment terms without owner review

---

## STEP 6: Allowed Auto-Reply Cases

AKIOR may send these independently (no owner approval required):

| Scenario | Condition |
|----------|-----------|
| Light 48h follow-up (playbook scenario 7) | 48h elapsed, no reply confirmed, exact playbook text used |
| Request for delivery address | Standard language only, no pricing commitment |
| Scheduling a call time | Offer 2-3 time slots; no commitments made on behalf of owner |
| Confirming logo file received (Shin Kai) | Exact playbook scenario 5 text |
| Asking for clarification on color preference | Standard language only |
| Reply to basic spec question (fully in playbook) | Exact playbook text; all QA items pass |

---

## STEP 7: Blocked / Escalate Cases

AKIOR must NOT send and must flag for owner:

| Scenario | Reason |
|----------|--------|
| Any price negotiation | Owner decision required |
| Shipping cost quote | Real freight quote needed — AKIOR cannot invent |
| Payment terms / deposit / installment | Financial commitment |
| Custom color pricing confirmation | Owner sets pricing |
| Logo customization pricing | Owner sets pricing |
| Legal complaint or dissatisfied customer | Owner handles directly |
| Any off-playbook request | Avoid unauthorized commitments |
| Karen Berg phone call | Owner executes — AKIOR does not place calls |
| Griselda López Olivo outreach | Spanish draft needed; owner approves first |
| Any new contact not in active list | Owner decides whether to engage |
| International compliance questions | Legal review required |

---

## STEP 8: Required Output After Each Sweep

After completing every sweep, write or append to the daily summary file:
`~/akior/evidence/terminal/livepilates-daily-summary-[YYYY-MM-DD].md`

Include:

```
## Sweep: [MORNING / MIDDAY / EOD] — [YYYY-MM-DD HH:MM]

### Michelle Liu
Status: [NR / PR-PLAYBOOK / PR-OFFBOOK / ASK / etc.]
New messages: [YES/NO — summary if yes]
Action taken: [NONE / SENT / FLAGGED / DRAFTED]
Notes: [brief]

### Shin Kai
[same format]

### Other Contacts
[summary of each — one line per contact]

### Sends Executed This Sweep
[list any messages sent — to whom, subject, playbook scenario used]

### Items Flagged for Owner
[list any escalations — contact, issue, recommendation]

### Next Sweep
[time of next scheduled sweep]
```

---

## STEP 9: Ledger Update

After any send or significant event, append to:
- `~/akior/ledgers/action.md` — what was sent, to whom, subject
- `~/akior/ledgers/decision.md` — only for non-routine decisions or escalations

---

## Sweep Time Quick Reference

| Sweep | Scheduled Time (EST) | Primary goal |
|-------|---------------------|--------------|
| Morning | ~9:00 AM | Catch overnight replies from Taiwan (UTC+8) |
| Midday | ~1:00 PM | Catch business-hours replies |
| EOD | ~5:00 PM | Final scan + 48h follow-up check |

**Taiwan context:** UTC+8 = EST+13. When it's 9 AM EST, it's 10 PM in Taiwan. Replies written during their business day (10 AM–6 PM Taiwan = 9 PM–5 AM EST) will be in Wix by morning sweep.

---

*This playbook governs all Live Pilates Wix Inbox sweeps. Do not deviate from QA checklist. Do not send off-playbook without owner approval. When in doubt, flag and log.*
