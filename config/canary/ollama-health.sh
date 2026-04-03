#!/bin/bash
# AKIOR Canary: Ollama local inference check
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Check ollama server responds
if ! curl -s --max-time 5 localhost:11434 >/dev/null 2>&1; then
  echo "| $TIMESTAMP | CANARY_OLLAMA | FAIL | server not responding |" >> ~/akior/ledgers/action.md
  echo "FAIL (server not responding)"
  exit 1
fi

# Check model list includes our target model
if ! ollama list 2>/dev/null | grep -q "qwen2.5-coder"; then
  echo "| $TIMESTAMP | CANARY_OLLAMA | FAIL | model not found |" >> ~/akior/ledgers/action.md
  echo "FAIL (model not found)"
  exit 1
fi

echo "| $TIMESTAMP | CANARY_OLLAMA | PASS |" >> ~/akior/ledgers/action.md
echo "PASS"
exit 0
