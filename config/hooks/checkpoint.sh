#!/bin/bash
TASK="${1:-unknown}"
STEP="${2:-0}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{\"task\": \"$TASK\", \"step\": $STEP, \"timestamp\": \"$TIMESTAMP\"}" > ~/akior/checkpoints/latest.json
