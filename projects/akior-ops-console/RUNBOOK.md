# AKIOR Ops Console — Operator Runbook

## What This Is

A lightweight local web UI that reads AKIOR's canonical files directly from ~/akior/ and displays operational status. It runs on the Mac Mini with zero cloud dependencies.

**Purpose:** Maintain operator visibility during Claude Desktop / Cowork / Claude.ai outages. This is a fallback companion, not a replacement for the SSOT or terminal workflow.

## How to Start

```bash
cd ~/akior/projects/akior-ops-console
python3 server.py
```

Then open: **http://localhost:8420**

The page auto-refreshes every 30 seconds.

## How to Stop

Press Ctrl+C in the terminal running the server.

## What It Shows

| Section | Source |
|---------|--------|
| Current operational phase | Derived from monitor board contact statuses |
| SSOT status | Checks ~/akior/docs/ssot/ for all lock files |
| Contact pipeline | Reads postsend-monitor-01.md for contact names + statuses |
| Asset files | Checks existence of all Live Pilates evidence files |
| Checkpoint / bootstrap | Reads ~/akior/checkpoints/bootstrap-complete.json |
| Recent evidence | Lists latest 12 files in ~/akior/evidence/terminal/ |
| Action ledger (tail) | Last 20 lines of ~/akior/ledgers/action.md |
| Decision log (tail) | Last 10 lines of ~/akior/ledgers/decision.md |
| Project health | Manual status flags for Claude Desktop, Wix, Ollama, Docker |

## When to Use

- Claude Desktop is down or unresponsive
- Cowork session expired or unavailable
- Claude.ai is experiencing an outage
- You need a quick status check without opening a full Claude session
- You want to verify file integrity after a system restart

## What It Cannot Do

- Send messages (Wix Inbox requires browser session)
- Modify files (read-only)
- Run Claude commands
- Access Gmail or Calendar connectors
- Replace the terminal workflow

## API Endpoint

`GET http://localhost:8420/api/status` returns JSON with SSOT, checkpoint, Live Pilates, and evidence data. Useful for scripting or external monitoring.

## Continuity Value

Without this console, a Claude Desktop outage means zero visibility into AKIOR's operational state until the session is restored. With it, the operator can:
1. Confirm all canonical files are intact
2. See the current pipeline status
3. Read the latest ledger entries
4. Verify which sends were completed
5. Know exactly what the next action should be

This reduces platform dependency from "single point of failure" to "degraded but visible."
