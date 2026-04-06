# Task 90: iMessage Inbound Responder — launchd Registration

**Date:** 2026-04-06
**Status:** Agent registered and running

## Plist
~/Library/LaunchAgents/com.akior.imessage-responder-local.plist
- Label: com.akior.imessage-responder-local
- RunAtLoad: true
- KeepAlive: true (auto-restart on exit)
- ThrottleInterval: 10s
- DRY_RUN: 0 (live mode)
- plutil: OK

## Runtime evidence
- PID: 33273
- State: running (launchctl print confirms)
- Log: "START pid=33273 allowlist=1 numbers dry_run=0" + "POLL mode interval=5s"
- Process: /bin/bash imessage-inbound-responder.sh (confirmed via pgrep)

## Responder behavior
- Polls chat.db every 5s for new inbound from +17865181777
- Classifies via ollama-local-llm.sh FAST_LOCAL
- Replies via imsg send
- Rate-limited: max 3 replies/sender/hour
- State tracked at /tmp/akior-imessage-responder.rowid

## Live proof
Pending owner action: owner must send a fresh iMessage to the Mac Mini
after this registration. The responder is now continuously running and
will auto-reply within ~5-10s of delivery to chat.db.
