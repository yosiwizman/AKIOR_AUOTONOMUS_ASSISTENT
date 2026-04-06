#!/bin/bash
#
# imessage-inbound-responder.sh — AKIOR Task 87
#
# Standalone local-only iMessage inbound responder MVP.
# Polls chat.db for new inbound messages from allowlisted senders,
# classifies intent via ollama-local-llm.sh FAST_LOCAL, generates
# a short reply, and sends via imsg send.
#
# Policy: LOCAL-ONLY. No paid API. No OpenClaw agent.
# Watcher: sqlite3 polling of ~/Library/Messages/chat.db
# Classifier: ollama-local-llm.sh qwen2.5-coder:7b FAST_LOCAL
# Sender: imsg send --to <number> --text "<reply>"
#
# Safety:
#   - allowlist-only (reads from allowlist.txt)
#   - ignores messages from self (is_from_me=0)
#   - ignores empty/null text
#   - tracks last-seen ROWID to prevent reprocessing
#   - max 3 replies per sender per hour (loop prevention)
#   - DRY_RUN=1 prints reply instead of sending
#
# Usage:
#   DRY_RUN=0 bash imessage-inbound-responder.sh          # live mode
#   DRY_RUN=1 bash imessage-inbound-responder.sh          # dry-run mode
#   DRY_RUN=1 SINGLE_PASS=1 bash imessage-inbound-responder.sh  # one-shot test

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ALLOWLIST="${SCRIPT_DIR}/allowlist.txt"
CHATDB="${HOME}/Library/Messages/chat.db"
OLLAMA="${HOME}/akior/scripts/ollama-local-llm.sh"
MODEL="qwen2.5-coder:7b"
STATE_FILE="/tmp/akior-imessage-responder.rowid"
RATE_FILE="/tmp/akior-imessage-responder.rate"
LOG="${HOME}/akior/evidence/terminal/imessage-inbound-responder.log"
POLL_INTERVAL="${POLL_INTERVAL:-5}"
DRY_RUN="${DRY_RUN:-0}"
SINGLE_PASS="${SINGLE_PASS:-0}"
MAX_REPLIES_PER_HOUR=3

mkdir -p "$(dirname "$LOG")"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log_line() { printf '[%s] %s\n' "$(ts)" "$*" | tee -a "$LOG"; }

# --- Allowlist ---
if [ ! -f "$ALLOWLIST" ]; then
  log_line "FAIL allowlist not found at ${ALLOWLIST}"
  exit 2
fi
ALLOWED=$(cat "$ALLOWLIST" | tr -d ' ' | grep -v '^$' | grep -v '^#')
log_line "START pid=$$ allowlist=$(echo "$ALLOWED" | wc -l | tr -d ' ') numbers dry_run=${DRY_RUN}"

# --- State: last-seen ROWID ---
if [ -f "$STATE_FILE" ]; then
  LAST_ROWID=$(cat "$STATE_FILE")
else
  LAST_ROWID=$(sqlite3 "$CHATDB" "SELECT MAX(ROWID) FROM message;" 2>/dev/null || echo "0")
  echo "$LAST_ROWID" > "$STATE_FILE"
  log_line "INIT last_rowid=${LAST_ROWID}"
fi

# --- Rate limiter ---
check_rate() {
  local sender="$1"
  local now_epoch=$(date +%s)
  local cutoff=$((now_epoch - 3600))
  # Rate file: lines of "epoch sender"
  if [ -f "$RATE_FILE" ]; then
    local count=$(awk -v s="$sender" -v c="$cutoff" '$1 >= c && $2 == s' "$RATE_FILE" | wc -l | tr -d ' ')
    if [ "$count" -ge "$MAX_REPLIES_PER_HOUR" ]; then
      return 1  # rate limited
    fi
  fi
  return 0
}

record_reply() {
  local sender="$1"
  echo "$(date +%s) $sender" >> "$RATE_FILE"
  # Prune old entries (>2h)
  if [ -f "$RATE_FILE" ]; then
    local cutoff=$(( $(date +%s) - 7200 ))
    awk -v c="$cutoff" '$1 >= c' "$RATE_FILE" > "${RATE_FILE}.tmp" && mv "${RATE_FILE}.tmp" "$RATE_FILE"
  fi
}

# --- Main poll loop ---
process_cycle() {
  # Query new inbound messages since LAST_ROWID, not from self, with text
  local results
  results=$(sqlite3 "$CHATDB" "
    SELECT m.ROWID, h.id, replace(substr(COALESCE(m.text,''),1,500), char(10), ' ')
    FROM message m
    LEFT JOIN handle h ON m.handle_id = h.ROWID
    WHERE m.ROWID > ${LAST_ROWID}
      AND m.is_from_me = 0
      AND m.text IS NOT NULL
      AND length(m.text) > 0
    ORDER BY m.ROWID ASC
    LIMIT 5;
  " 2>/dev/null)

  if [ -z "$results" ]; then
    return
  fi

  echo "$results" | while IFS='|' read -r rowid sender text; do
    # Skip if sender not in allowlist
    if ! echo "$ALLOWED" | grep -qF "$sender"; then
      log_line "SKIP rowid=${rowid} sender=${sender} reason=not_in_allowlist"
      echo "$rowid" > "$STATE_FILE"
      continue
    fi

    # Skip empty text
    if [ -z "$text" ]; then
      echo "$rowid" > "$STATE_FILE"
      continue
    fi

    # Rate limit check
    if ! check_rate "$sender"; then
      log_line "SKIP rowid=${rowid} sender=${sender} reason=rate_limited (max ${MAX_REPLIES_PER_HOUR}/hr)"
      echo "$rowid" > "$STATE_FILE"
      continue
    fi

    log_line "INBOUND rowid=${rowid} sender=${sender} text=\"$(echo "$text" | head -c 60)\""

    # Classify + generate reply via FAST_LOCAL
    local prompt="You are AKIOR, a helpful AI assistant on a Mac Mini. Someone sent you this iMessage. Reply in 1-2 short, friendly sentences. Do not use emojis. Do not repeat the question back. Just answer helpfully and concisely.

Their message: \"${text}\""

    local llm_result
    llm_result=$("$OLLAMA" "$MODEL" "$prompt" FAST_LOCAL 2>&1)
    local llm_rc=$?

    if [ $llm_rc -ne 0 ]; then
      log_line "FAIL rowid=${rowid} ollama exit=${llm_rc}"
      echo "$rowid" > "$STATE_FILE"
      continue
    fi

    local reply
    reply=$(echo "$llm_result" | python3 -c '
import sys, json
try:
    d = json.loads(sys.stdin.read())
    if d.get("ok"):
        print(d["content"].strip()[:280])
    else:
        print("")
except:
    print("")
' 2>/dev/null)

    if [ -z "$reply" ]; then
      log_line "FAIL rowid=${rowid} empty_reply"
      echo "$rowid" > "$STATE_FILE"
      continue
    fi

    # Send or dry-run
    if [ "$DRY_RUN" = "1" ]; then
      log_line "DRY_RUN rowid=${rowid} sender=${sender} reply=\"${reply}\""
    else
      imsg send --to "$sender" --text "$reply" 2>&1
      local send_rc=$?
      if [ $send_rc -eq 0 ]; then
        log_line "SENT rowid=${rowid} sender=${sender} reply=\"$(echo "$reply" | head -c 60)\""
        record_reply "$sender"
      else
        log_line "FAIL rowid=${rowid} imsg_send exit=${send_rc}"
      fi
    fi

    echo "$rowid" > "$STATE_FILE"
  done
}

# --- Run ---
if [ "$SINGLE_PASS" = "1" ]; then
  process_cycle
  log_line "SINGLE_PASS complete"
else
  log_line "POLL mode interval=${POLL_INTERVAL}s"
  while true; do
    process_cycle
    sleep "$POLL_INTERVAL"
  done
fi
