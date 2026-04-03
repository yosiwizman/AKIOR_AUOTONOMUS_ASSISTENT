# AKIOR System Status

**Last Updated:** 2026-04-03 ~20:00 EDT
**Machine:** Mac Mini (darwin 25.3.0, zsh)
**Primary Brain:** Claude Opus 4.6 (1M context)

---

## Running Services

| Service | Port | Process | LaunchAgent | Status |
|---------|------|---------|-------------|--------|
| AKIOR UI Frontend | 3001 | Node (npm dev) | com.akior.ui-frontend | RUNNING |
| AKIOR UI Backend | 3002 | Node (tsx watch) | com.akior.ui-backend | RUNNING |
| Dashboard (static) | 8421 | Python http.server | com.akior.dashboard | RUNNING |
| Dashboard API | 8422 | Node api.js | com.akior.dashboard-api | RUNNING |
| OpenClaw Gateway | 18789 | Node (openclaw gateway) | ai.openclaw.gateway | RUNNING |
| Ops Console | -- | Python server.py | com.akior.ops-console | RUNNING |
| Watchdog | -- | Bash (every 300s) | com.akior.watchdog | RUNNING |
| Docker | 3000+ | Docker Engine | -- | RUNNING (14 containers) |
| Ollama | 11434 | ollama serve | -- | RUNNING (4 models) |

## Channels

| Channel | Status | Endpoint / Detail |
|---------|--------|-------------------|
| WhatsApp | LIVE | +13054098490, linked via OpenClaw, auth OK |
| iMessage | ONLINE | Configured via OpenClaw (BlueBubbles server not yet installed) |
| Gmail | ONLINE | yosiwizman5638@gmail.com, browser triage automation |
| Google Calendar | ONLINE | MCP integration via Claude tools |
| Dashboard Web UI | RUNNING | http://localhost:8421 |
| AKIOR Main UI | RUNNING | http://localhost:3001 (FE) + http://localhost:3002 (BE) |
| VOIP/Phone | CONFIGURED | clawr.ing for outbound calls |
| Yahoo Mail | CONFIGURED | Skill registered, config at config/yahoo-email-config.yaml |
| Wix Inbox | EXTERNAL | Live Pilates USA customer ops (canonical reply surface) |

## LaunchAgents (Boot Persistence)

All located in `~/Library/LaunchAgents/`:

| Plist | Label | RunAtLoad | KeepAlive |
|-------|-------|-----------|-----------|
| com.akior.dashboard.plist | com.akior.dashboard | Yes | Yes |
| com.akior.dashboard-api.plist | com.akior.dashboard-api | Yes | Yes |
| com.akior.ui-frontend.plist | com.akior.ui-frontend | Yes | Yes |
| com.akior.ui-backend.plist | com.akior.ui-backend | Yes | Yes |
| com.akior.ops-console.plist | com.akior.ops-console | Yes | Yes |
| com.akior.watchdog.plist | com.akior.watchdog | Yes | -- (interval: 300s) |
| ai.openclaw.gateway.plist | ai.openclaw.gateway | Yes | Yes |

## Cron Jobs and Scheduled Tasks

| Schedule | Task | Method |
|----------|------|--------|
| Every 300s | tmux session watchdog | LaunchAgent |
| Boot | All 7 services above | macOS launchd |
| ~4 hours | Email triage (Gmail) | OpenClaw scheduled task |
| Daily | Canary checks (FS, Ollama, GitHub, Gmail) | OpenClaw |
| Weekly | GitHub Actions regression | GitHub Actions cron |

**Note:** System crontab is empty -- all scheduling via LaunchAgents and OpenClaw.

## Ollama Models

| Model | Size |
|-------|------|
| qwen2.5-coder:7b | 7B |
| qwen3:14b | 14B |
| llama3.1 | 8B |
| tinyllama:1.1b | 1.1B |

## Known Gaps

1. **ElevenLabs API key** -- not set; voice TTS unavailable
2. **Deepgram API key** -- not set; voice transcription blocked
3. **BlueBubbles server** -- not installed; iMessage partially functional
4. **iMessage session context** -- 76% used (152k/200k), needs rotation
5. **OpenClaw model tier** -- Sonnet 4 vs recommended Claude 4.5
6. **Credentials dir permissions** -- readable by others (security warning)
7. **WhatsApp voice transcription** -- blocked on Deepgram
8. **Domain renewals pending** -- BLOGGERHUB.BLOG (expires 4/7), LUXURY-MIAMI-DIRECTORY.COM (canceling)
