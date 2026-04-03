# AKIOR v1 Sign-Off Gap Checklist

**Generated:** 2026-04-02
**Canonicalized:** 2026-04-02 (Task 13)
**Purpose:** Read-only gap assessment. Does NOT sign off v1.
**Allowed evidence:** SSOT files only (~/akior/docs/ssot/)
**Status vocabulary:** PASS / FAIL / UNVERIFIED only

---

## A. v1 Exit Criteria (from AKIOR-BOOTSTRAP-HANDOFF.md "What v1 Must Validate")

| # | Criterion | Status | SSOT Evidence |
|---|-----------|--------|---------------|
| 1 | Owner can text iMessage → AKIOR responds | **UNVERIFIED** | bootstrap-report.md Section 9: "iMessage" listed in Phase 3 deferred items |
| 2 | Morning briefing runs on schedule | **UNVERIFIED** | No SSOT file records a scheduled task firing on schedule |
| 3 | Email triage correctly categorizes and summarizes (GT-1) | **PASS** | bootstrap-report.md Section 4: Phase 2B PASS, 10 emails classified; PROJECT_LOG.md Task 15: "monitoring active" implies triage operational |
| 4 | Memory persists across sessions | **UNVERIFIED** | bootstrap-report.md Section 9: "Memory directories (6 scopes) — All empty"; no write-read-back test in any SSOT file |
| 5 | Small software feature built, tested, debugged (GT-6) | **PASS** | bootstrap-report.md Section 3: Phase 2A PASS, 5/5 pytest, committed + pushed to GitHub |
| 6 | Desktop Scheduled Tasks survive Mac restart | **UNVERIFIED** | No SSOT file records a Mac restart test |
| 7 | Ollama local inference functional and routed correctly | **PASS** | bootstrap-report.md Section 5: ollama 0.17.7, 4 models; bootstrap-report.md Section 2: P1-11 PASS (2s) |
| 8 | Golden Task Suite GT-1 through GT-8 all pass | **UNVERIFIED** | bootstrap-report.md Section 9: "full Golden Task Suite" listed in Phase 3 deferred |

**Summary: 3 PASS / 0 FAIL / 5 UNVERIFIED**

---

## B. Bootstrap Reliability Checks (from AKIOR-BOOTSTRAP-HANDOFF.md "At Bootstrap")

| # | Check | Status | SSOT Evidence |
|---|-------|--------|---------------|
| 1 | Gmail connector responds | **PASS** | bootstrap-report.md Section 2: P1-12 PASS; Section 6: Gmail PASS |
| 2 | GitHub CLI authenticated | **PASS** | bootstrap-report.md Section 2: P1-13 PASS; Section 6: GitHub PASS |
| 3 | Wix login succeeds | **PASS** | bootstrap-report.md Section 8: "Live Pilates Wix Inbox extraction (11 conversations) — COMPLETE" — implies authenticated Wix session |
| 4 | iMessage Channel active | **UNVERIFIED** | bootstrap-report.md Section 9: "iMessage" listed in Phase 3 deferred |
| 5 | Computer Use functional on M4 | **UNVERIFIED** | No SSOT file explicitly records Computer Use validation as a standalone check; bootstrap-report.md Section 8 references Wix extraction but does not name Computer Use |
| 6 | Docker running | **PASS** | bootstrap-report.md Section 2: P1-09 PASS; Section 5: docker 29.2.1 Running |
| 7 | Ollama installed and responding | **PASS** | bootstrap-report.md Section 2: P1-10 PASS; Section 5: ollama 0.17.7, 4 models |
| 8 | Local inference routing works | **PASS** | bootstrap-report.md Section 2: P1-11 PASS (2s); Section 5: qwen2.5-coder:7b operational |
| 9 | Scheduled Tasks configured | **UNVERIFIED** | No SSOT file records scheduled tasks as registered in Claude Desktop |
| 10 | File system structure created | **PASS** | bootstrap-report.md Section 2: P1-01 PASS (39 dirs), P1-07 PASS (5 ledgers), P1-08 PASS (evidence dirs) |
| 11 | Golden Task Suite passes | **UNVERIFIED** | bootstrap-report.md Section 9: "full Golden Task Suite" listed in Phase 3 deferred |

**Summary: 7 PASS / 0 FAIL / 4 UNVERIFIED**

---

## C. Phase 3 Deferred Items (from bootstrap-report.md Section 9)

| # | Item | Status | SSOT Evidence |
|---|------|--------|---------------|
| 1 | Ollama sustained-load test | **UNVERIFIED** | bootstrap-report.md Section 9: listed as Phase 3 deferred |
| 2 | Full Golden Task Suite GT-1 through GT-8 | **UNVERIFIED** | bootstrap-report.md Section 9: listed as Phase 3 deferred |
| 3 | iMessage Channel test | **UNVERIFIED** | bootstrap-report.md Section 9: listed as Phase 3 deferred |
| 4 | Computer Use validation | **UNVERIFIED** | bootstrap-report.md Section 9: listed as Phase 3 deferred; no standalone SSOT validation record |
| 5 | Wix login test | **PASS** | bootstrap-report.md Section 8: "Live Pilates Wix Inbox extraction (11 conversations) — COMPLETE" |
| 6 | App Pack smoke tests (Instagram, Canva, QuickBooks) | **UNVERIFIED** | bootstrap-report.md Section 9: "App Packs" listed as Phase 3 deferred |
| 7 | Weekly regression bootstrap | **UNVERIFIED** | bootstrap-report.md Section 9: "Weekly regression testing" listed as Phase 3 deferred |

**Summary: 1 PASS / 0 FAIL / 6 UNVERIFIED**

---

## D. Open Items (from bootstrap-report.md Section 9)

| # | Item | Status | SSOT Evidence |
|---|------|--------|---------------|
| 1 | Google Drive connector | **FAIL** | bootstrap-report.md Section 2: P1-15 FAIL; Section 6: Drive FAIL |
| 2 | ~/akior/ not a git repo | **FAIL** | bootstrap-report.md Section 9: "No version control at root level — Open — decision needed" |
| 3 | Stale `{domains` directory artifact | **FAIL** | bootstrap-report.md Section 9: "Empty, harmless, from bootstrap brace-expansion bug — Cleanup needed" |
| 4 | PROJECT_LOG placeholder cleanup | **UNVERIFIED** | bootstrap-report.md Section 9: "Cleanup decision pending"; no SSOT record of cleanup completion |
| 5 | Memory directories empty | **UNVERIFIED** | bootstrap-report.md Section 9: "All empty — no memory files written yet — Expected at v1" |
| 6 | Domain pack directories empty | **UNVERIFIED** | bootstrap-report.md Section 9: "All empty — no domain-specific content yet — Expected at v1" |
| 7 | Financial ledger empty | **PASS** | bootstrap-report.md Section 9: "Accurate — no task card spend to date"; empty is correct state |
| 8 | Alexandra Sarbu (new lead) | **UNVERIFIED** | bootstrap-report.md Section 9: "Flagged, not contacted — Owner decision pending" |

**Summary: 1 PASS / 3 FAIL / 4 UNVERIFIED**

---

## E. Consolidated v1 Sign-Off Position

| Category | PASS | FAIL | UNVERIFIED |
|----------|------|------|------------|
| A. v1 Exit Criteria | 3 | 0 | 5 |
| B. Bootstrap Reliability | 7 | 0 | 4 |
| C. Phase 3 Deferred | 1 | 0 | 6 |
| D. Open Items | 1 | 3 | 4 |
| **Total** | **12** | **3** | **19** |

**v1 cannot be signed off.** 19 items are UNVERIFIED and 3 are FAIL.

The 19 UNVERIFIED items cluster as follows:
1. **iMessage Channel** (3 items across A/B/C) — requires owner to enable in Claude Desktop
2. **Golden Task Suite** (3 items across A/B/C) — requires formal GT-1 through GT-8 run
3. **Scheduled Tasks** (3 items across A/B) — requires Claude Desktop registration + Mac restart test
4. **Computer Use** (2 items across B/C) — no standalone SSOT validation record
5. **Memory persistence** (1 item in A) — requires write-read-back test
6. **App Packs + regression** (2 items in C) — Instagram/Canva/QuickBooks + weekly regression
7. **Ollama load test** (1 item in C) — 50-call sustained test
8. **Open operational items** (4 items in D) — placeholder cleanup, memory/domain population, Alexandra Sarbu, lead decision

The 3 FAIL items are:
1. Google Drive connector — no MCP connector available
2. ~/akior/ not a git repo — no version control at root
3. Stale `{domains` artifact — cleanup not yet performed

**CTO decision required:** Which UNVERIFIED items must pass before v1 sign-off, and which can be explicitly deferred to v2? Which FAIL items are acceptable known limitations vs. blockers?

---

*Canonical checklist. v1 is not signed off. CTO review required.*
