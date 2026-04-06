# Task 87: Local iMessage Inbound Responder MVP

**Date:** 2026-04-06
**Status:** MVP built and synthetic-tested; live proof requires OWNER ACTION

## Watcher Surface Choice
**Chosen:** sqlite3 polling of chat.db (5s interval)
**Reason:** imsg watch is present and supports --participants/--since-rowid, but its output format could not be confirmed (no inbound arrived during test). chat.db sqlite3 queries are proven readable with known schema. imsg watch is an upgrade path for a future task.

## Canonical LLM Path
ollama-local-llm.sh qwen2.5-coder:7b FAST_LOCAL (10s timeout)

## Send Path
imsg send --to <number> --text "<reply>" (confirmed working in Task 85)

## Synthetic End-to-End Test
- Seeded state to ROWID 641179 (one before Task 85 test message)
- Ran SINGLE_PASS DRY_RUN
- Result:
  - INBOUND detected: rowid=641180, sender=+17865181777
  - FAST_LOCAL classification+reply: 2s
  - DRY_RUN reply: "Hello! I'm AKIOR, your helpful AI assistant on a Mac Mini. How can I assist you today?"
- Full pipeline: detect → allowlist check → FAST_LOCAL Ollama → reply generation → DRY_RUN output

## Live Proof
**OWNER ACTION NEEDED:** No real inbound iMessage arrived during this session. Owner must send a test message to the Mac Mini's iMessage, then run:
```
DRY_RUN=0 SINGLE_PASS=1 bash ~/akior/runtime/imessage-inbound/imessage-inbound-responder.sh
```
to verify a real live reply is sent.

## Files Created
- ~/akior/runtime/imessage-inbound/imessage-inbound-responder.sh (5901 bytes, executable)
- ~/akior/runtime/imessage-inbound/allowlist.txt (+17865181777)
- ~/akior/runtime/imessage-inbound/test-fixture.txt
- ~/akior/runtime/imessage-inbound/README.md

## No Paid API
- Script calls only ollama-local-llm.sh → 127.0.0.1:11434
- Send via imsg (local CLI)
- No OpenClaw, Anthropic, OpenAI, Groq, or cloud model referenced
