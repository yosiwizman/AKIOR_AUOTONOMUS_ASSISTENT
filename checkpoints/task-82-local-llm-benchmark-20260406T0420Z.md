# Checkpoint — Task 82: Benchmark local LLM surface and define routing boundary

**Timestamp:** 2026-04-06T04:20Z

## Key findings
- qwen2.5-coder:7b handles all current autonomous agent workloads within acceptable latency
- Classification: 0.15s warm (80 tok/s effective)
- Summary: 0.79s avg (37 tok/s effective)
- Structured triage: 2.7s avg (78 eval tokens)
- Morning-briefing: 4.8s avg (193 eval tokens)
- Multi-step analysis: 14.8s (652 eval tokens, 44.1 tok/s)

## Routing boundary
- LOCAL_DEFAULT: classification, summary, triage, briefings, ledger rollups, intent detection
- LOCAL_OK_BUT_SLOW: batch analysis <30s
- FALLBACK_REQUIRED: customer-facing drafting, web research, long-context >16k, voice

## Wrapper status
- 10s wrapper: sufficient for A/B/C categories
- 30s direct call: required for D/E categories (proven by Task 81)

## Evidence
~/akior/evidence/terminal/task-82-local-llm-benchmark.md (full report with timings)
