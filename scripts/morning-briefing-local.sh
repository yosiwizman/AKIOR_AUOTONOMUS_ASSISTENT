#!/bin/bash
#
# morning-briefing-local.sh — AKIOR Task 81
#
# Local-only morning briefing via Ollama. Reads today's calendar events
# (macOS Calendar SQLite DB), latest email-triage report, canary summary,
# morning resume status, previous evening summary, and today's ledger
# entries. Sends a compact prompt to qwen2.5-coder:7b for synthesis.
# Writes a structured markdown briefing.
#
# Policy: LOCAL-ONLY. No paid API (Anthropic, OpenAI, Groq, etc.).
# Only network target: 127.0.0.1:11434 (local Ollama).
#
# Invoked by launchd agent com.akior.morning-briefing-local (daily 08:00).

set -u

LOCKDIR="/tmp/akior-morning-briefing-local.lock"
LOG="${HOME}/akior/evidence/terminal/morning-briefing-autonomous.log"
OUTPUT="${HOME}/akior/evidence/terminal/daily-briefing-latest.md"
OLLAMA="${HOME}/akior/scripts/ollama-local-llm.sh"
MODEL="qwen2.5-coder:7b"
ACTION_LEDGER="${HOME}/akior/ledgers/action.md"
DECISION_LEDGER="${HOME}/akior/ledgers/decision.md"
CALDB="${HOME}/Library/Group Containers/group.com.apple.calendar/Calendar.sqlitedb"
TRIAGE_DIR="${HOME}/akior/ledgers"
CANARY="${HOME}/akior/evidence/terminal/daily-canary-summary.md"
RESUME="${HOME}/akior/evidence/terminal/morning-resume-status-latest.md"
EVENING="${HOME}/akior/evidence/terminal/evening-summary-latest.md"

TODAY=$(date +"%Y-%m-%d")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

mkdir -p "$(dirname "$LOG")" "$(dirname "$OUTPUT")"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log_line() { printf '[%s] %s\n' "$(ts)" "$*" >> "$LOG"; }

# --- Lockfile ---
if ! mkdir "$LOCKDIR" 2>/dev/null; then
  log_line "SKIP overlap: lock held at ${LOCKDIR}"
  exit 0
fi
echo "$$" > "${LOCKDIR}/pid"
trap 'rm -rf "$LOCKDIR"' EXIT INT TERM

log_line "START pid=$$ morning-briefing-local"

# --- 1. Calendar events (macOS Calendar SQLite DB) ---
CAL_EVENTS=""
CAL_COUNT=0
if [ -f "$CALDB" ]; then
  # CoreData epoch: seconds since 2001-01-01 00:00:00 UTC
  TODAY_START=$(python3 -c "from datetime import datetime; print(int((datetime.utcnow().replace(hour=0,minute=0,second=0) - datetime(2001,1,1)).total_seconds()))")
  TODAY_END=$((TODAY_START + 86400))

  # Query both CalendarItem (one-off events) and OccurrenceCache (recurring)
  CAL_EVENTS=$(sqlite3 "$CALDB" "
    SELECT COALESCE(ci.summary,'(no title)') || ' | ' ||
           CASE WHEN ci.all_day = 1 THEN 'all-day'
                ELSE strftime('%H:%M', ci.start_date + 978307200, 'unixepoch', 'localtime')
                     || '-' || strftime('%H:%M', ci.end_date + 978307200, 'unixepoch', 'localtime')
           END || ' | ' || COALESCE(c.title,'')
    FROM CalendarItem ci
    LEFT JOIN Calendar c ON ci.calendar_id = c.ROWID
    WHERE ci.start_date >= $TODAY_START AND ci.start_date < $TODAY_END
    UNION
    SELECT COALESCE(ci.summary,'(no title)') || ' | ' ||
           CASE WHEN ci.all_day = 1 THEN 'all-day'
                ELSE strftime('%H:%M', oc.occurrence_start_date + 978307200, 'unixepoch', 'localtime')
                     || '-' || strftime('%H:%M', oc.occurrence_end_date + 978307200, 'unixepoch', 'localtime')
           END || ' | ' || COALESCE(c.title,'')
    FROM OccurrenceCache oc
    JOIN CalendarItem ci ON oc.event_id = ci.ROWID
    LEFT JOIN Calendar c ON oc.calendar_id = c.ROWID
    WHERE oc.occurrence_start_date >= $TODAY_START AND oc.occurrence_start_date < $TODAY_END
    ORDER BY 1
    LIMIT 25;
  " 2>/dev/null)
  CAL_COUNT=$(echo "$CAL_EVENTS" | grep -c "." || true)
  log_line "CALENDAR ${CAL_COUNT} events from SQLite"
else
  CAL_EVENTS="Calendar database not found at ${CALDB}"
  log_line "CALENDAR db not found"
fi

# --- 2. Latest email-triage report ---
TRIAGE_FILE=$(ls -t "${TRIAGE_DIR}"/email-triage-*.md 2>/dev/null | head -1)
TRIAGE_CONTENT=""
if [ -n "$TRIAGE_FILE" ]; then
  TRIAGE_CONTENT=$(head -30 "$TRIAGE_FILE")
  log_line "TRIAGE from ${TRIAGE_FILE}"
else
  TRIAGE_CONTENT="No email-triage report found."
  log_line "TRIAGE none found"
fi

# --- 3. Canary summary ---
CANARY_CONTENT=""
if [ -f "$CANARY" ]; then
  CANARY_CONTENT=$(cat "$CANARY")
else
  CANARY_CONTENT="No canary summary available."
fi

# --- 4. Morning resume status ---
RESUME_CONTENT=""
if [ -f "$RESUME" ]; then
  RESUME_CONTENT=$(cat "$RESUME")
else
  RESUME_CONTENT="No morning resume status available."
fi

# --- 5. Previous evening summary (first 30 lines) ---
EVENING_CONTENT=""
if [ -f "$EVENING" ]; then
  EVENING_CONTENT=$(head -30 "$EVENING")
else
  EVENING_CONTENT="No previous evening summary."
fi

# --- 6. Today's ledger lines (action + decision, filtered) ---
ACTION_TODAY=$(grep "$TODAY" "$ACTION_LEDGER" 2>/dev/null | grep -v "TMUX_WATCHDOG" | tail -20 || true)
ACTION_WD_COUNT=$(grep "$TODAY" "$ACTION_LEDGER" 2>/dev/null | grep -c "TMUX_WATCHDOG" || true)
DECISION_TODAY=$(grep "$TODAY" "$DECISION_LEDGER" 2>/dev/null | head -10 || true)

log_line "DATA cal=${CAL_COUNT} triage=$([ -n "$TRIAGE_FILE" ] && echo found || echo none) canary=$([ -f "$CANARY" ] && echo ok || echo missing) resume=$([ -f "$RESUME" ] && echo ok || echo missing)"

# --- 7. Build prompt ---
PROMPT_INPUT="Today is ${TODAY}.

CALENDAR (${CAL_COUNT} events):
$([ "$CAL_COUNT" -gt 0 ] && echo "$CAL_EVENTS" || echo "No events scheduled today.")

EMAIL TRIAGE (latest report):
${TRIAGE_CONTENT}

CANARY HEALTH:
${CANARY_CONTENT}

SYSTEM STATUS:
${RESUME_CONTENT}

YESTERDAY'S EVENING SUMMARY:
${EVENING_CONTENT}

TODAY'S ACTIONS SO FAR (${ACTION_WD_COUNT} watchdog heartbeats filtered):
$([ -n "$ACTION_TODAY" ] && echo "$ACTION_TODAY" || echo "None yet.")

TODAY'S DECISIONS:
$([ -n "$DECISION_TODAY" ] && echo "$DECISION_TODAY" || echo "None yet.")"

# Cap input
PROMPT_INPUT=$(echo "$PROMPT_INPUT" | head -120 | cut -c1-6000)

PROMPT="You are AKIOR's local morning briefing generator. Produce a concise daily briefing in markdown with these sections:
## Today's Schedule
## Email Priority
## System Health
## Top 3 Priorities
## Carry-Forward from Yesterday

Be brief and actionable. One to four bullet points per section. If a section has no data, write 'Nothing scheduled.' or 'All clear.' Do not invent information.

${PROMPT_INPUT}"

# --- 8. Call local Ollama (direct, 30s timeout for longer prompt) ---
log_line "INVOKE ollama model=${MODEL}"

BODY=$(MODEL="$MODEL" PROMPT="$PROMPT" python3 -c '
import json, os
print(json.dumps({
  "model": os.environ["MODEL"],
  "stream": False,
  "messages": [{"role": "user", "content": os.environ["PROMPT"]}]
}))
')

RAW_RESULT=$(curl -sS --max-time 30 \
  -H "Content-Type: application/json" \
  -X POST http://127.0.0.1:11434/api/chat \
  -d "$BODY" 2>&1)
RC=$?

if [ $RC -ne 0 ]; then
  log_line "FAIL ollama curl exit=${RC}"
  exit $RC
fi

SUMMARY=$(echo "$RAW_RESULT" | python3 -c '
import sys, json
try:
    d = json.loads(sys.stdin.read())
    msg = (d.get("message") or {}).get("content", "")
    if msg:
        print(msg)
    else:
        print("ERROR: empty response")
        sys.exit(1)
except Exception as e:
    print("PARSE ERROR: " + str(e))
    sys.exit(1)
' 2>&1)
PARSE_RC=$?

if [ $PARSE_RC -ne 0 ]; then
  log_line "FAIL parse error: ${SUMMARY}"
  exit 3
fi

# --- 9. Write output ---
cat > "$OUTPUT" <<EOF
# AKIOR Morning Briefing

**Date:** ${TODAY}
**Generated:** ${TIMESTAMP}
**Mode:** LOCAL-ONLY (qwen2.5-coder:7b via Ollama)
**Sources:** Calendar SQLite (${CAL_COUNT} events) · email-triage · canary · resume · evening-summary · ledgers

---

${SUMMARY}

---
*Generated by morning-briefing-local.sh — no paid API used*
EOF

echo "| ${TIMESTAMP} | MORNING_BRIEFING_LOCAL | COMPLETE — written to ${OUTPUT} |" >> "$ACTION_LEDGER"

log_line "OK output=${OUTPUT}"
exit 0
