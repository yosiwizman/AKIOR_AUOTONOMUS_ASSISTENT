# Task 92: imsg TCC Probe Under launchd Context

**Date:** 2026-04-06
**Result:** IMSG_LAUNCHD_READ_FAILS

## Probe Design
Temporary launchd agent ran three tests:
1. `imsg chats` (compiled Mach-O Swift binary via libsqlite3)
2. `imsg history --chat-id 44 --limit 3`
3. Direct `sqlite3` (control test)

## Results
```
imsg chats:    permissionDenied(path: ".../chat.db", underlying: authorization denied (code: 23))  rc=1
imsg history:  permissionDenied(path: ".../chat.db", underlying: authorization denied (code: 23))  rc=1
sqlite3:       Error: unable to open database "...chat.db": authorization denied                   rc=1
```

All three methods fail with the same TCC authorization denial (error code 23).

## Why imsg also fails
Despite being a compiled Mach-O arm64 binary (not bash), `imsg` uses
`libsqlite3.dylib` to open `~/Library/Messages/chat.db` directly. macOS
TCC enforces Full Disk Access at the file-system level regardless of
whether the caller is bash, sqlite3, or a compiled Swift binary. The
binary's code signing identity does not have an FDA grant.

## Conclusion
No available binary on this Mac Mini can read chat.db from a launchd agent
context without an explicit Full Disk Access grant in System Settings.

## Fix options (unchanged from Task 91)
1. **OWNER ACTION:** Grant FDA to either `/bin/bash` or the imsg binary
   in System Settings > Privacy & Security > Full Disk Access
2. **ARCHITECTURE:** Use AppleScript/osascript via Messages.app
   ScriptingBridge as the read path (may bypass TCC, UNVERIFIED)
3. **ARCHITECTURE:** Use an Automator/Shortcuts workflow as the
   intermediary (may have different TCC context, UNVERIFIED)
