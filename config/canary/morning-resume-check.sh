#!/bin/bash
# AKIOR Morning Resume Check
# Inspects checkpoints and resume queue, writes recovery summary
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
OUTPUT=~/akior/evidence/terminal/morning-resume-status-latest.md

echo "# Morning Resume Status" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "**Generated:** $TIMESTAMP" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Check bootstrap checkpoint
echo "## Bootstrap Checkpoint" >> "$OUTPUT"
if [ -f ~/akior/checkpoints/bootstrap-complete.json ]; then
  OVERALL=$(python3 -c "import json; d=json.load(open('$HOME/akior/checkpoints/bootstrap-complete.json')); print(d.get('overall','UNKNOWN'))" 2>/dev/null)
  echo "Status: $OVERALL" >> "$OUTPUT"
else
  echo "Status: NO CHECKPOINT FOUND" >> "$OUTPUT"
fi
echo "" >> "$OUTPUT"

# Check resume queue
echo "## Resume Queue" >> "$OUTPUT"
if [ -f ~/akior/checkpoints/resume-queue.md ]; then
  LINES=$(wc -l < ~/akior/checkpoints/resume-queue.md | tr -d ' ')
  if [ "$LINES" -le 1 ]; then
    echo "Queue: EMPTY (no pending tasks)" >> "$OUTPUT"
  else
    echo "Queue: $((LINES - 1)) item(s) pending" >> "$OUTPUT"
    echo '```' >> "$OUTPUT"
    tail -n +2 ~/akior/checkpoints/resume-queue.md >> "$OUTPUT"
    echo '```' >> "$OUTPUT"
  fi
else
  echo "Queue: FILE NOT FOUND" >> "$OUTPUT"
fi
echo "" >> "$OUTPUT"

# Check latest checkpoint
echo "## Latest Checkpoint" >> "$OUTPUT"
if [ -f ~/akior/checkpoints/latest.json ]; then
  cat ~/akior/checkpoints/latest.json >> "$OUTPUT"
else
  echo "No latest.json found" >> "$OUTPUT"
fi
echo "" >> "$OUTPUT"

# Check key services
echo "## Service Status" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# tmux
if tmux has-session -t akior 2>/dev/null; then
  echo "- tmux (akior): ACTIVE" >> "$OUTPUT"
else
  echo "- tmux (akior): DOWN" >> "$OUTPUT"
fi

# ops console
OC=$(curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://localhost:8420/ 2>&1)
if [ "$OC" = "200" ]; then
  echo "- Ops Console: ACTIVE (localhost:8420)" >> "$OUTPUT"
else
  echo "- Ops Console: DOWN (http=$OC)" >> "$OUTPUT"
fi

# ollama
OL=$(curl -s --max-time 3 localhost:11434 2>&1)
if echo "$OL" | grep -q "running"; then
  echo "- Ollama: ACTIVE" >> "$OUTPUT"
else
  echo "- Ollama: DOWN or unreachable" >> "$OUTPUT"
fi

# docker
if docker ps >/dev/null 2>&1; then
  echo "- Docker: ACTIVE" >> "$OUTPUT"
else
  echo "- Docker: DOWN" >> "$OUTPUT"
fi

echo "" >> "$OUTPUT"
echo "## Recovery Recommendation" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "Check Wix Inbox for customer replies. Review action ledger for overnight activity." >> "$OUTPUT"

# Log
echo "| $TIMESTAMP | MORNING_RESUME_CHECK | COMPLETE |" >> ~/akior/ledgers/action.md

echo "Morning resume check written to $OUTPUT"
