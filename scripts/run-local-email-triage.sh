#!/bin/bash
#
# run-local-email-triage.sh — AKIOR Task 17
#
# Local-only autonomous wrapper around unified-triage.js.
# Invoked by launchd agent com.akior.email-triage-local (every 2h).
#
# Policy: no paid API. Only allowed network destinations are:
#   - Yahoo IMAP (via himalaya)
#   - 127.0.0.1:11434 (local Ollama)
#
# Exit codes:
#   0  = success OR another run already in progress (lock held)
#   !0 = hard failure from unified-triage.js
#
# Lockfile: /tmp/akior-email-triage-local.lock (atomic mkdir)
# Log:      ~/akior/evidence/terminal/email-triage-autonomous.log

set -u

RUNNER_NAME="akior-email-triage-local"
LOCKDIR="/tmp/${RUNNER_NAME}.lock"
LOG="${HOME}/akior/evidence/terminal/email-triage-autonomous.log"
TRIAGE_SCRIPT="${HOME}/.openclaw/workspace-dev/skills/akior-email-hub/scripts/unified-triage.js"
NODE_BIN="${HOME}/.nvm/versions/node/v24.13.1/bin/node"

mkdir -p "$(dirname "$LOG")"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

log_line() {
  printf '[%s] %s\n' "$(ts)" "$*" >> "$LOG"
}

# Atomic lock via mkdir (portable, works on macOS without extra tools).
if ! mkdir "$LOCKDIR" 2>/dev/null; then
  log_line "SKIP overlap: lock held at ${LOCKDIR}"
  exit 0
fi
# Store pid for debugging and ensure cleanup on any exit.
echo "$$" > "${LOCKDIR}/pid"
trap 'rm -rf "$LOCKDIR"' EXIT INT TERM

log_line "START pid=$$ runner=${RUNNER_NAME}"

if [ ! -x "$NODE_BIN" ]; then
  # Fallback to PATH lookup if the hardcoded nvm path is missing.
  NODE_BIN=$(command -v node || true)
fi

if [ -z "${NODE_BIN:-}" ] || [ ! -x "$NODE_BIN" ]; then
  log_line "FAIL node binary not found"
  exit 2
fi

if [ ! -f "$TRIAGE_SCRIPT" ]; then
  log_line "FAIL triage script missing: ${TRIAGE_SCRIPT}"
  exit 3
fi

log_line "INVOKE ${NODE_BIN} ${TRIAGE_SCRIPT}"

# Run the triage script; append stdout+stderr into the autonomous log.
# Preserves unified-triage.js's own dated markdown artifact under ~/akior/ledgers/.
"$NODE_BIN" "$TRIAGE_SCRIPT" >> "$LOG" 2>&1
RC=$?

if [ "$RC" -eq 0 ]; then
  log_line "OK exit=0"
else
  log_line "FAIL exit=${RC}"
fi

exit "$RC"
