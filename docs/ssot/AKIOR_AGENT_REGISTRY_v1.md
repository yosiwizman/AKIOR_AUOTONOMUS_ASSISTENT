# AKIOR Agent Registry — Phase B SSOT v1

**Document type:** Phase B uncertainty-reduction doc — canonical registry of routable AKIOR agents
**Version:** v1
**Status:** READY-FOR-T7 (does not self-merge)
**Owner approval surface:** T7 docs merge-owner
**Companion docs:** `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md`, `AKIOR_ROLE_v1.md`, `AKIOR_REQUEST_INTAKE_v1.md`, `AKIOR_POD_ORCHESTRATION_POLICY_v1.md`, `AKIOR_DECISIONS_LOG_v1.md`

---

## 1. Purpose

This document is the canonical agent registry required by `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md` §3. An agent is **routable** if and only if it has an entry in this file. Routing to an unregistered agent is drift and must be logged and stopped (routing policy §3, §10).

Docs-only. No runtime, framework, or code changes. Registration is a doc change; activation and any tool-grant expansion require separate versioned PRs under T7 review (routing policy §5, §10).

## 2. Scope boundary

This registry governs:

- The identity, scope, authority, and tool grants of every agent AKIOR may route to.
- The minimum claim-class each agent must emit for state assertions.
- When each agent must pause for owner review (human-in-loop floor).

This registry does **not** govern:

- Routing selection rules (see `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md` §4).
- Pod composition across multiple agents (see `AKIOR_POD_ORCHESTRATION_POLICY_v1.md`).
- Per-tool implementation or adapter contracts (tracked separately; referenced by `tool_grants`).

## 3. Entry contract

Every entry in §4 must populate exactly the fields required by `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md` §3:

| Field | Required content |
|---|---|
| `agent_id` | Stable id. Lowercase, hyphenated. Never reused after retirement. |
| `role` | One-sentence plain-language role description. |
| `domain_scope` | Subset of the 10 domain packs (personal, family, business, software, product, seo-marketing, travel, research, communications, legal) or `all`. |
| `risk_ceiling` | Highest risk tier this agent may handle without escalation. |
| `tool_grants` | Explicit allow-list of tool ids. Empty list means no tools granted. |
| `model_preference` | Tier-L / Tier-M / Tier-C primary with explicit fallback. |
| `proof_class_floor` | Minimum claim-class emitted for state assertions. |
| `human_in_loop` | When this agent must pause for owner review. |

Unregistered agents are not routable (routing policy §3). Adding a new entry, widening `domain_scope`, raising `risk_ceiling`, or extending `tool_grants` are each doc changes and must ship as a versioned PR under T7 review (routing policy §5, §10).

## 4. Registered agents

### 4.1 akior-owner-chat

| Field | Value |
|---|---|
| `agent_id` | `akior-owner-chat` |
| `role` | Owner-facing conversational surface: receives owner briefs and overrides, surfaces status and questions, and routes accepted requests into the intake pipeline. |
| `domain_scope` | `all` (owner-directed; domain classification is performed downstream by `AKIOR_REQUEST_INTAKE_v1.md`). |
| `risk_ceiling` | Low. This agent converses and routes; it does not execute destructive, secret-bearing, paid, or real-world-side-effect actions. Any request above Low is escalated via the routing law. |
| `tool_grants` | *(empty)* — no tools granted at v1. Conversation and routing only. Any future tool grant requires a versioned PR under T7 review (routing policy §5, §10). |
| `model_preference` | Tier-L primary, Tier-M fallback. No silent cloud substitution; Tier-C only via explicit escalation recorded per routing policy §6 and §8. |
| `proof_class_floor` | `Tested` for any state assertion it emits; `Observed` for passive surfacing of already-proven records. |
| `human_in_loop` | Required for any action above the documented `risk_ceiling`, any stop condition from `AKIOR-CONSTITUTIONAL-OVERRIDE-SUMMARY.md`, any ambiguous product decision, and any tool invocation not in `tool_grants` (which at v1 is all tool invocations). |

## 5. Anti-drift rules

- **No new agent without a registry entry.** New agent ids are doc changes first.
- **No silent field widening.** `domain_scope`, `risk_ceiling`, and `tool_grants` are extended only via versioned PRs under T7 review.
- **No runtime mutation.** This registry is the source of truth; runtime loaders read from this doc, never from ad-hoc config.
- **No bypass of stop conditions.** Registry fields do not override `AKIOR-CONSTITUTIONAL-OVERRIDE-SUMMARY.md`.

## 6. Versioning

- v1 — first canonical registry artifact. Seeds exactly one agent (`akior-owner-chat`) with conservative defaults (empty `tool_grants`, Tier-L primary / Tier-M fallback, `Tested` proof-class floor, human-in-loop required above ceiling).
- Subsequent revisions increment the suffix. Each revision is accompanied by a corresponding update to `SSOT-REGISTER.md`.

## 7. T7 review checklist

- [ ] Every entry populates all eight fields required by `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md` §3.
- [ ] `tool_grants` is an explicit allow-list (empty is acceptable).
- [ ] `model_preference` names primary and fallback tiers.
- [ ] `proof_class_floor` is no weaker than `Tested` for any agent that emits state assertions.
- [ ] `human_in_loop` covers at minimum actions above `risk_ceiling` and all constitutional stop conditions.
- [ ] No runtime, framework, or code changes are bundled.
- [ ] Branch contains only `docs/ssot/SSOT-REGISTER.md` and `docs/ssot/AKIOR_AGENT_REGISTRY_v1.md`.
