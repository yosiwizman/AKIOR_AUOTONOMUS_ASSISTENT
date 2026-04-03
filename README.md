# AKIOR — Autonomous AI Operating System

AKIOR is a fully autonomous AI operating system running on a Mac Mini. It operates with full CTO/admin authority, managing communications, business operations, development infrastructure, and decision-making without per-task approval gates.

## Architecture

AKIOR is built on a multi-layer stack:

- **Brain**: Claude (primary reasoning, planning, orchestration) + Ollama (local inference for classification, summarization)
- **Gateway**: OpenClaw — WhatsApp, iMessage, voice calls, cron jobs, plugin ecosystem
- **Voice**: clawr.ing (managed phone calls) + whisper-cpp (local STT) + ElevenLabs (TTS)
- **Browser**: Playwright MCP — web automation, scraping, form filling
- **Memory**: OpenWolf (.wolf/) — persistent context across sessions
- **Search**: DDG Search MCP + Brave Search API
- **Database**: Supabase MCP
- **Dashboard**: http://localhost:8421 — dark-themed ops dashboard

## Directory Structure

```
akior/
├── docs/ssot/          # Canonical governing documents (constitution, runtime ref)
├── reports/            # CTO briefings, research, scraping results
├── ledgers/            # Action, tool, financial, deployment, decision logs
├── config/             # System configuration
├── dashboard/          # Ops dashboard (HTML, served on :8421)
├── skills/             # Custom skills (clawring, etc.)
├── openclaw/           # OpenClaw gateway config and extensions
├── communications/     # Message templates, channel configs
├── evidence/           # Screenshots from browser actions
├── checkpoints/        # Pre-irreversible-action checkpoints
├── domains/            # Isolated memory per domain (10 domains)
├── memory/             # Domain-specific persistent memory
├── playbooks/          # Operational playbooks
├── projects/           # Sub-projects
├── forge/              # Experimental / R&D
├── training/           # Training data and patterns
├── .wolf/              # OpenWolf brain (anatomy, cerebrum, memory, buglog)
└── CLAUDE.md           # Operating constitution
```

## Core Rules

1. Full autonomy — no per-task owner approval required
2. Owner role = briefing + override only
3. Budget: $500 API + $1,000 task card. Local/free first.
4. All channels approved (iMessage, email, WhatsApp, web UI, VOIP)
5. Deploy without approval gates. Log all deployments.
6. Risk = AKIOR-managed (sandbox/Docker/dry-run/simulation first)
7. Capability growth unlimited. Self-improve continuously.

## Active Channels

| Channel | Method | Status |
|---------|--------|--------|
| WhatsApp | OpenClaw Gateway | Active |
| iMessage | Native AppleScript | Active |
| Gmail | Claude MCP | Active (read/draft) |
| Phone Calls | clawr.ing API | Active |
| Google Calendar | Claude MCP | Active |
| Web Browser | Playwright MCP | Active |
| Dashboard | localhost:8421 | Active |

## Services

| Service | Port/Method |
|---------|-------------|
| OpenClaw Gateway | LaunchAgent |
| AKIOR Ops Console | :8420 |
| AKIOR Dashboard | :8421 |
| tmux watchdog | LaunchAgent (300s) |
| Docker | 14 containers |
| Ollama | 4 models |

## SSOT Documents

The canonical governing documents live in `docs/ssot/`:
- `AKIOR-OS-SSOT-v1.0-EXPERIMENT-LOCK.md` — Master constitution
- `RUNTIME-REFERENCE.md` — Daily execution guidance
- `AKIOR-SYSTEM-STATUS.md` — Current system state
- `SSOT-REGISTER.md` — Index of all canonical documents

---

*AKIOR Autonomous Operating System — Phase 7 — Full Autonomy*
