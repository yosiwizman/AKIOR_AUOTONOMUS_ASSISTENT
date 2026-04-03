#!/bin/bash
# AKIOR tmux watchdog — ensures the akior tmux session persists
SESSION_NAME="akior"

if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  tmux new-session -d -s "$SESSION_NAME" -x 200 -y 50
  echo "| $(date -u +"%Y-%m-%dT%H:%M:%SZ") | TMUX_WATCHDOG | session created |" >> ~/akior/ledgers/action.md
else
  echo "| $(date -u +"%Y-%m-%dT%H:%M:%SZ") | TMUX_WATCHDOG | session alive |" >> ~/akior/ledgers/action.md
fi
