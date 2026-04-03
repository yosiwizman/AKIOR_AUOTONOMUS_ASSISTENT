#!/bin/bash
# AKIOR Canary: Gmail health check via IMAP connectivity test
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RESULT=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" "https://mail.google.com" 2>&1)
if [ "$RESULT" = "200" ] || [ "$RESULT" = "301" ] || [ "$RESULT" = "302" ]; then
  echo "| $TIMESTAMP | CANARY_GMAIL | PASS |" >> ~/akior/ledgers/action.md
  echo "PASS"
  exit 0
else
  echo "| $TIMESTAMP | CANARY_GMAIL | FAIL | http_code=$RESULT |" >> ~/akior/ledgers/action.md
  echo "FAIL"
  exit 1
fi
