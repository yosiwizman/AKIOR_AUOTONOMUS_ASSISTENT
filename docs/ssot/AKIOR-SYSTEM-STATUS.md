# AKIOR System Status

**Generated:** 2026-04-03T12:00Z (V2 Phase 3 COMPLETE — voice transcription, morning ops, Jarvis audit, dashboard upgrade, iMessage + FaceTime)
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
| AKIOR Dashboard | Running v2.0-phase3 (localhost:8421) | LaunchAgent com.akior.dashboard (KeepAlive) — auto-refresh 60s, email triage, collapsible panels |

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
| whisper-cpp | 1.8.4 | Local speech-to-text (ggml-base model) |
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
| weekly-regression | Sundays 6:00 AM ET | idle (new) |

---

## MCP Servers (LIVE — verified 2026-04-03)

| Server | Package | Status | Verification |
|--------|---------|--------|--------------|
| playwright | @playwright/mcp@latest | LIVE | Navigated livepilatesusa.com + screenshot saved |
| context7 | @upstash/context7-mcp | LIVE | Available in tool list |
| ddg-search | ddg-mcp-search | LIVE | Searched "Live Pilates USA V12" — 3 results returned |
| memory | @modelcontextprotocol/server-memory | REPLACED | Test next session |
| firecrawl | firecrawl-mcp | REGISTERED | Local scraping mode, active next session |

---

## OpenClaw Exec Approvals

| Scope | Agent | Pattern | Policy |
|-------|-------|---------|--------|
| tools.exec | * | * | security=full, ask=off |

## OpenClaw Channels

| Channel | Status | Detail |
|---------|--------|--------|
| WhatsApp | ON, linked, allowlist mode | +13054098490, +17865181777; voice transcription working (whisper-cpp local) |
| iMessage | PARTIAL — outbound active, inbound pending FDA | Outbound via osascript + imsg CLI. Inbound BLOCKED: macOS Full Disk Access needed for imsg + node |
| FaceTime | READY — skill installed, not yet live-tested | URL scheme verified, skill at skills/facetime/SKILL.md, SOUL.md updated |
| clawr.ing (Phone) | ON, API key configured | skills/clawring/SKILL.md — managed voice calls |
| Dashboard | ON v2.0-phase3, localhost:8421 | Auto-refresh 60s, email triage, collapsible panels, uptime display |

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

## OpenClaw Plugins (enabled through V2)

| Plugin | ID | Status | Added |
|--------|-----|--------|-------|
| DuckDuckGo | duckduckgo | enabled | Phase 7 |
| Diffs | diffs | enabled | Phase 7 |
| LLM Task | llm-task | enabled | Phase 7 |
| Lobster | lobster | enabled | Phase 7 |
| Browser | browser | loaded | Phase 7 |
| Voice Call | voice-call | DISABLED (conflicts with clawring) | V2 |
| ElevenLabs | elevenlabs | enabled (needs API key) | V2 |
| Deepgram | deepgram | enabled (needs API key) | V2 |
| Groq (Whisper fallback) | groq | enabled | V2 Phase 3 |
| BlueBubbles | bluebubbles | enabled (needs server) | V2 |
| iMessage | imessage | enabled | V2 |

## ClawHub Skills (installed to ~/.openclaw/workspace-dev/skills/)

| Skill | Version | Purpose |
|-------|---------|---------|
| self-improving-agent | 3.0.12 | Error/correction logging + self-improvement |
| mcp-scaffolder | 1.0.0 | MCP server generation |
| automation-workflows | 0.1.0 | Workflow automation patterns |
| agentic-workflow-automation | 0.1.0 | Agent workflow orchestration |
| productivity-automation-kit | 1.0.0 | Productivity tool automation |
| macos-calendar | latest | macOS Calendar integration |
| notification | latest | Terminal notifications |
| reminder | latest | Natural-language reminders |
| gws-gmail-send | latest | Gmail send via gws CLI |
| gws-shared | latest | Shared gws auth/config |
| web-scraper-jina | latest | Web scraping via Jina |
| smart-web-scraper | latest | Intelligent web scraping |
| scrapling-web-scraper | latest | Scrapling-based scraper |
| smart-file-manager | latest | File management |
| system-resource-monitor | latest | System resource monitoring |
| system-info | latest | System information |
| data-analyst-pro | latest | Data analysis |
| data-anomaly-detector | latest | Anomaly detection |

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
| iMessage Channel | PARTIAL — outbound working, inbound pending FDA grant for imsg + node | Owner action |
| ElevenLabs API key | Needed for speech synthesis | Owner action |
| Deepgram API key | No longer needed — whisper-cpp local handles transcription | Resolved |
| Neon payment | CRITICAL — payment failing, Cash App card locked | Owner action |
| Vercel deploys | CRITICAL — deploys failing | Investigation needed |
| GitHub storage | CRITICAL — storage full | Investigation needed |
| gogcli | NOT A REAL TOOL — Gmail MCP is the primary interface | Resolved |
| clawr.ing voice calls | CONFIGURED — API key set, skill installed | V2 Phase 2 |
| GUI automation | No macOS-native solution, osascript available | R&D |
| Ollama sustained-load test | Not yet run | Deferred |
| App Packs (Instagram, Canva, QuickBooks) | Not yet configured | Deferred |
| Memory MCP | Replaced, test next session | Next session |
| Firecrawl MCP | Registered, test next session | Next session |
| ~/akior/ git repo | Active, pushed to github.com/yosiwizman/akior | Resolved |
| FaceTime audio | Skill ready, not yet live-tested | Next test |

---

*System status snapshot. Update after major changes.*
