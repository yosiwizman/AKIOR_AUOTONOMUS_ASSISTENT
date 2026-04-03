#!/bin/bash
# AKIOR Daily Canary Runner
# Executes all canary checks and writes summary

SUMMARY_FILE=~/akior/evidence/terminal/daily-canary-summary.md
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=""

run_canary() {
  local name="$1"
  local script="$2"
  local result
  result=$("$script" 2>&1)
  local exit_code=$?
  if [ $exit_code -eq 0 ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    RESULTS="${RESULTS}| ${name} | PASS | ${result} |\n"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    RESULTS="${RESULTS}| ${name} | FAIL | ${result} |\n"
  fi
}

run_canary "Filesystem" ~/akior/config/canary/filesystem-health.sh
run_canary "Ollama" ~/akior/config/canary/ollama-health.sh
run_canary "GitHub" ~/akior/config/canary/github-health.sh
run_canary "Gmail" ~/akior/config/canary/gmail-health.sh

TOTAL=$((PASS_COUNT + FAIL_COUNT))

cat > "$SUMMARY_FILE" <<EOF
# Daily Canary Summary

**Run timestamp:** $TIMESTAMP
**Result:** $PASS_COUNT/$TOTAL passed

| Canary | Status | Detail |
|--------|--------|--------|
$(echo -e "$RESULTS")

## Classification
EOF

if [ $FAIL_COUNT -eq 0 ]; then
  echo "All systems nominal." >> "$SUMMARY_FILE"
else
  echo "$FAIL_COUNT canary(ies) failed. Review action ledger for details." >> "$SUMMARY_FILE"
fi

echo "Canary run complete: $PASS_COUNT/$TOTAL passed"
exit $FAIL_COUNT
