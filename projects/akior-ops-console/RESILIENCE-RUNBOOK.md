# AKIOR Resilience Runbook

## What Auto-Starts Now

| Service | Mechanism | Behavior |
|---------|-----------|----------|
| tmux session "akior" | com.akior.watchdog (launchd) | Checks every 300s. Creates session if absent. Logs to action ledger. |
| Ops Console (localhost:8420) | com.akior.ops-console (launchd) | Starts on boot. KeepAlive = true (restarts if process dies). |

Both are launchd agents in ~/Library/LaunchAgents/ and survive reboots.

## How Watchdog Recovery Works

1. launchd runs ~/akior/config/hooks/akior-tmux-watchdog.sh every 5 minutes
2. Script checks: `tmux has-session -t akior`
3. If session missing: creates it and logs "session created" to action ledger
4. If session alive: logs "session alive" to action ledger

## How Ops Console Recovery Works

1. launchd keeps the Python server process alive (KeepAlive = true)
2. If the process crashes, launchd restarts it automatically
3. Health canary (ops-console-check.sh) provides manual verification:
   - Checks HTTP 200 from localhost:8420
   - If fail: attempts launchd unload/load cycle
   - Logs result to action ledger

## How to Verify tmux Is Alive

```bash
tmux has-session -t akior && echo "ALIVE" || echo "DOWN"
```

## How to Verify Ops Console Is Alive

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8420/
# Should return: 200
```

Or open http://localhost:8420 in any browser.

## How Morning Resume Status Is Checked

```bash
~/akior/config/canary/morning-resume-check.sh
```

Writes to: ~/akior/evidence/terminal/morning-resume-status-latest.md

Shows: bootstrap status, resume queue, service health (tmux, ops console, ollama, docker), recovery recommendation.

## What to Do If Claude Desktop Is Down

1. **Verify local runtime is healthy:**
   ```bash
   ~/akior/config/canary/morning-resume-check.sh
   cat ~/akior/evidence/terminal/morning-resume-status-latest.md
   ```

2. **Check Ops Console for pipeline status:**
   Open http://localhost:8420 — shows SSOT integrity, contact pipeline, ledger tails, evidence files.

3. **Run canaries manually:**
   ```bash
   ~/akior/config/canary/run-daily-canaries.sh
   ~/akior/config/canary/ops-console-check.sh
   ```

4. **Check customer pipeline:**
   ```bash
   cat ~/akior/evidence/terminal/livepilates-postsend-monitor-01.md
   ```

5. **If Wix replies arrived (visible in Gmail notifications):**
   - Note the contact name and timestamp
   - Prepare reply using the appropriate playbook file
   - Wait for Claude Desktop / Cowork to come back to execute via Wix Inbox

6. **If Claude Desktop remains down for extended period:**
   - Claude Code CLI remains fully operational for file work, ledgers, and planning
   - Ops Console provides visibility at localhost:8420
   - Wix sends require browser session — queue replies locally until browser access returns

## Launchd Agent Management

```bash
# List loaded AKIOR agents
launchctl list | grep akior

# Reload watchdog
launchctl unload ~/Library/LaunchAgents/com.akior.watchdog.plist
launchctl load ~/Library/LaunchAgents/com.akior.watchdog.plist

# Reload ops console
launchctl unload ~/Library/LaunchAgents/com.akior.ops-console.plist
launchctl load ~/Library/LaunchAgents/com.akior.ops-console.plist
```
