# AKIOR Agent Routing and Tool Policy — Phase A SSOT v1

**Document type:** Phase A control doc — Agent routing and tool authorization policy
**Version:** v1
**Status:** READY-FOR-T7 (does not self-merge)
**Owner approval surface:** T7 docs merge-owner
**Companion docs:** `AKIOR_ROLE_v1.md`, `AKIOR_REQUEST_INTAKE_v1.md`, `AKIOR_CTO_SUPERVISION_SSOT_v2.md`, `AKIOR_POD_ORCHESTRATION_POLICY_v1.md`, `AKIOR_DECISIONS_LOG_v1.md`

---

## 1. Purpose

Define how an **accepted request** (output of `AKIOR_REQUEST_INTAKE_v1.md`) is routed to the correct agent, with the correct tool set, at the correct trust tier, with proof recorded. This is the doctrine layer above any specific runtime; it does not pick a framework, but it constrains every framework that AKIOR runs on.

Docs-only. No runtime, framework, or code changes.

## 2. Scope boundary

This policy governs:

- **Agent selection** — which agent (or agent role) handles an accepted request.
- **Tool authorization** — which tools that agent may invoke for that request.
- **Tier selection** — local-first vs cloud per the hardware-aware routing law in `AKIOR_CTO_SUPERVISION_SSOT_v2.md`.
- **Proof obligations** — what evidence the routing decision and tool invocation must emit.

This policy does **not** govern:

- How agents are orchestrated into pods (see `AKIOR_POD_ORCHESTRATION_POLICY_v1.md`).
- How design decisions are recorded (see `AKIOR_DECISIONS_LOG_v1.md`).
- The intake process itself (see `AKIOR_REQUEST_INTAKE_v1.md`).

## 3. Agent registry contract

Every agent that AKIOR may route to must be registered. A registered agent has:

| Field | Description |
|---|---|
| `agent_id` | Stable id. |
| `role` | Plain-language role description (one sentence). |
| `domain_scope` | Which of the 10 domain packs this agent may serve. |
| `risk_ceiling` | Highest risk tier this agent may handle without escalation. |
| `tool_grants` | Explicit allow-list of tool ids this agent may invoke. |
| `model_preference` | Tier-L / Tier-M / Tier-C with fallback rule. |
| `proof_class_floor` | Minimum claim-class the agent must emit for state assertions (e.g., `Tested` for any code change). |
| `human_in_loop` | When this agent must pause for owner review. |

An unregistered agent is **not routable**. Routing to an unregistered agent is drift and must be logged and stopped.

## 4. Routing law

For each accepted request, the router selects exactly **one** primary agent using the following ordered rule set. The first rule that produces a unique match wins.

1. **Owner explicit override.** Owner directives (e.g., "use the legal agent for this") win unconditionally if present in the request.
2. **Domain match.** Agent's `domain_scope` includes the request's classified domain.
3. **Risk-tier compatibility.** Agent's `risk_ceiling` ≥ request's risk tier.
4. **Tool-grant sufficiency.** Agent's `tool_grants` cover all tools the request will plausibly need.
5. **Model-tier fit.** Agent's `model_preference` is satisfiable on currently-available hardware (per Tier-L / Tier-M / Tier-C availability).
6. **Lowest sufficient tier wins.** Among matching agents, prefer the one whose `model_preference` is the lowest tier that still meets the proof-class floor.

If no agent satisfies all rules, the request is **escalated to owner** rather than force-routed. Force-routing is drift.

## 5. Tool authorization rules

- **Allow-list, not deny-list.** A tool is callable by an agent if and only if its id appears in the agent's `tool_grants`.
- **No silent grants.** Adding a tool to an agent's grant list is a doc change, not a runtime change. The doc change requires a Phase A or later versioned PR under T7 review.
- **Per-call risk check.** Tool invocations that would trigger any stop condition from `AKIOR-CONSTITUTIONAL-OVERRIDE-SUMMARY.md` (destructive, secret-bearing, paid, real-world side effect) require explicit owner approval at call time, even if the tool is in the grant list.
- **Adapter-mediated only.** External services are reached only through approved adapters. Direct shell-out to unmanaged binaries is prohibited.
- **Proof on success and failure.** Every tool call records inputs (with secrets redacted), outputs (or error), latency, and the tier/model used.

## 6. Tier selection (local-first)

Tier selection follows the routing law in `AKIOR_CTO_SUPERVISION_SSOT_v2.md`:

- **Tier-L (Blackwell / 3090):** complex reasoning, planning, large-context synthesis.
- **Tier-M (3090 / 4060 Ti / CPU+RAM):** classification, summarization, preprocessing, structured extraction, boilerplate generation.
- **Tier-C (cloud, e.g., Claude API):** escalation when local quality is proven insufficient or when the request explicitly requires cloud capabilities (e.g., a managed external service).

Rules:

- **Local-first when local suffices.** Cloud is the exception, not the default.
- **No silent cloud substitution.** If a local tier is selected and falls back to cloud mid-execution, that fallback is recorded.
- **No silent downshift.** A request marked for Tier-L may not be silently demoted to Tier-M because Tier-L is busy; the routing record must show the demotion and its justification.
- **Hybrid is steady state.** Mixed-tier execution within one request is normal and supported.

## 7. Proof and logging contract

Every routing decision and every tool invocation produces a record with at minimum:

- `request_id` (joins the intake record).
- `agent_id` selected.
- `routing_rule_matched` (which rule from §4 produced the match).
- `tool_calls[]` — each entry has `tool_id`, `tier`, `model`, `latency_ms`, `claim_class`, `outcome`.
- `escalations[]` — any tier or human-in-loop escalations.
- `final_state` — Completed / Held / Escalated / Failed.

Records are appended to the action ledger and the tool ledger per the operating constitution. No raw secrets in git-tracked logs.

## 8. Escalation paths

- **Tier escalation** — local Tier-M cannot meet the proof-class floor → escalate to Tier-L → escalate to Tier-C if still insufficient. Each step is logged with a one-line justification.
- **Agent escalation** — selected agent's `risk_ceiling` exceeded mid-execution → halt the agent, route the residual to a higher-ceiling agent, log the handoff.
- **Owner escalation** — any stop condition triggered → halt, ask owner, do not improvise.

Escalation is not failure; failure is silent improvisation.

## 9. Anti-fake-parallelism rule

Routing one request to multiple agents in parallel is allowed only when:

1. The request explicitly decomposes into independent subtasks.
2. Each subtask has its own routing record and its own proof obligations.
3. The merge step at the end is itself a routing decision, not an implicit consensus.

Spawning parallel agents to "race" for an answer, or to mask uncertainty, is prohibited.

## 10. Anti-drift rules

- **No new agent without registration.** A new agent role is a doc change first.
- **No new tool grant without a PR.** Tool grants are not runtime-mutable.
- **No silent tier substitution.** All tier transitions are recorded.
- **No bypass of stop conditions.** Tool grants do not override the constitutional override summary.

## 11. Versioning

- v1 — first repo-canonical revision. No prior repo or `Downloads/` version found during preflight.
- Subsequent revisions increment the suffix. The `SSOT-REGISTER.md` update is owned by the T7 docs merge-owner prompt and is not in this PR.

## 12. T7 review checklist

- [ ] Routing law produces a unique winner or escalates — never force-routes.
- [ ] Tool authorization is allow-list-only.
- [ ] Tier selection preserves local-first and forbids silent substitution.
- [ ] Proof contract is sufficient to reconstruct any routing decision after the fact.
- [ ] Escalation paths are first-class, not exception paths.
- [ ] Anti-fake-parallelism rule is preserved.
- [ ] No code or runtime changes are bundled.
- [ ] Branch contains only `docs/ssot/AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md`.
