#!/bin/bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ACTION="${1:-unknown}"
OUTCOME="${2:-completed}"
echo "| $TIMESTAMP | $ACTION | $OUTCOME |" >> ~/akior/ledgers/action.md
