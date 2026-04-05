# Checkpoint — Task 15: Local-only pivot patch

**Timestamp (UTC):** 2026-04-05T20:42Z
**Author:** Claude Code (on behalf of owner)
**Irreversible action flagged:** OpenClaw gateway restart after config mutation
**Backup:** `~/.openclaw/openclaw.json.bak.task15.20260405T204210Z`

## Intent
Convert the unattended AKIOR/OpenClaw runtime from local-first-with-Claude-escalation
into **local-only-by-default**. Any remaining Claude API access is fenced to
manual owner-invoked sessions (Claude Desktop, Claude Code, or a manual
`openclaw` CLI invocation).

## Verified config mutations (all on pre-existing keys)
- `channels.whatsapp.enabled`: true → false
- `channels.whatsapp.debounceMs`: 0 → 10000
- `channels.whatsapp.accounts.default.enabled`: true → false
- `channels.whatsapp.accounts.default.debounceMs`: 0 → 10000
- `channels.imessage.enabled`: true → false
- `channels.imessage.accounts.default.enabled`: true → false
- `agents.defaults.heartbeat.every`: "30m" → "24h"
- `plugins.entries.llm-task.enabled`: true → false
- `plugins.entries.groq.enabled`: true → false
- `plugins.entries.elevenlabs.enabled`: true → false
- `plugins.entries.deepgram.enabled`: true → false

## Additive mutation (structural mirror of proven whisper-cpp-base pattern)
- `tools.llm.text` added with two local CLI models:
  - `qwen2.5-coder:7b` (default workhorse, 15s timeout)
  - `llama3.1:latest` (escalation for long-context, 30s timeout)
- Both shell out to `~/akior/scripts/ollama-local-llm.sh`
- Schema is a structural mirror of `tools.media.audio → whisper-cpp-base`.
  Whether OpenClaw's runtime consumes `tools.llm.text` is UNVERIFIED; the
  wrapper script is independently callable via `exec` from any skill regardless.

## NOT mutated (intentionally preserved)
- `agents.defaults.model.primary` remains `anthropic/claude-sonnet-4-20250514`.
  Rationale: this is the brain config used by any *manually* started agent
  session. All autonomous consumers that would have fired it (channels,
  heartbeat-at-30m, llm-task plugin) are disabled above. Manual OpenClaw CLI
  sessions can still reach Sonnet 4 on owner-initiated action.
- `auth.profiles["anthropic:manual"]` preserved (name already signals manual).
- Claude Desktop / Claude Code are not affected — they use the Claude Max plan
  through their own bridges, not the OpenClaw gateway.

## Rollback
```
cp ~/.openclaw/openclaw.json.bak.task15.20260405T204210Z ~/.openclaw/openclaw.json
launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway
```

## Restart command used
```
launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway
```
