# Checkpoint — Task 83: Standardize local LLM entrypoint and enforce routing tiers

**Timestamp:** 2026-04-06T04:35Z

## Changes
- `ollama-local-llm.sh`: upgraded to accept optional 3rd arg (FAST_LOCAL|DEEP_LOCAL)
  - FAST_LOCAL: 10s timeout (default, for categories A/B/C)
  - DEEP_LOCAL: 30s timeout (for categories D/E)
  - Adds profile/timeout/routing fields to JSON envelope
  - FALLBACK_RECOMMENDED soft signal for prompts >6000 chars
- `evening-summary-local.sh`: now passes DEEP_LOCAL to wrapper
- `morning-briefing-local.sh`: replaced inline curl with wrapper DEEP_LOCAL call
- `unified-triage.js`: now passes FAST_LOCAL explicitly

## Verification
- FAST_LOCAL: profile=FAST_LOCAL, timeout=10, routing=LOCAL ✓
- DEEP_LOCAL: profile=DEEP_LOCAL, timeout=30, routing=LOCAL ✓
- FALLBACK_RECOMMENDED: routing=FALLBACK_RECOMMENDED for 6611-char prompt ✓
- Zero paid API calls in all proofs

## Backups
- ollama-local-llm.sh.bak.task83.20260406T043432Z
- evening-summary-local.sh.bak.task83.20260406T043432Z
- morning-briefing-local.sh.bak.task83.20260406T043432Z
- unified-triage.js.bak.task83.20260406T043432Z

## Rollback
Restore any .bak.task83.* file over its counterpart.
