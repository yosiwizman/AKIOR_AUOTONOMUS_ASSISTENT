#!/bin/bash
# ollama-local-llm.sh — AKIOR canonical local LLM entrypoint
#
# Usage:  ollama-local-llm.sh <model> <prompt> [profile]
#
# Profiles (from Task 82 benchmark evidence):
#   FAST_LOCAL  — 10s timeout. For classification, short summary, triage.
#                 (Task 82 categories A/B/C: ≤4.5s observed)
#   DEEP_LOCAL  — 30s timeout. For multi-source briefings, batch analysis.
#                 (Task 82 categories D/E: ≤15s observed)
#
# If profile is omitted, defaults to FAST_LOCAL.
# If prompt exceeds 6000 chars, the JSON output includes
# "routing": "FALLBACK_RECOMMENDED" as a soft signal (still attempts local).
#
# Output: JSON only, written to stdout.
# Policy: LOCAL-ONLY. Never calls paid APIs.
#         Only network target: 127.0.0.1:11434 (local Ollama).

set -u

MODEL="${1:-}"
PROMPT="${2:-}"
PROFILE="${3:-FAST_LOCAL}"

if [ -z "$MODEL" ] || [ -z "$PROMPT" ]; then
  printf '{"ok":false,"error":"usage: ollama-local-llm.sh <model> <prompt> [FAST_LOCAL|DEEP_LOCAL]"}\n'
  exit 2
fi

# --- Profile → timeout ---
case "$PROFILE" in
  FAST_LOCAL)  TIMEOUT=10 ;;
  DEEP_LOCAL)  TIMEOUT=30 ;;
  *)
    printf '{"ok":false,"error":"unknown profile: %s. Use FAST_LOCAL or DEEP_LOCAL."}\n' "$PROFILE"
    exit 2
    ;;
esac

# --- Soft fallback signal for oversized prompts ---
PROMPT_LEN=${#PROMPT}
ROUTING="LOCAL"
if [ "$PROMPT_LEN" -gt 6000 ]; then
  ROUTING="FALLBACK_RECOMMENDED"
fi

# --- Build JSON body safely via python ---
BODY=$(MODEL="$MODEL" PROMPT="$PROMPT" python3 -c '
import json, os
print(json.dumps({
  "model": os.environ["MODEL"],
  "stream": False,
  "messages": [{"role": "user", "content": os.environ["PROMPT"]}]
}))
')

RAW=$(curl -sS --max-time "$TIMEOUT" \
  -H "Content-Type: application/json" \
  -X POST http://127.0.0.1:11434/api/chat \
  -d "$BODY" 2>&1)
RC=$?

if [ $RC -ne 0 ]; then
  printf '{"ok":false,"error":"ollama_unreachable","rc":%d,"profile":"%s","timeout":%d,"routing":"%s","detail":%s}\n' \
    "$RC" "$PROFILE" "$TIMEOUT" "$ROUTING" \
    "$(printf '%s' "$RAW" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')"
  exit 1
fi

# --- Extract message content; emit canonical JSON envelope ---
export AKIOR_LLM_PROFILE="$PROFILE"
export AKIOR_LLM_TIMEOUT="$TIMEOUT"
export AKIOR_LLM_ROUTING="$ROUTING"

printf '%s' "$RAW" | python3 -c '
import sys, json, os
try:
    d = json.loads(sys.stdin.read())
    msg = (d.get("message") or {}).get("content", "")
    out = {
        "ok": True,
        "model": d.get("model"),
        "content": msg,
        "profile": os.environ.get("AKIOR_LLM_PROFILE", "UNKNOWN"),
        "timeout": int(os.environ.get("AKIOR_LLM_TIMEOUT", "10")),
        "routing": os.environ.get("AKIOR_LLM_ROUTING", "LOCAL"),
        "eval_count": d.get("eval_count"),
        "eval_duration_ns": d.get("eval_duration"),
        "total_duration_ns": d.get("total_duration")
    }
    print(json.dumps(out))
except Exception as e:
    print(json.dumps({"ok": False, "error": "parse_failed", "detail": str(e)}))
    sys.exit(3)
'
