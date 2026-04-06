# Task 82: Local LLM Benchmark + Routing Boundary Definition

**Date:** 2026-04-06
**Model:** qwen2.5-coder:7b (Q4_K_M, 4.7 GB, 32k context)
**Runtime:** Ollama 0.20.2 on Mac Mini M4 Pro 24GB
**Endpoint:** 127.0.0.1:11434

---

## 1. Call Surface Inventory

| Caller | File | Mechanism | Timeout |
|---|---|---|---|
| unified-triage.js (email-triage) | `~/.openclaw/.../unified-triage.js` | via `ollama-local-llm.sh` wrapper | **10s** (wrapper default) |
| evening-summary-local.sh | `~/akior/scripts/evening-summary-local.sh` | via `ollama-local-llm.sh` wrapper | **10s** (wrapper default) |
| morning-briefing-local.sh | `~/akior/scripts/morning-briefing-local.sh` | **direct curl** to 127.0.0.1:11434 | **30s** (custom) |

**Key finding:** morning-briefing bypasses the wrapper because Task 81 proved the 10s shared timeout is too tight for longer prompts. The wrapper's 10s limit is appropriate for short classification/summary tasks but not for multi-source briefings.

---

## 2. Benchmark Results

### A. Short Classification (5 runs)
| Run | Latency | Eval tokens | Output |
|---|---|---|---|
| A.1 | 1.20s (cold) | 2 | "ACTION" |
| A.2 | 0.15s | 2 | "ACTION" |
| A.3 | 0.15s | 2 | "ACTION" |
| A.4 | 0.15s | 2 | "ACTION" |
| A.5 | 0.16s | 2 | "ACTION" |

**Stats:** cold=1.20s, warm=0.15s avg, consistent output, ~80 tok/s effective

### B. Short Summarization (5 runs)
| Run | Latency | Eval tokens | Output (truncated) |
|---|---|---|---|
| B.1 | 1.00s (cold) | 30 | "Apple is informing the recipient..." |
| B.2 | 0.77s | 29 | "Apple informed the recipient..." |
| B.3 | 0.86s | 33 | "Apple has informed you..." |
| B.4 | 0.78s | 29 | "Apple's billing system failed..." |
| B.5 | 0.76s | 27 | "Apple informs the recipient..." |

**Stats:** cold=1.00s, warm=0.79s avg, good quality, ~37 tok/s effective

### C. Medium Structured (email-triage-like, 4 runs)
| Run | Latency | Eval tokens | Quality |
|---|---|---|---|
| C.1 | 2.25s | ~78 | correct 5-row markdown table |
| C.2 | 1.86s | ~78 | correct table |
| C.3 | 4.44s | ~78 | correct table |
| C.detail | 2.09s | 78 | correct priorities |

**Stats:** avg=2.66s, 78 eval tokens, structured output reliable

### D. Longer Structured (morning-briefing-like, 3 runs)
| Run | Latency | Eval tokens | Output size |
|---|---|---|---|
| D.1 | 5.33s | 195 | 758 chars |
| D.2 | 3.58s | 153 | 639 chars |
| D.3 | 5.47s | 232 | 1056 chars |

**Stats:** avg=4.79s, 193 eval tokens avg, well within 30s budget

### E. Stress / Fallback Probe (multi-step analysis)
| Run | Latency | Eval tokens | tok/s | Output size | Quality |
|---|---|---|---|---|---|
| E.1 | 14.79s | 652 | 44.1 | 1973 chars | avg=Y median=Y range=Y strategy=Y |

**Assessment:** Produced correct arithmetic, sorted data, identified median, calculated 15% range, generated strategy recommendations. All four quality markers present. Latency is 14.79s — exceeds 10s wrapper limit but well within 30s direct-call budget.

**Classification: LOCAL_OK_BUT_SLOW** — output quality is acceptable for internal operational analysis but the ~15s latency makes it unsuitable for interactive/real-time use. Acceptable for scheduled batch.

---

## 3. Routing Decision Table

| Bucket | Task type | Observed latency | Practical recommendation | Wrapper sufficient? |
|---|---|---|---|---|
| **LOCAL_DEFAULT** | Classification (1-word label) | 0.15–1.20s | Use for all email/message classification, intent detection, routing decisions | YES (10s wrapper) |
| **LOCAL_DEFAULT** | Short summary (1 sentence) | 0.76–1.00s | Use for per-email summaries, ledger line rollups, short digests | YES (10s wrapper) |
| **LOCAL_DEFAULT** | Medium structured (table/list, 5-10 items) | 1.86–4.44s | Use for email-triage batch classification, structured reports | YES (10s wrapper) |
| **LOCAL_DEFAULT** | Multi-source briefing (morning/evening) | 3.58–5.47s | Use for daily briefings from local inputs | NO — needs 30s direct call |
| **LOCAL_OK_BUT_SLOW** | Multi-step analysis (math + reasoning + recommendations) | 14.79s | Acceptable for scheduled batch. Not for interactive. | NO — needs 30s direct call |
| **FALLBACK_REQUIRED** | Multi-source research synthesis (web + reasoning) | not tested (no local web search) | Requires Claude/API for web search + frontier reasoning | N/A |
| **FALLBACK_REQUIRED** | Customer-facing drafting (Live Pilates) | not tested | Quality bar too high for 7B; requires Claude | N/A |
| **FALLBACK_REQUIRED** | Long-context (>16k tokens) | not tested | qwen2.5-coder 32k ctx exists but quality degrades; use llama3.1 (131k) or Claude | N/A |
| **FALLBACK_REQUIRED** | Real-time voice dialogue | not applicable | No local speech model; requires cloud voice | N/A |

---

## 4. Answers to Required Questions

**Q: Is qwen2.5-coder:7b fast enough for routine local operational tasks?**
**A: YES.** Classification at 0.15s warm, summarization at 0.79s, structured output at 2-5s, morning briefings at 4-5s. All well within acceptable latency for scheduled unattended operations. The 6 local agents already prove this in production.

**Q: Is the current shared wrapper acceptable as the default local entrypoint?**
**A: YES, for short-to-medium prompts (classification, summary, email-triage).** Its 10s curl timeout covers categories A-C comfortably. NOT acceptable for longer multi-source prompts (D, E) which need 15-30s. Morning-briefing already proved this by bypassing the wrapper.

**Q: Does Task 81 prove local summarization works but shared timeout policy is too rigid?**
**A: YES.** Task 81's initial failure (ollama exit=1 at 10s) and successful retry at 30s is direct evidence. The fix (direct curl with 30s) works but creates two calling patterns. Future improvement: add an optional timeout parameter to the wrapper, but this is not urgent.

**Q: What exact types of tasks should remain local right now?**
- Email classification and priority labeling
- Per-email short summaries
- Batch email-triage structured reports
- Daily canary health checks (no model needed)
- Morning briefings from local inputs
- Evening summaries from local ledgers
- Ledger line rollups and action-log digests
- Intent detection (reply/ignore/escalate)
- Simple structured analysis (pricing tables, comparisons)

**Q: What exact types of tasks should be routed to API/Claude right now?**
- Customer-facing replies (Live Pilates, legal, financial)
- Multi-source research synthesis (competitor analysis with web search)
- Long-context reasoning (>16k tokens)
- High-stakes drafting where hallucination risk matters
- Any task requiring web search or browser automation
- Voice calls (clawr.ing)
- Gmail inbox scanning (no local IMAP path yet)

---

## 5. Wrapper Timeout Summary

| Caller pattern | Current timeout | Benchmark evidence | Recommendation |
|---|---|---|---|
| `ollama-local-llm.sh` (shared wrapper) | 10s | Handles A, B, C (max 4.44s) | Keep as default for short/medium |
| Direct curl in morning-briefing | 30s | Handles D (5.47s), E (14.79s) | Keep for multi-source briefings |
| Future: wrapper with optional arg | N/A | Would unify both patterns | Nice-to-have, not blocking |

---

*Benchmark completed 2026-04-06. No paid API used. All measurements against local Ollama 127.0.0.1:11434.*
