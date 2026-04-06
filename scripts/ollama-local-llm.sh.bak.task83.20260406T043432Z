#!/bin/bash
# ollama-local-llm.sh — local LLM CLI wrapper for AKIOR
# Usage:  ollama-local-llm.sh <model> <prompt>
# Output: JSON only (success OR error), written to stdout
# Contract: 10s connect + generate timeout, POSTs to 127.0.0.1:11434/api/chat
# Policy:   local-only. Never calls paid APIs.

set -u

MODEL="${1:-}"
PROMPT="${2:-}"

if [ -z "$MODEL" ] || [ -z "$PROMPT" ]; then
  printf '{"ok":false,"error":"usage: ollama-local-llm.sh <model> <prompt>"}\n'
  exit 2
fi

# Build JSON body safely via python (avoids shell quoting issues).
BODY=$(MODEL="$MODEL" PROMPT="$PROMPT" python3 -c '
import json, os
print(json.dumps({
  "model": os.environ["MODEL"],
  "stream": False,
  "messages": [{"role": "user", "content": os.environ["PROMPT"]}]
}))
')

RAW=$(curl -sS --max-time 10 \
  -H "Content-Type: application/json" \
  -X POST http://127.0.0.1:11434/api/chat \
  -d "$BODY" 2>&1)
RC=$?

if [ $RC -ne 0 ]; then
  printf '{"ok":false,"error":"ollama_unreachable","rc":%d,"detail":%s}\n' \
    "$RC" "$(printf '%s' "$RAW" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')"
  exit 1
fi

# Extract message content; emit canonical JSON envelope.
printf '%s' "$RAW" | python3 -c '
import sys, json
try:
    d = json.loads(sys.stdin.read())
    msg = (d.get("message") or {}).get("content", "")
    out = {
        "ok": True,
        "model": d.get("model"),
        "content": msg,
        "eval_count": d.get("eval_count"),
        "eval_duration_ns": d.get("eval_duration"),
        "total_duration_ns": d.get("total_duration")
    }
    print(json.dumps(out))
except Exception as e:
    print(json.dumps({"ok": False, "error": "parse_failed", "detail": str(e)}))
    sys.exit(3)
'
