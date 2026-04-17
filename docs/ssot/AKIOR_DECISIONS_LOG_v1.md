# AKIOR Decisions Log — Phase A SSOT v1

**Document type:** Phase A control doc — Decisions log policy
**Version:** v1
**Status:** READY-FOR-T7 (does not self-merge)
**Owner approval surface:** T7 docs merge-owner
**Companion docs:** `AKIOR_ROLE_v1.md`, `AKIOR_REQUEST_INTAKE_v1.md`, `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md`, `AKIOR_POD_ORCHESTRATION_POLICY_v1.md`, `AKIOR_CTO_SUPERVISION_SSOT_v2.md`

---

## 1. Purpose

Define the canonical format, location, lifecycle, and authority of AKIOR-recorded **decisions** — choices that bind future behavior — so that any future session can reconstruct **why** a state exists, not just **that** it exists.

This is a complement to the action ledger (per-event log) and the tool ledger (per-tool-call log) defined in the operating constitution. The Decisions Log captures the **why** layer.

Docs-only. No runtime or code changes.

## 2. What counts as a decision

A decision is any choice that satisfies **all** of:

1. It binds future behavior (someone or some agent must comply later).
2. It has at least one rejected alternative.
3. Reversing it would have a non-trivial cost (data, time, money, trust, or scope).

A choice with no rejected alternative is not a decision; it is an observation. A choice with no future-binding effect is not a decision; it is a one-shot action — log it in the action ledger only.

## 3. Decision categories

Decisions are tagged with exactly one primary category:

| Category | Examples |
|---|---|
| `architectural` | Choosing OpenClaw + Ollama + Temporal as the execution stack. |
| `policy` | Establishing silence > wrong reply. |
| `routing` | Establishing local-first tier selection. |
| `tool-adoption` | Adopt-later vs current-path classification of an external tool. |
| `governance` | Owner involvement target, stop conditions. |
| `scope` | Phase boundaries, lane gates, batch approvals. |
| `data` | Where contact data lives, which logs are git-tracked. |
| `incident` | Decisions made in response to a specific incident. |

Multiple secondary tags allowed; exactly one primary.

## 4. Decision record schema

Each decision is recorded as one entry with at minimum:

| Field | Description |
|---|---|
| `decision_id` | Stable id (e.g., `AD-2026-04-16-001`). |
| `decided_at` | ISO-8601 timestamp, UTC. |
| `decided_by` | `owner` / `akior` / `pod:<pod_id>` / `agent:<agent_id>`. |
| `category_primary` | One of §3. |
| `category_secondary` | Zero or more of §3. |
| `title` | One short sentence. |
| `context` | Why this decision was needed; what triggered it. |
| `options_considered` | List of options with one-line pros/cons. |
| `chosen_option` | The selected option, restated explicitly. |
| `rationale` | Why this option won. |
| `evidence` | Claim-class-tagged evidence supporting the rationale. |
| `consequences` | What this binds going forward. |
| `reversibility` | `cheap` / `medium` / `expensive` / `irreversible`. |
| `expiry_or_review_date` | Optional. When to revisit. |
| `supersedes` | List of `decision_id`s replaced by this one. |
| `superseded_by` | Filled when a later decision replaces this one. |

Decisions missing any of these fields are not records; they are notes.

## 5. Authority levels

A decision's authority level matches its `decided_by`:

- **Owner decisions** — bind everything below. Cannot be silently overridden.
- **AKIOR decisions** — bind future AKIOR sessions, but may be revised by owner or by a later AKIOR decision under owner-approved policy.
- **Pod decisions** — bind only the pod that made them and any pod that explicitly inherits them.
- **Agent decisions** — bind only the agent and the active subtask.

Higher authority always wins. An agent-level decision may not contradict an owner decision.

## 6. Storage location

The canonical Decisions Log location is:

```
~/akior/ledgers/decision.md
```

per the operating constitution's ledger paths. This file is the **runtime** Decisions Log.

In-repo, decisions whose `category_primary` is `architectural`, `governance`, `policy`, or `tool-adoption`, and whose authority level is `owner` or `akior`, must **also** be reflected in a versioned doc under `docs/ssot/` (e.g., `AKIOR-TOOL-ADOPTION-DECISIONS-01.md`). The runtime ledger is append-only history; the SSOT doc is the canonical statement of current policy.

If the runtime ledger and the SSOT doc disagree, the SSOT doc wins per the Truth Hierarchy in `CLAUDE.md`. The disagreement must be reported and remediated.

## 7. Append-only and immutability

- The Decisions Log is **append-only**. Existing entries are never edited in place.
- Corrections are made by appending a new decision that supersedes the prior one. Both `supersedes` and `superseded_by` fields are filled to maintain the chain.
- Removing an entry is not permitted. Marking an entry as superseded is the correct path.

This rule preserves the ability to reconstruct historical reasoning even after policy changes.

## 8. Linking contract

Every decision should reference the artifacts it affects:

- `affects_files[]` — list of repo paths or runtime paths.
- `affects_artifacts[]` — list of `request_id`, `pod_id`, `agent_id`, or external-resource ids.
- `cited_by[]` — back-references filled by later records that depend on this decision.

When an action ledger entry implements a decision, the action entry must cite the `decision_id`. Decisions are cheap to cite and expensive to forget.

## 9. Decision lifecycle

1. **Drafted** — composed but not yet logged.
2. **Recorded** — appended to the runtime Decisions Log.
3. **Reflected** — corresponding SSOT doc updated (when §6 requires).
4. **Active** — binding behavior.
5. **Superseded** — replaced by a later decision; `superseded_by` filled.
6. **Expired** — past `expiry_or_review_date`; must be reviewed before continued reliance.

A decision in `drafted` state is not binding. A decision in `expired` state is not silently re-validated; it requires explicit review.

## 10. Anti-drift rules

- **No tacit decisions.** A decision that exists only in chat or commit messages is not a decision; it is folklore.
- **No silent supersession.** Replacing a decision requires the supersession chain.
- **No mid-flight reversal without record.** Changing course mid-pod requires a new decision entry citing the original.
- **No multi-source truth.** Where §6 requires both runtime and SSOT reflection, both must exist before the decision is `Active`.
- **No retroactive decisions.** Backfilling a decision after the fact requires marking `decided_at` as the actual moment of binding, not the moment of recording, and tagging the entry as `backfilled: true`.

## 11. Versioning

- v1 — first repo-canonical revision. No prior repo or `Downloads/` version found during preflight.
- Subsequent revisions increment the suffix. The `SSOT-REGISTER.md` update is owned by the T7 docs merge-owner prompt and is not in this PR.

## 12. T7 review checklist

- [ ] Definition of "decision" excludes mere observations and one-shot actions.
- [ ] Schema is sufficient to reconstruct rationale and supersession chain.
- [ ] Authority levels preserve owner supremacy.
- [ ] Storage location is consistent with the operating constitution and the Truth Hierarchy.
- [ ] Append-only rule is unambiguous.
- [ ] Linking contract makes citation cheap and forgetting expensive.
- [ ] Anti-drift rules forbid tacit and retroactive decisions.
- [ ] No code or runtime changes are bundled.
- [ ] Branch contains only `docs/ssot/AKIOR_DECISIONS_LOG_v1.md`.
