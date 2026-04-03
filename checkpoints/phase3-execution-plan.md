# Phase 3 Deferred Execution Plan

**Created:** 2026-04-01T02:27Z
**Window:** Next 48 hours (by 2026-04-03T02:27Z)
**Status:** PLANNED — do not execute until owner authorizes Phase 3 start

## Execution Order (recommended)

| Priority | Task | Est. Duration | Dependencies | Risk |
|----------|------|---------------|--------------|------|
| 1 | Ollama sustained-load test | 30 min | Ollama operational | Low — local only, no external side effects |
| 2 | Full Golden Task subset (GT-1 thru GT-3) | 1 hour | Connectors operational | Low — read-only tasks first |
| 3 | iMessage Channel test | 15 min | Claude Desktop UI config by owner | Low — single test message |
| 4 | Computer Use validation | 30 min | Claude Desktop UI | Medium — screen interaction |
| 5 | Wix login test | 15 min | Computer Use working, Wix credentials | Medium — external service auth |
| 6 | App Pack smoke tests (Instagram, Canva, QuickBooks) | 1 hour | Computer Use, credentials | Medium — multiple external services |
| 7 | Full Golden Task Suite (GT-4 thru GT-8) | 2 hours | Prior tasks passing | Medium — includes outbound actions |
| 8 | Weekly regression bootstrap | 30 min | All above complete | Low — creates recurring validation |

## Rationale for Order

1. **Ollama load test first** — purely local, validates sustained inference before relying on it for downstream tasks.
2. **Golden Tasks GT-1–GT-3 next** — validates read-only connector paths (email triage, calendar review, code review) without outbound risk.
3. **iMessage/Computer Use** — requires owner to enable in Claude Desktop Settings first. These are gated on owner action.
4. **Wix/App Packs** — depend on Computer Use working. Higher blast radius (external service logins).
5. **GT-4–GT-8** — includes outbound actions (email replies, PR creation, deployments). Run after read-only paths are validated.
6. **Weekly regression last** — codifies all the above into a recurring check. Only meaningful after individual tests are baselined.

## Owner Actions Required Before Execution

- [ ] Enable iMessage channel in Claude Desktop (if available)
- [ ] Enable Computer Use in Claude Desktop (if available)
- [ ] Provide or confirm Wix credentials are accessible
- [ ] Confirm Instagram/Canva/QuickBooks credentials are accessible
- [ ] Authorize Phase 3 start
