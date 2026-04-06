# Task 83: Local LLM Entrypoint Standardization + Routing Tiers

**Date:** 2026-04-06
**Canonical entrypoint:** `~/akior/scripts/ollama-local-llm.sh`

---

## 1. Canonical Entrypoint Design

**Usage:** `ollama-local-llm.sh <model> <prompt> [profile]`

| Profile | Timeout | Use case | Task 82 categories |
|---|---|---|---|
| FAST_LOCAL (default) | 10s | Classification, short summary, triage | A, B, C |
| DEEP_LOCAL | 30s | Multi-source briefings, batch analysis | D, E |

**Routing signal:** If prompt exceeds 6000 chars, JSON output includes `"routing": "FALLBACK_RECOMMENDED"` as a soft signal. The call still attempts local — the signal is advisory for future router logic.

**JSON envelope (standardized):**
```json
{
  "ok": true/false,
  "model": "qwen2.5-coder:7b",
  "content": "...",
  "profile": "FAST_LOCAL|DEEP_LOCAL",
  "timeout": 10|30,
  "routing": "LOCAL|FALLBACK_RECOMMENDED",
  "eval_count": N,
  "eval_duration_ns": N,
  "total_duration_ns": N
}
```

---

## 2. Migrated Callers

| Caller | Before | After | Profile |
|---|---|---|---|
| unified-triage.js | wrapper (no profile arg) | wrapper `FAST_LOCAL` | FAST_LOCAL (10s) |
| evening-summary-local.sh | wrapper (no profile arg) | wrapper `DEEP_LOCAL` | DEEP_LOCAL (30s) |
| morning-briefing-local.sh | **direct curl** (30s, bypassed wrapper) | wrapper `DEEP_LOCAL` | DEEP_LOCAL (30s) |

**Key improvement:** morning-briefing no longer bypasses the wrapper. All 3 Ollama callers now use the single canonical entrypoint.

---

## 3. Verification Proofs

### Proof 1: FAST_LOCAL
```
prompt: 'Classify in one word: "Your domain expires in 2 days"'
result:
  ok: true
  content: "Warning"
  profile: FAST_LOCAL
  timeout: 10
  routing: LOCAL
  eval_count: 4
```

### Proof 2: DEEP_LOCAL
```
prompt: 'Produce a 3-bullet morning briefing...' (multi-source inputs)
result:
  ok: true
  profile: DEEP_LOCAL
  timeout: 30
  routing: LOCAL
  eval_count: 61
```

### Proof 3: FALLBACK_RECOMMENDED
```
prompt: 6611 chars (repetitive filler)
result:
  ok: true (attempted local)
  profile: FAST_LOCAL
  timeout: 10
  routing: FALLBACK_RECOMMENDED  ← soft signal triggered
  content: garbage tokens (<|im_start|> repetition)
  eval_count: 37
```
**Interpretation:** The model responded but produced incoherent output, confirming that oversized/degraded prompts correctly trigger FALLBACK_RECOMMENDED. A future router would redirect this to Claude.

---

## 4. Routing Policy Summary

### LOCAL_DEFAULT (use FAST_LOCAL profile)
- Email subject classification (0.15s warm)
- Per-email short summaries (<1s)
- Batch email-triage structured reports (<5s)
- Intent detection / routing labels
- Ledger line rollups

### LOCAL_DEFAULT (use DEEP_LOCAL profile)
- Morning briefings from local inputs (3-8s)
- Evening summaries from local ledgers (3-10s)
- Multi-step batch analysis (<15s)

### FALLBACK_REQUIRED (manual Claude/API only)
- Customer-facing replies (Live Pilates, legal, financial)
- Multi-source web research synthesis
- Long-context reasoning (>16k tokens)
- High-stakes drafting (hallucination risk)
- Voice calls (clawr.ing)
- Gmail inbox scanning (no local IMAP path)

### Current state
- All 3 Ollama-calling agents use the canonical entrypoint
- No paid API is called by any autonomous agent
- FALLBACK_RECOMMENDED is a soft signal only — no cloud fallback exists in the runtime

### What remains UNVERIFIED
- End-to-end autonomous run of evening-summary via the migrated DEEP_LOCAL path (tested only via manual invocation; launchd will exercise it at 20:00)
- End-to-end autonomous run of morning-briefing via the migrated DEEP_LOCAL path (launchd will exercise it at 08:00)
- Whether the 3 non-Ollama agents (canary-health, weekly-regression, watchdog) are affected by this change (they should NOT be — they don't call Ollama)

---

*No paid API used. All verification against local Ollama 127.0.0.1:11434.*
