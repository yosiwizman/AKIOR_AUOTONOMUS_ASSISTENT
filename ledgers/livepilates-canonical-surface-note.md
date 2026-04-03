# Live Pilates USA — Canonical Surface Note

**Timestamp:** 2026-04-01T03:54Z
**Issued by:** Owner correction

## Corrected Operating Surface

| Function | Canonical Surface | Notes |
|----------|------------------|-------|
| Customer message reading | Wix Dashboard → Inbox | Only place message content is visible |
| Customer replies | Wix Dashboard → Inbox → Reply | Only authorized reply channel |
| Intake signal monitoring | Gmail (yosiwizman5638@gmail.com) | Receives Wix notification emails — notification only, no content |
| Customer-facing email | info@livepilatesusa.com | Currently INACTIVE — do not use |

## Why Previous Gmail-Derived Summaries Were Partial

All prior AKIOR reports correctly identified that Gmail notifications from wixsiteautomations.com did not include customer message content. The reports accurately classified items, counted conversations, identified named contacts, and flagged blockers. However, they were partial because:

1. **No message text was available.** Gmail notifications only say "A contact sent you a new message" with a link to Wix Inbox. The actual question, request, or complaint is invisible from Gmail.
2. **Draft replies were generic templates.** Without knowing what the customer asked, drafts contained placeholders rather than personalized responses.
3. **Classification was signal-based, not content-based.** Urgency was inferred from behavioral signals (form + message = high intent) rather than from reading what the customer actually said.

## Source of Truth

**Wix Dashboard / Wix Inbox** is the source of truth for:
- Customer message content
- Conversation history
- Contact information (name, email, phone if provided)
- Reply status (replied / unreplied)
- Customer relationship context

**Gmail** is the source of truth for:
- Notification timestamps (when messages arrived)
- Volume / frequency of inbound contacts
- Wix platform alerts (payment failures, domain issues, segments updates)
