# Task 91: Diagnosis — Failed Live iMessage After Task 90

**Date:** 2026-04-06
**Root cause:** macOS TCC (Full Disk Access) denies chat.db read from launchd agent

## Root Cause Classification
**NO_INBOUND_DETECTED** — caused by TCC authorization denial

## Evidence Chain

### 1. Daemon running correctly
- PID 50513, state=running, KeepAlive=true, DRY_RUN=0
- Poll loop cycling (sleep 5 child visible)
- Produced START + POLL log lines, zero INBOUND lines

### 2. Owner messages present in chat.db
```
641189 | 2026-04-06 02:07:12 | is_from_me=0 | +17865181777 | "Hi"
641191 | 2026-04-06 02:07:31 | is_from_me=0 | +17865181777 | "What can you do"
```
Both after state ROWID 641185, from allowlisted sender.

### 3. Manual runs work (Terminal has FDA)
- SINGLE_PASS DRY_RUN: detected both messages, generated replies in 1s each
- Direct sqlite3 query: returns 2 rows, exit 0

### 4. Definitive TCC probe (launchd agent context)
```
test_db: rc=0 result='hello'                    ← non-protected DB works
chat_db: rc=1 result='Error: unable to open     ← TCC BLOCKS
  database ".../chat.db": authorization denied'
```
This proves: /bin/bash running as a launchd agent CANNOT read
~/Library/Messages/chat.db due to macOS TCC (Full Disk Access) policy.

### 5. Why the error was invisible
The responder's sqlite3 call uses `2>/dev/null`, which suppresses the
"authorization denied" error. The query returns empty, process_cycle()
sees `[ -z "$results" ]` and silently returns.

## Fix Options
1. **OWNER ACTION:** Grant Full Disk Access to `/bin/bash` in System Settings >
   Privacy & Security > Full Disk Access. Risk: broad permission for all bash scripts.
2. **OWNER ACTION:** Grant FDA to a specific wrapper binary (e.g., a compiled helper)
   that reads chat.db and pipes to the responder.
3. **ARCHITECTURE:** Switch from sqlite3 polling to `imsg watch`, which may already
   have FDA as a Homebrew-installed binary (UNVERIFIED).
4. **ARCHITECTURE:** Use `imsg history --chat-id 44 --limit 5` as the poller instead
   of direct sqlite3 (imsg may have its own TCC grant or use a different access path).

## Recommended Next Step
Try option 4 first: replace the sqlite3 query in process_cycle() with
`imsg history --chat-id 44 --limit 5` output parsing. If `imsg` can read
chat.db from the launchd context (it's a compiled binary, not bash), this
avoids the FDA grant entirely. If that also fails, owner must grant FDA.
