# Live Pilates USA — Operating Surface Correction

**Date:** 2026-04-01T03:50Z
**Issued by:** Owner correction
**Status:** EFFECTIVE IMMEDIATELY

---

## Corrected Surface Map

| Surface | Role | Authority Level |
|---------|------|----------------|
| **Wix Dashboard / Wix Inbox** | Canonical reply surface for all customer operations | PRIMARY — source of truth for message content, replies, customer data |
| **Gmail (yosiwizman5638@gmail.com)** | Notification/intake signal layer only | SECONDARY — receives Wix automation alerts but does NOT contain customer message content |
| **info@livepilatesusa.com** | Currently INACTIVE | NONE — do not treat as operating inbox, do not send from or expect replies at this address |

---

## What This Means Operationally

1. **Customer message content lives in Wix Inbox only.** Gmail notifications from wixsiteautomations.com are signals that a message arrived, but they do not include what the customer said.

2. **All customer replies must be sent from Wix Dashboard / Wix Inbox in the browser.** Never reply to customers via Gmail. Never draft replies as if Gmail is the customer-facing channel.

3. **Gmail remains useful as an intake signal.** AKIOR can monitor Gmail to detect new Wix notifications (new message, pre-chat form, etc.) and count/classify them. But the content and reply action happen in Wix.

4. **Future customer-op runs must treat Gmail as intake signal, not reply authority.** All prior reports correctly identified this limitation but did not formalize it as a rule. This document formalizes it.

---

## Why Prior Summaries Were Partial

All prior Live Pilates reports (wix-customer-ops-summary-01.md, livepilates-inbound-queue-01.md, livepilates-action-board-01.md, livepilates-draft-replies-01.md) correctly noted that Gmail notifications did not contain message content and that Wix Inbox access was required. The reports were accurate about what they could see, and all blockers were correctly flagged.

What was missing: a formalized operating rule stating that Wix Inbox is the canonical action surface and Gmail is only the signal layer. That rule is now established in this document and appended to CLAUDE.md.

---

## Adapter Hierarchy for Wix (per SSOT Sec 24)

| Priority | Surface | Status |
|----------|---------|--------|
| 1 | Wix API / connector / MCP | Not available |
| 2 | CLI / SDK | Not available |
| 3 | Playwright browser automation | Available (requires Computer Use / Phase 3) |
| 4 | Visual Computer Use (mouse/keyboard) | Available (requires Computer Use / Phase 3) |

**Current unblock path:** Owner manual login to Wix Inbox, OR enable Computer Use for AKIOR.

---

*Correction effective immediately. All future Live Pilates customer-op tasks must follow this surface map.*
