# AKIOR iMessage Inbound Responder MVP

**Created:** Task 87 (2026-04-06)
**Policy:** LOCAL-ONLY. No paid API. No OpenClaw agent.

## Architecture
- **Watcher:** sqlite3 polling of `~/Library/Messages/chat.db` (5s interval)
- **Classifier/Generator:** `~/akior/scripts/ollama-local-llm.sh` qwen2.5-coder:7b FAST_LOCAL (10s)
- **Sender:** `imsg send --to <number> --text "<reply>"`

## Usage
```bash
# Dry-run mode (prints replies, does not send)
DRY_RUN=1 bash imessage-inbound-responder.sh

# Single-pass dry-run (process once, exit)
DRY_RUN=1 SINGLE_PASS=1 bash imessage-inbound-responder.sh

# Live mode (polls continuously, sends replies)
DRY_RUN=0 bash imessage-inbound-responder.sh
```

## Safety
- Allowlist-only (`allowlist.txt`, one number per line)
- Ignores self-sent messages (`is_from_me = 0`)
- Ignores empty/null text
- Max 3 replies per sender per hour (rate limiter)
- ROWID tracking prevents reprocessing
- DRY_RUN mode for safe testing

## Files
- `imessage-inbound-responder.sh` — main script
- `allowlist.txt` — allowed phone numbers (one per line)
- `test-fixture.txt` — sample inbound text for testing
- `README.md` — this file

## Log
`~/akior/evidence/terminal/imessage-inbound-responder.log`

## State
- `/tmp/akior-imessage-responder.rowid` — last-processed message ROWID
- `/tmp/akior-imessage-responder.rate` — reply rate tracking

## Not yet implemented
- launchd registration (will be a separate task)
- `imsg watch` streaming mode (upgrade path from polling)
- Multi-turn conversation context
