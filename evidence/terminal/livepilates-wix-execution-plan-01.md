# Live Pilates USA — Wix Execution Plan

**Generated:** 2026-04-01T03:52Z
**Status:** PLAN ONLY — do not execute until Computer Use is enabled or owner performs manual steps
**Governing doctrine:** SSOT Sec 24 (Adapter Hierarchy), Sec 26 (Wix App Pack)

---

## Prerequisites

- Computer Use must be validated on this Mac Mini (Phase 3 item), OR
- Owner must perform these steps manually and report results to AKIOR

---

## Phase A: Login / Session Validation Only

**Goal:** Establish and verify a working Wix dashboard session. No reading, no replying, no changes.

| Step | Action | Success Criteria | Evidence |
|------|--------|-----------------|----------|
| A1 | Navigate to wix.com/signin | Page loads | Screenshot |
| A2 | Authenticate with owner credentials | Dashboard loads showing Livepilates site | Screenshot of dashboard |
| A3 | Verify Inbox link is accessible | Inbox section loads in left nav or direct URL | Screenshot |
| A4 | Verify session stability | Page does not redirect to login after 30s | Confirm no re-auth prompt |
| A5 | Log result to action ledger | Session status recorded | Ledger entry |

**Exit criteria:** Authenticated session to Wix dashboard confirmed. Do NOT click into any conversation yet.

---

## Phase B: Read-Only Inbox Extraction

**Goal:** Read all unresolved customer conversations and extract message content. No replies, no status changes, no CRM writes.

| Step | Action | Success Criteria | Evidence |
|------|--------|-----------------|----------|
| B1 | Open Wix Inbox | Inbox loads with conversation list | Screenshot of inbox overview |
| B2 | Count total unresolved conversations | Number matches or exceeds Gmail notification count (expected: 8+) | Count logged |
| B3 | Open each conversation in order (newest first) | Message content visible | Screenshot per conversation |
| B4 | For each conversation, extract: contact name, date, message text, any form data, contact info (email/phone if provided) | Structured data captured | Written to extraction file |
| B5 | Classify each: lead / inquiry / complaint / spam | Classification recorded | In extraction file |
| B6 | Do NOT click Reply, do NOT type in any reply box, do NOT change read/unread status if avoidable | No outbound actions taken | Confirm in ledger |
| B7 | Write full extraction to ~/akior/evidence/terminal/livepilates-wix-inbox-extraction-01.md | File created with all message content | File exists |

**Exit criteria:** All unresolved conversations read and extracted. Zero replies sent. Zero status changes made.

---

## Phase C: Draft-Only Reply Preparation (Inside Correct Workflow)

**Goal:** Using the real message content from Phase B, prepare accurate, personalized draft replies. Drafts are saved locally, NOT typed into Wix reply boxes.

| Step | Action | Output |
|------|--------|--------|
| C1 | For each conversation classified as lead/inquiry, draft a personalized reply using actual message content | Local file only |
| C2 | For pricing inquiries: use current rate card (owner must provide if not yet available) | Placeholder if rates unknown |
| C3 | For scheduling inquiries: reference current availability (owner must provide or extract from Wix Bookings) | Placeholder if schedule unknown |
| C4 | For complaints: draft acknowledgment + resolution path | Local file only |
| C5 | For spam: mark as "skip — no reply needed" | Classification only |
| C6 | Write all drafts to ~/akior/evidence/terminal/livepilates-wix-draft-replies-02.md | File created |
| C7 | Create owner review summary with recommended send order | In draft file |

**Exit criteria:** Personalized drafts exist locally for all reply-worthy conversations. Zero replies sent from Wix. Owner reviews drafts before any sending.

---

## What Comes After Phase C (Not Part of This Plan)

After owner reviews Phase C drafts:
- Owner approves specific replies → AKIOR sends via Wix Inbox (or owner sends manually)
- Owner corrects tone/content → AKIOR revises drafts → owner re-approves
- First successful Wix reply cycle validates TF-1 (Customer Reply) per SSOT Sec 25

---

## Adapter Hierarchy Compliance

Per SSOT Sec 24, Wix has no API/CLI surface. The correct execution order is:
1. Playwright browser automation (preferred — deterministic, scriptable)
2. Visual Computer Use (fallback — functional but variable)

Both require Computer Use to be enabled on this Mac Mini. Until then, the owner can perform Phases A-B manually and feed results to AKIOR for Phase C.

---

*Plan only. No execution. No replies. No site changes.*
