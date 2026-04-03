#!/bin/bash
# AKIOR Canary: Filesystem integrity check
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ERRORS=0

# Check critical paths
for path in ~/akior/CLAUDE.md ~/akior/.claude/settings.json ~/akior/ledgers/action.md ~/akior/ledgers/tool.md ~/akior/ledgers/financial.md ~/akior/ledgers/deployment.md ~/akior/ledgers/decision.md; do
  if [ ! -f "$path" ]; then
    ERRORS=$((ERRORS + 1))
  fi
done

# Check critical directories
for dir in ~/akior/evidence/screenshots ~/akior/evidence/terminal ~/akior/config/hooks ~/akior/config/canary ~/akior/checkpoints; do
  if [ ! -d "$dir" ]; then
    ERRORS=$((ERRORS + 1))
  fi
done

# Check hook executability
for script in ~/akior/config/hooks/post-action-ledger.sh ~/akior/config/hooks/checkpoint.sh; do
  if [ ! -x "$script" ]; then
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "| $TIMESTAMP | CANARY_FILESYSTEM | PASS |" >> ~/akior/ledgers/action.md
  echo "PASS"
  exit 0
else
  echo "| $TIMESTAMP | CANARY_FILESYSTEM | FAIL | $ERRORS errors |" >> ~/akior/ledgers/action.md
  echo "FAIL ($ERRORS errors)"
  exit 1
fi
