# Task 89: Diagnosis — Failed Live iMessage Inbound Responder Attempt

**Date:** 2026-04-06
**Status:** ROOT CAUSE IDENTIFIED

## Root Cause

**The responder was never running when the owner sent messages.**

The iMessage inbound responder (`imessage-inbound-responder.sh`) is a
standalone script, not a registered daemon. It was built and synthetic-tested
in Task 87 but was explicitly NOT registered as a launchd agent ("Do not
create launchd plists or register this responder as a daemon yet"). When
the owner sent "Hi" and "What can you do" at 02:07 local, no process was
listening for new messages.

## Evidence Chain

### 1. Allowlist: CORRECT
```
+17865181777
```

### 2. State file: CORRECT (at ROWID 641180 from synthetic test)
The two fresh messages (641183, 641185) are AFTER 641180 and would be
picked up on the next run.

### 3. Fresh inbound messages: PRESENT in chat.db
```
641183 | 2026-04-06 02:07:12 | is_from_me=0 | +17865181777 | "Hi"
641185 | 2026-04-06 02:07:31 | is_from_me=0 | +17865181777 | "What can you do"
```
Both are inbound (is_from_me=0), from the allowlisted sender, with text.

### 4. Diagnostic DRY_RUN: PIPELINE WORKS
```
INBOUND rowid=641183 → "Hello! How can I assist you today?" (1s)
INBOUND rowid=641185 → "I can answer questions, provide information..." (1s)
```
Both messages correctly detected, classified via FAST_LOCAL, replies generated.

### 5. Blocking point classification
**Category: (6) other evidenced blocker — responder not running as a daemon**

The responder script works correctly when invoked. The failure is that
nothing invokes it continuously. It needs either:
(a) launchd registration for continuous polling, or
(b) manual execution in a terminal session

## Single Blocker
The iMessage inbound responder is not registered as a launchd agent.
It must be running to process incoming messages.

## Recommended Fix
Register `com.akior.imessage-responder-local` as a launchd agent with
KeepAlive=true (or StartInterval for polling) so the responder runs
continuously. This was explicitly deferred in Task 87 and is the
natural next engineering step.
