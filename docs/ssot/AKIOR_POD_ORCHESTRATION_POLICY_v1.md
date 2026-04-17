# AKIOR Pod Orchestration Policy — Phase A SSOT v1

**Document type:** Phase A control doc — Pod orchestration policy
**Version:** v1
**Status:** READY-FOR-T7 (does not self-merge)
**Owner approval surface:** T7 docs merge-owner
**Companion docs:** `AKIOR_ROLE_v1.md`, `AKIOR_REQUEST_INTAKE_v1.md`, `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md`, `AKIOR_CTO_SUPERVISION_SSOT_v2.md`, `AKIOR_DECISIONS_LOG_v1.md`

---

## 1. Purpose

Define how AKIOR composes multiple agents and tools into a **pod** to satisfy a single accepted request that no single agent can complete alone, while preserving the constitutional rules: one merge surface, one lane, evidence-first, and no fake parallelism.

A pod is the unit of multi-agent execution. This document fixes how pods are formed, governed, and dissolved.

Docs-only. No runtime or code changes.

## 2. Definition

A **pod** is a bounded, time-limited collection of registered agents and approved tools, assembled to satisfy one accepted request, with one explicitly named **lead agent** that owns the final result.

Properties:

- **Bounded.** Membership is fixed at pod-formation time; mid-execution membership changes are governed (§7).
- **Time-limited.** A pod has a deadline. Past the deadline it is dissolved (§9).
- **Single result owner.** The lead agent is accountable for the final state delivered to the requester.
- **Single merge surface.** Pod outputs converge through the lead agent only — no parallel commits, no parallel replies.

Anything that does not satisfy all four properties is not a pod and may not be used as one.

## 3. When to form a pod

Form a pod when **and only when**:

1. The accepted request decomposes into ≥ 2 independent or sequential subtasks.
2. The set of required tool grants exceeds what any single registered agent holds.
3. The proof obligations require multiple specialist claim-class floors (e.g., a `Tested` code change plus an `Externally verified` external send).
4. The risk tier requires separation of duties (e.g., one agent proposes a destructive action, another agent verifies it before owner approval).

If none of those four conditions apply, route to a single agent per `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md`. Pods are not the default; single-agent routing is.

## 4. Pod formation contract

Forming a pod produces a record with at minimum:

| Field | Description |
|---|---|
| `pod_id` | Stable id. |
| `request_id` | Joins the intake record. |
| `formed_at` | ISO-8601 timestamp. |
| `deadline` | Hard deadline. |
| `lead_agent_id` | The single result owner. |
| `members[]` | Each entry: `agent_id`, `responsibility`, `tool_grants` (subset of agent's registered grants). |
| `subtask_plan[]` | Ordered or DAG-shaped subtasks with explicit dependencies. |
| `merge_rule` | How subtask outputs converge to the final result (controlled by lead agent). |
| `escalation_rule` | What triggers owner escalation. |

A pod that lacks any of these fields is **not formed**. Forming a pod with missing fields is drift and must be stopped.

## 5. Roles inside a pod

| Role | Count | Responsibility |
|---|---|---|
| Lead agent | exactly 1 | Owns final result; performs the merge; is the single voice to the requester. |
| Specialist agent | 1..N | Executes assigned subtask within its registered tool grants. |
| Verifier agent | 0..N | Confirms a specialist's claim against the required claim-class floor. |
| Observer | 0..N | Read-only access to pod state for logging/learning. May not act. |

Verifier agents may not also be specialists for the same subtask. Separation of duties is preserved.

## 6. Concurrency model

- **Sequential by default.** Subtasks run sequentially unless explicitly marked independent.
- **Independent subtasks may run in parallel** when their inputs and outputs are disjoint.
- **No racing.** Two agents may not pursue the same subtask in parallel to "race" for an answer (anti-fake-parallelism).
- **No silent fan-out.** Spawning new specialists mid-pod requires a documented amend to the pod record (§7).

## 7. Mid-execution amendments

Pods are bounded, but bounded amendments are allowed:

- **Add specialist.** Permitted when a subtask reveals a need for a tool grant no member holds. Requires an amend record with reason and lead-agent approval.
- **Replace specialist.** Permitted on specialist failure within retry budget. Requires amend record.
- **Change deadline.** Permitted only by owner approval. Lead agent may not unilaterally extend.
- **Change lead agent.** Not permitted mid-pod. If the lead must change, dissolve and re-form.

All amendments are appended to the pod record; the pod record is append-only.

## 8. Failure handling

- **Specialist failure within retry budget (≤ 3 attempts on the same failure path):** specialist may retry per the operating constitution's retry policy.
- **Specialist failure beyond retry budget:** stop the specialist, attempt one bounded replacement, otherwise escalate.
- **Verifier rejects a specialist claim:** the claim is downgraded; the lead must either re-execute the subtask or escalate.
- **Lead agent failure:** dissolve the pod, escalate to owner. Lead failure does not auto-promote a specialist.
- **Stop condition triggered by any member:** the entire pod halts and escalates.

Failures are recorded with claim class so post-hoc analysis is possible.

## 9. Dissolution

A pod dissolves on any of:

1. Lead agent reports `Completed` and emits the final result (success path).
2. Deadline reached without `Completed` (timeout — escalate).
3. Owner explicit dissolution.
4. Stop condition triggered.
5. Lead agent failure (per §8).

Dissolution is final. A new request requires a new pod, even if it covers the same subject.

## 10. Proof and logging contract

Every pod produces:

- The pod record (§4) and its append-only amend log.
- Per-subtask routing records (per `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md` §7).
- The final merged result with claim class.
- A dissolution record with reason.

These are appended to the action and tool ledgers. No raw secrets in git-tracked logs.

## 11. Anti-drift rules

- **No leaderless pods.** A pod without a single named lead is drift.
- **No silent pod formation.** Pods are formed by an explicit record, not implied by parallel agent invocations.
- **No multi-merge surfaces.** Replies and commits go through the lead.
- **No swarm escalation.** Adding more agents is not a substitute for evidence; quality is not parallelism.
- **No persistent pods.** Pods are per-request. There is no "always-on" pod.

## 12. Versioning

- v1 — first repo-canonical revision. No prior repo or `Downloads/` version found during preflight.
- Subsequent revisions increment the suffix. The `SSOT-REGISTER.md` update is owned by the T7 docs merge-owner prompt and is not in this PR.

## 13. T7 review checklist

- [ ] Pod definition preserves single-merge-surface and single-result-owner rules.
- [ ] Formation contract is sufficient to reconstruct any pod after the fact.
- [ ] Concurrency model preserves anti-fake-parallelism.
- [ ] Amendment rules forbid silent fan-out and silent lead change.
- [ ] Failure handling preserves the operating constitution's retry policy.
- [ ] Dissolution rules forbid persistent pods.
- [ ] No code or runtime changes are bundled.
- [ ] Branch contains only `docs/ssot/AKIOR_POD_ORCHESTRATION_POLICY_v1.md`.
