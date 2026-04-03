#!/bin/bash
# AKIOR Canary: GitHub CLI auth check
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
gh auth status >/dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "| $TIMESTAMP | CANARY_GITHUB | PASS |" >> ~/akior/ledgers/action.md
  echo "PASS"
  exit 0
else
  echo "| $TIMESTAMP | CANARY_GITHUB | FAIL |" >> ~/akior/ledgers/action.md
  echo "FAIL"
  exit 1
fi
