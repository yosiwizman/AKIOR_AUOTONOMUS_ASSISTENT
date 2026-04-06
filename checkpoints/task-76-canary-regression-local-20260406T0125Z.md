# Checkpoint — Task 76: Localize canary-health and weekly-regression as local launchd agents

**Timestamp (UTC):** 2026-04-06T01:25Z
**Predecessor:** Task 75 (PROJECT_LOG reconciliation)

## Script-to-function mapping (VERIFIED from ~/.openclaw/cron/jobs.json payloads)

| OpenClaw job | Mapped scripts | Schedule (from SSOT) |
|---|---|---|
| canary-health | `run-daily-canaries.sh` + `morning-resume-check.sh` | daily 06:57 ET |
| weekly-regression | `run-daily-canaries.sh` | Sundays 06:00 ET |

## Local-only verification
- `run-daily-canaries.sh`: invokes 4 sub-canaries (filesystem, ollama, github, gmail). All are pure bash + curl-to-localhost. Zero paid-API references.
- `morning-resume-check.sh`: checks checkpoints, resume-queue, tmux, ops-console (localhost:8420), ollama (localhost:11434), docker. Zero paid-API references.
- `filesystem-health.sh` grep hit for "claude" was a false positive — it checks if `CLAUDE.md` the file exists on disk.
- Ollama references are health-probe only (`curl localhost:11434`), not inference calls.
- Both scripts already had executable bit set (`-rwxr-xr-x`). No chmod needed.

## Created launchd agents
| Label | Plist | Schedule | RunAtLoad | Scripts |
|---|---|---|---|---|
| `com.akior.canary-health-local` | `~/Library/LaunchAgents/com.akior.canary-health-local.plist` | Daily 06:57 local | true | `run-daily-canaries.sh; morning-resume-check.sh` |
| `com.akior.weekly-regression-local` | `~/Library/LaunchAgents/com.akior.weekly-regression-local.plist` | Sundays 06:00 local | true | `run-daily-canaries.sh` |

## Evidence
- Both plists validated via `plutil -lint`: OK
- Both bootstrapped into `gui/501` domain
- `launchctl list` shows both with exit status 0 (RunAtLoad completed)
- RunAtLoad execution: `Canary run complete: 4/4 passed` + `Morning resume check written`
- Kickstart dry-run: 4/4 passed, zero network connections to any paid-API host
- Artifacts: `daily-canary-summary.md` (4/4 passed), `morning-resume-status-latest.md` (Bootstrap: ONLINE, Queue: EMPTY, Ollama: ACTIVE)
- OpenClaw cron jobs remain: 0 enabled agentTurn jobs (untouched)

## Autonomous local agent inventory (post-Task 76)
| launchd label | Function | Cadence | Model? | Paid API? |
|---|---|---|---|---|
| `com.akior.email-triage-local` | Email triage | every 2h | qwen2.5-coder:7b | NO |
| `com.akior.canary-health-local` | Daily health check | daily 06:57 | none | NO |
| `com.akior.weekly-regression-local` | Weekly regression | Sundays 06:00 | none | NO |
| `com.akior.watchdog` | tmux keep-alive | every 300s | none | NO |

## Rollback
```
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.akior.canary-health-local.plist
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.akior.weekly-regression-local.plist
rm ~/Library/LaunchAgents/com.akior.canary-health-local.plist
rm ~/Library/LaunchAgents/com.akior.weekly-regression-local.plist
```
