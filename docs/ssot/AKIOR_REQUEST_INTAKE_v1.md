# AKIOR Request Intake — Phase A SSOT v1

**Document type:** Phase A control doc — Request intake policy
**Version:** v1
**Status:** READY-FOR-T7 (does not self-merge)
**Owner approval surface:** T7 docs merge-owner
**Companion docs:** `AKIOR_ROLE_v1.md`, `AKIOR_CTO_SUPERVISION_SSOT_v2.md`, `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md`, `AKIOR_POD_ORCHESTRATION_POLICY_v1.md`, `AKIOR_DECISIONS_LOG_v1.md`

---

## 1. Purpose

Define how every inbound request enters AKIOR, gets identified, classified, validated, and accepted (or rejected) before any agent or tool is dispatched. This is the front door. Everything downstream — routing, orchestration, decision logging — assumes the request has already passed through this intake gate.

Docs-only. No code or runtime changes.

## 2. What counts as a request

A request is any inbound stimulus that may cause AKIOR to take action. This includes:

- Owner-typed instructions (web UI chat, CLI, voice).
- Inbound messages on connected channels (iMessage, WhatsApp, email, voice).
- Scheduled triggers (cron, calendar-driven, recurring routines).
- System events (webhook callbacks, file-drop events, third-party notifications).
- Internal agent-to-agent dispatches that originate from another AKIOR pod.

Anything that is not a request — passive log lines, telemetry, heartbeat pings — is not subject to this intake policy and must not be promoted into the request stream.

## 3. Mandatory intake fields

Every request, regardless of channel, must be normalized into a single intake record with at least:

| Field | Description |
|---|---|
| `request_id` | Stable unique id (uuid). |
| `received_at` | ISO-8601 timestamp, UTC. |
| `channel` | One of the approved channels (see §6). |
| `source_identity` | Resolved identity of the sender (contact card id if known, raw handle if not). |
| `raw_payload` | Verbatim original payload, untrusted. |
| `normalized_text` | Best-effort plain-text rendering for triage. |
| `attachments` | List of attachment refs with content-type and size. |
| `domain_hint` | Optional suggested domain from any of the 10 domain packs. |
| `urgency_hint` | Optional sender-supplied urgency marker. |

A request that cannot be normalized to this schema is **rejected at the gate** and logged; it is never advanced into routing.

## 4. Identity resolution

Before classification, the source identity must be resolved against the Contact Intelligence System:

- **Known contact** → load Contact Card (Name, Relationship, Allow Level, Block List, Reply Persona, Standing Instructions, Takeover Mode, Priority Level).
- **Unknown contact on owner-facing channel** → no reply, log + flag for owner review per the Communication Rules.
- **System sender** (cron, webhook from approved adapter) → mark as `system`; bypass contact-card lookup; still subject to allow-list of approved adapter ids.

Identity resolution is **mandatory** before classification. Skipping it constitutes drift and must be reported.

## 5. Classification (triage)

Each normalized request is classified along three axes:

1. **Intent class.** Question / Task / Notification / Schedule-change / Approval-request / Status-check / Other.
2. **Domain.** One of the 10 domain packs (personal, family, business, software, product, seo-marketing, travel, research, communications, legal) or `cross-domain`.
3. **Risk tier.** Low / Medium / High / Owner-only — using the same tiering as `EXECUTION_QUEUE.md`.

Classification may be done by a local Tier-M model where evidence shows it is sufficient; otherwise escalated per the routing law in `AKIOR_CTO_SUPERVISION_SSOT_v2.md`. Classification output is stored on the intake record; it is **input** to routing, not a final decision.

## 6. Approved intake channels

| Channel | Adapter | Notes |
|---|---|---|
| Web UI (AKIOR app) | First-party | Owner-only by default; family / employee surfaces require explicit allow-list. |
| iMessage | Approved bridge | Subject to Contact Card rules. |
| WhatsApp | Approved bridge | Subject to Contact Card rules; QR-bonded device. |
| Email (Gmail) | OpenClaw OAuth-bonded mailbox | Read-only intake by default. |
| Email (Yahoo) | Approved adapter | If and when adopted per AKIOR-TOOL-ADOPTION-DECISIONS. |
| Voice | Approved VOIP adapter | Transcribed at the gate. |
| Calendar | Google Calendar adapter | Schedule-derived requests only. |
| Webhook / file-drop | Per-adapter allow-list | Adapter id must be on the approved registry. |
| Internal agent dispatch | First-party | Caller pod must be authenticated and authorized. |

Any channel not listed is **not an intake channel**. Inbound traffic on an unapproved channel is dropped and logged.

## 7. Validation gates

Before a request is advanced to routing, it must pass all gates in order. Failing any gate blocks advancement; the request is logged with the gate id and reason.

1. **Schema gate** — required fields present, types correct.
2. **Identity gate** — identity resolved or explicitly marked unknown.
3. **Allow-list gate** — sender is on the channel's allow-list (or the channel allows unknowns with the unknown-contact rule).
4. **Safety gate** — payload scanned for prompt-injection vectors, secret-bearing content, and policy-violating attachments.
5. **Quota gate** — sender / channel rate limits not exceeded.
6. **Mode gate** — Do-Not-Disturb, Takeover Mode, and any global pause flags consulted.
7. **Domain gate** — request can be assigned to one of the 10 domains, or to `cross-domain` with explicit owner-policy support.

A request that passes all seven gates becomes an **accepted request** and is handed to routing (see `AKIOR_AGENT_ROUTING_AND_TOOL_POLICY_v1.md`).

## 8. Rejection, hold, and silence

- **Reject** — schema, allow-list, safety, or domain gate fails. Logged with reason. No reply unless the channel's policy specifies an explicit auto-reply.
- **Hold** — quota or mode gate fails. Request is queued; sender is not notified unless the channel policy says otherwise.
- **Silence > wrong reply.** If classification cannot reach a confident class, AKIOR does not reply. The request is logged for owner review.

These three outcomes are first-class. They are not failures.

## 9. Logging contract

Every intake event — accepted, rejected, held, or silenced — is appended to the action ledger (`~/akior/ledgers/action.md` per the operating constitution). Required log fields: `request_id`, `received_at`, `channel`, `source_identity` (or `unknown`), `gate_outcomes`, `final_state`, `classification_summary` (if reached). No raw payload is written to git-tracked logs; sensitive payloads stay in `data/` only.

## 10. Anti-drift rules for intake

- **No bypass channels.** New intake surfaces require a documented adapter and an entry in §6.
- **No silent classification model swaps.** The model used for classification is recorded on the intake record per the proof-first hybrid operating model.
- **No silent gate skips.** A skipped gate is a defect, not an optimization.
- **No retroactive identity changes.** If a request was accepted as `unknown`, later identification does not rewrite the intake record; a new linked record is created.

## 11. Versioning

- v1 — first repo-canonical revision. No prior repo or `Downloads/` version found during preflight.
- Subsequent revisions increment the suffix. The `SSOT-REGISTER.md` update is owned by the T7 docs merge-owner prompt and is not in this PR.

## 12. T7 review checklist

- [ ] Intake schema is sufficient for all approved channels.
- [ ] Contact Intelligence System rules are preserved.
- [ ] Communication Rules (silence > wrong reply, unknown-contact policy, takeover logging) are preserved.
- [ ] Risk-tier vocabulary aligns with `EXECUTION_QUEUE.md`.
- [ ] No code or runtime changes are bundled.
- [ ] Branch contains only `docs/ssot/AKIOR_REQUEST_INTAKE_v1.md`.
