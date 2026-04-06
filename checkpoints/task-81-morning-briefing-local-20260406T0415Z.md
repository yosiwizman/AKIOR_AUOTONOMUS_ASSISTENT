# Checkpoint — Task 81: Build and register local-only morning briefing

**Timestamp (UTC):** 2026-04-06T04:15Z
**Predecessor:** Task 80 (morning-briefing dependency audit, READY FOR LOCAL MVP BUILD)

## Implementation
Created `~/akior/scripts/morning-briefing-local.sh` (7313→7567 bytes after timeout fix).
Mirrors the evening-summary-local.sh pattern: lockfile, structured log, Ollama call, markdown output.

**Input sources (all local, proven in Task 80):**
1. macOS Calendar SQLite DB (`~/Library/Group Containers/.../Calendar.sqlitedb`) — queries both CalendarItem and OccurrenceCache for today's events; handles CoreData epoch conversion via strftime + 978307200 offset; handles 0-event days gracefully.
2. Latest email-triage report (`~/akior/ledgers/email-triage-*.md`)
3. Daily canary summary (`~/akior/evidence/terminal/daily-canary-summary.md`)
4. Morning resume status (`~/akior/evidence/terminal/morning-resume-status-latest.md`)
5. Previous evening summary (`~/akior/evidence/terminal/evening-summary-latest.md`)
6. Today's action.md lines (TMUX_WATCHDOG filtered to count)
7. Today's decision.md lines

**Ollama integration:** Direct curl to 127.0.0.1:11434/api/chat with 30s timeout (increased from the wrapper's 10s due to longer prompt). Model: qwen2.5-coder:7b.

**Initial failure:** First run failed with ollama exit=1 because the 10s timeout in ollama-local-llm.sh was too tight for the fuller morning-briefing prompt. Fixed by calling Ollama directly with 30s timeout. Second run succeeded in ~8s.

## LaunchAgent
- Plist: `~/Library/LaunchAgents/com.akior.morning-briefing-local.plist`
- Label: `com.akior.morning-briefing-local`
- Schedule: daily 08:00 local (original OpenClaw cron was 08:03 ET)
- RunAtLoad: true
- plutil: OK

## Execution evidence
- Manual run 2: exit 0, 8s, briefing generated with 5 sections
- RunAtLoad: exit 0, 3s (warm model), briefing refreshed
- Autonomous log: `OK output=.../daily-briefing-latest.md`
- Action ledger: `MORNING_BRIEFING_LOCAL | COMPLETE` line appended
- 0 calendar events handled gracefully ("Nothing scheduled.")

## Autonomous local agent inventory (post-Task 81)
| launchd label | Function | Cadence | Model | Paid API |
|---|---|---|---|---|
| `com.akior.email-triage-local` | Email triage | every 2h | qwen2.5-coder:7b | NO |
| `com.akior.canary-health-local` | Daily health check | daily 06:57 | none | NO |
| `com.akior.weekly-regression-local` | Weekly regression | Sundays 06:00 | none | NO |
| `com.akior.evening-summary-local` | Evening summary | daily 20:00 | qwen2.5-coder:7b | NO |
| `com.akior.morning-briefing-local` | Morning briefing | daily 08:00 | qwen2.5-coder:7b | NO |
| `com.akior.watchdog` | tmux keep-alive | every 300s | none | NO |

## OpenClaw paid cron
0 enabled agentTurn jobs. morning-briefing remains disabled.

## Rollback
```
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.akior.morning-briefing-local.plist
rm ~/Library/LaunchAgents/com.akior.morning-briefing-local.plist
rm ~/akior/scripts/morning-briefing-local.sh
```
