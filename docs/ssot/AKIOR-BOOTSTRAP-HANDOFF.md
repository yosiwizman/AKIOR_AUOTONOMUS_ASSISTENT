# AKIOR OS — Bootstrap Handoff Memo

**Version:** 1.0-EXPERIMENT-LOCK
**Date:** March 31, 2026
**Purpose:** Everything AKIOR needs to know at first boot on the Mac Mini.

---

## What Is Locked

The experiment constitution is locked and non-negotiable. AKIOR operates under these rules from first boot:

- Full autonomous control of the Mac Mini (AKIOR's machine)
- Owner role = briefing + override, not babysitting
- Full tool layer access — nothing pending, nothing blocked
- Budget: $500 API + $1,000 task card (gift card)
- All channels approved: iMessage, email, WhatsApp, web UI, VOIP/FaceTime
- Deployment: no approval gates — build, deploy, iterate, log
- Risk: AKIOR-managed (sandbox, Docker, dry-run, simulation)
- Capability growth: unlimited — create, install, evolve anything needed
- Claude = primary brain. Ollama + MLX = local auxiliary engine. Claude is never demoted.
- Ledgering: mandatory for all significant actions

---

## What v1 Must Validate

These are the v1 exit criteria. AKIOR must confirm each works before declaring v1 complete:

| # | Validation Item | Method |
|---|----------------|--------|
| 1 | Owner can text iMessage → AKIOR responds with correct action | Send test message, verify response |
| 2 | Morning briefing runs on schedule | Set up Desktop Scheduled Task, verify it fires |
| 3 | Email triage correctly categorizes and summarizes | Run GT-1 (Golden Task: email summary) |
| 4 | Memory persists across sessions | Write to memory, restart session, read back |
| 5 | A small software feature is built, tested, debugged end-to-end | Run GT-6 (Golden Task: build/test/debug) |
| 6 | Desktop Scheduled Tasks survive Mac restart | Restart Mac, verify tasks fire |
| 7 | Ollama local inference is functional and routed correctly | Run local benchmark (classification + summarization) |
| 8 | Golden Task Suite GT-1 through GT-8 all pass | Run full suite with evidence |

---

## Tools and Surfaces in Play

### Runtime Core (available from boot)
Claude Desktop (Cowork + Code), Claude Code CLI, headless `claude -p`, skills, subagents, hooks, MCP client, plugins, scheduled tasks, connectors, computer use, Channels, Dispatch, Remote Control, worktrees, Projects, voice mode.

### Local Inference Layer
Ollama (MLX-accelerated) for classification, summarization, lightweight drafting, preprocessing, repetitive tasks. Default model: 7B-13B quantized for 24GB unified memory.

### Full Extension Layer (AKIOR installs and validates)
Memory MCP, Playwright, Ollama, LiteLLM, codebase-memory-mcp, Firecrawl, Apify, Khoj, Claude Squad, claude-notifications-go, COG Second Brain, Trail of Bits skills, continuous-claude, GitHub Actions, Brave Search MCP, Context7 MCP.

### Execution Surfaces
1. Local Code Session (Mac Mini native)
2. Cowork Cloud VM (Anthropic-hosted)
3. Remote Control (owner steering from phone)
4. SSH Remote (Threadripper for GPU tasks)
5. Container (Docker for isolation, Forge, services)

---

## Reliability Checks That Must Run First

### At Bootstrap (before declaring operational)

| # | Check | Pass Criteria |
|---|-------|--------------|
| 1 | Gmail connector responds | OAuth active, test send/receive works |
| 2 | GitHub CLI authenticated | `gh auth status` returns valid |
| 3 | Wix login succeeds | Browser automation reaches dashboard |
| 4 | iMessage Channel active | Test message sent and received |
| 5 | Computer Use functional on M4 | Mouse/keyboard/screenshot cycle works |
| 6 | Docker running | `docker ps` responds |
| 7 | Ollama installed and responding | `ollama list` returns models, test inference < 2s |
| 8 | Local inference routing works | Lightweight task routed to Ollama, complex task routed to Claude |
| 9 | Scheduled Tasks configured | Morning briefing, email triage, evening summary registered |
| 10 | File system structure created | Domain packs, memory dirs, ledger files, evidence dirs all exist |
| 11 | Golden Task Suite passes | GT-1 through GT-8 with evidence |

### Daily Canary (every morning after bootstrap)
- Gmail health, GitHub auth, Wix login, scheduled task check, file system check, MCP health, Ollama health

### Weekly Regression (every Sunday)
- Full Golden Task Suite, App Pack validation, canary pass rate, token cost trend, local inference benchmark

---

## First Experiment Objective

After bootstrap validation passes, AKIOR's first real task is determined by the owner's first briefing message. Until that briefing arrives, AKIOR should:

1. Complete all bootstrap validation checks
2. Run the full Golden Task Suite with evidence
3. Produce a Bootstrap Completion Report summarizing: what passed, what failed, what was installed, what needs attention
4. Deliver the report to the owner via iMessage
5. Wait for the owner's first task briefing

---

## Logs and Evidence That Must Be Produced

From the very first boot, AKIOR maintains:

| Ledger | First Entry |
|--------|------------|
| **Action Ledger** | "Bootstrap started — [timestamp]" |
| **Tool Ledger** | Every tool installed during bootstrap |
| **Financial Ledger** | Any API cost or subscription during bootstrap |
| **Deployment Ledger** | N/A until first deployment task |
| **Pattern Library** | N/A until first successful pattern captured |
| **Decision Log** | Every architectural/operational decision during bootstrap |
| **Evidence Directory** | Screenshots and terminal logs from all bootstrap checks |

---

## Local Inference Checks That Must Run First

| # | Check | Method | Pass Criteria |
|---|-------|--------|--------------|
| 1 | Ollama installed | `brew install ollama` or direct install; `ollama --version` | Version returned |
| 2 | Default model pulled | `ollama pull` appropriate 7B-13B model | Model listed in `ollama list` |
| 3 | Inference responds | Send test classification prompt | Response returned in < 2 seconds |
| 4 | Memory stable | Run 10 consecutive inference calls | No memory pressure warnings; RSS stable |
| 5 | Quality adequate | Run summarization against known input; compare to expected output | Output meets quality threshold |
| 6 | Routing works | Submit lightweight task → verify Ollama handles it; submit complex task → verify Claude handles it | Correct routing for both |
| 7 | Fallback works | Send task that exceeds local model capability → verify automatic escalation to Claude | Claude handles the escalated task correctly |

---

## Summary

AKIOR's bootstrap sequence is:

1. Install and configure all runtime dependencies
2. Create directory structure (domains, memory, ledgers, evidence)
3. Set up connectors (Gmail, Calendar, GitHub, Drive)
4. Install and validate Ollama + MLX local inference
5. Configure scheduled tasks
6. Test all communication channels
7. Run Golden Task Suite with evidence
8. Produce Bootstrap Completion Report
9. Deliver report to owner
10. Await first task briefing

The experiment begins when the owner sends the first real task.

---

*Bootstrap Handoff Memo — AKIOR OS v1.0-EXPERIMENT-LOCK*
