# AKIOR System Status

**Generated:** 2026-04-03T01:35Z (Phase 5 re-verified)
**Purpose:** Canonical "what is AKIOR right now" document
**Refresh:** Update after each major system change

---

## Running Services

| Service | Status | Mechanism |
|---------|--------|-----------|
| OpenClaw Gateway | Running (PID active) | LaunchAgent ai.openclaw.gateway (KeepAlive + RunAtLoad) |
| AKIOR Ops Console | Running (localhost:8420) | LaunchAgent com.akior.ops-console (KeepAlive) |
| tmux watchdog | Running | LaunchAgent com.akior.watchdog (every 300s) |
| tmux session "akior" | Active (since Mar 31) | Maintained by watchdog |
| Docker | Running (14 containers) | Docker Desktop |
| Ollama | Running (4 models) | Homebrew service |

---

## Installed Tools

| Tool | Version | Purpose |
|------|---------|---------|
| git | 2.50.1 | Version control |
| gh | 2.87.3 | GitHub CLI (authenticated as yosiwizman) |
| docker | 29.2.1 | Container runtime |
| ollama | 0.17.7 | Local inference (qwen2.5-coder:7b, qwen3:14b, llama3.1, tinyllama:1.1b) |
| tmux | 3.6a | Terminal multiplexer |
| node | v24.13.1 | JavaScript runtime |
| npm | 11.8.0 | Package manager |
| python3 | 3.9.6 | Python runtime |
| brew | 5.1.1 | macOS package manager |
| jq | 1.7.1 | JSON processor |
| OpenClaw | 2026.4.2 | WhatsApp + autonomous agent gateway |
| OpenWolf | 1.0.4 | Claude Code second brain (persistent memory) |
| ClawHub | 0.9.0 | Skill marketplace CLI |

---

## OpenClaw Cron Jobs

| Name | Schedule | Status |
|------|----------|--------|
| morning-briefing | Daily 8:03 AM ET | idle |
| email-triage | Every 4 hours | idle |
| lp-inbox-sweep | Every 6 hours | idle |
| canary-health | Daily 6:57 AM ET | idle |
| evening-summary | Daily 9:07 PM ET | ok (last ran) |

---

## MCP Servers (LIVE — verified 2026-04-03)

| Server | Package | Status | Verification |
|--------|---------|--------|--------------|
| playwright | @playwright/mcp@latest | LIVE | Navigated livepilatesusa.com + screenshot saved |
| context7 | @upstash/context7-mcp | LIVE | Available in tool list |
| ddg-search | ddg-mcp-search | LIVE | Searched "Live Pilates USA V12" — 3 results returned |
| memory | @exaudeus/memory-mcp | PARTIAL | Config exists but bootstrap fails (lobe not resolving) |

---

## OpenClaw Channels

| Channel | Status | Detail |
|---------|--------|--------|
| WhatsApp | ON, linked | +13054098490, account "AKIOR WhatsApp" |

---

## Claude Code Skills (installed to ~/.claude/skills/)

| Skill | Source |
|-------|--------|
| continuous-learning-v2 | everything-claude-code |
| security-review | everything-claude-code |
| search-first | everything-claude-code |
| strategic-compact | everything-claude-code |
| eval-harness | everything-claude-code |
| verification-loop | everything-claude-code |

## Claude Code Commands (installed to ~/.claude/commands/)

| Command | Source |
|---------|--------|
| /plan | everything-claude-code |
| /learn | everything-claude-code |
| /verify | everything-claude-code |
| /checkpoint | everything-claude-code |

---

## ClawHub Skills (installed to ~/.openclaw/workspace-dev/skills/)

| Skill | Version | Purpose |
|-------|---------|---------|
| self-improving-agent | 3.0.12 | Error/correction logging + self-improvement |
| mcp-scaffolder | 1.0.0 | MCP server generation |
| automation-workflows | 0.1.0 | Workflow automation patterns |
| agentic-workflow-automation | 0.1.0 | Agent workflow orchestration |
| productivity-automation-kit | 1.0.0 | Productivity tool automation |

---

## OpenWolf Status

| Item | Value |
|------|-------|
| Version | 1.0.4 |
| Files indexed | 524 |
| Hooks registered | 6 (session start, pre/post read, pre/post write, stop) |
| Cerebrum | AKIOR business rules + Live Pilates ops rules loaded |
| Memory | Active (~/akior/.wolf/memory.md) |
| Bug log | Active (~/akior/.wolf/buglog.json) |

---

## Canary Health (last run)

| Canary | Status |
|--------|--------|
| Filesystem | PASS |
| Ollama | PASS |
| GitHub | PASS |
| Gmail | PASS |
| **Overall** | **4/4 PASS** |

---

## Known Gaps / Deferred Items

| Item | Status | Category |
|------|--------|----------|
| Google Drive connector | No MCP available | Deferred |
| Brave Search MCP | Needs API key from owner | Owner action |
| iMessage Channel | Not yet activated | Phase 3 deferred |
| Full Golden Task Suite GT-1–GT-8 | Not formally run | Phase 3 deferred |
| Weekly regression suite | Not yet baselined | Phase 3 deferred |
| Ollama sustained-load test | Not yet run | Phase 3 deferred |
| App Packs (Instagram, Canva, QuickBooks) | Not yet configured | Phase 3 deferred |
| Memory persistence test (write-read-back) | Not yet run | v1 sign-off gap |
| Scheduled Tasks (Claude Desktop) survive Mac restart | Not tested | v1 sign-off gap |
| MCP tools (playwright, ddg-search, context7) | VERIFIED LIVE | Tested 2026-04-03 |
| Memory MCP bootstrap | Fails — lobe "akior" not resolving despite config | Needs debug |
| Alexandra Sarbu Wix send (Task 19) | Draft ready, not sent | Needs Wix browser session |
| ~/akior/ git repo | Initialized but no commits | Housekeeping |

---

*System status snapshot. Update after major changes.*
