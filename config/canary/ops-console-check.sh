#!/bin/bash
# AKIOR Canary: Ops Console health check
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
HTTP_CODE=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:8420/ 2>&1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "| $TIMESTAMP | CANARY_OPS_CONSOLE | PASS |" >> ~/akior/ledgers/action.md
  echo "PASS"
  exit 0
else
  echo "| $TIMESTAMP | CANARY_OPS_CONSOLE | FAIL | http=$HTTP_CODE |" >> ~/akior/ledgers/action.md
  # Attempt restart
  launchctl unload ~/Library/LaunchAgents/com.akior.ops-console.plist 2>/dev/null
  sleep 1
  launchctl load ~/Library/LaunchAgents/com.akior.ops-console.plist 2>/dev/null
  sleep 2
  RETRY=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:8420/ 2>&1)
  if [ "$RETRY" = "200" ]; then
    echo "| $TIMESTAMP | CANARY_OPS_CONSOLE | RECOVERED | restart succeeded |" >> ~/akior/ledgers/action.md
    echo "RECOVERED"
    exit 0
  else
    echo "| $TIMESTAMP | CANARY_OPS_CONSOLE | FAIL_PERSIST | restart failed |" >> ~/akior/ledgers/action.md
    echo "FAIL"
    exit 1
  fi
fi
