# Checkpoint: Fix iMessage/WhatsApp Duplicate Messages
Date: 2026-04-03
Action: Disabled bluebubbles plugin in openclaw.json

## Root Cause
Both `bluebubbles` and `imessage` plugins were enabled simultaneously.
BlueBubbles is an iMessage bridge -- with both enabled, inbound iMessage 
messages were processed by BOTH plugins, causing the agent to generate 
duplicate replies that leaked across channels (iMessage + WhatsApp).

The Phase 6 fix (`session.dmScope: "per-channel-peer"`) correctly isolates 
sessions per channel+peer, but does NOT prevent two plugins from both 
ingesting the same inbound message and triggering separate agent turns.

## What Changed
- `plugins.entries.bluebubbles.enabled`: true -> false
- Gateway restarted

## Verification
- `openclaw channels list` now shows only WhatsApp + iMessage (BlueBubbles removed)
- `openclaw health` reports healthy
- Config backed up to openclaw.json.bak.fix-duplicate-*
