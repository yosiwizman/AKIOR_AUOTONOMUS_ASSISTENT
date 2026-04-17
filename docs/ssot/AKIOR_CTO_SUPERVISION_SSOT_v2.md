# AKIOR CTO Supervision SSOT

**Document type:** Supervisory Source of Truth
**Version:** v2
**Version date:** 2026-04-16
**Lineage:** Successor to the v1-equivalent at `Downloads/AKIOR_CTO_SUPERVISION_SSOT.md` (external baseline, never committed). v2 is the **first repo-canonical revision** of this artifact. v1 content preserved unchanged at its Downloads path as historical external baseline.
**Purpose:** Prevent drift while onboarding and supervising a new LLM CTO
**Audience:** Founder + internal CTO supervisor
**Scope:** How to control the new CTO's first-day process and later guidance without letting project truth get distorted
**Canonical control-doc directory:** `projects/akior/docs/ssot/`
**Precedence vs other SSOTs:** This document governs **CTO supervision**. For AKIOR-OS master constitution see `AKIOR-OS-SSOT-v1.0-EXPERIMENT-LOCK.md` (Mac-Mini experiment). For ChatGPT→Claude-Code control loop see `AKIOR_CTO_CONTROL_SYSTEM.md` (v4.1). Where those documents govern their own scopes, they win. Where this document governs supervision and hybrid-execution doctrine, it wins.

---

## 1. What this document is

This is not a generic project brief.

This document exists to do two things at once:

1. Preserve the current best-known truth about AKIOR.
2. Act as the firewall between the founder and the new CTO so that:
   - the founder does not accidentally hand over wrong framing,
   - the new CTO does not over-infer from incomplete evidence,
   - the project does not drift into fake certainty, fake completion, or wrong next steps.

This document is the supervisory control layer for CTO onboarding and ongoing review.

---

## 2. Operating principle

The founder may provide vision, claims, screenshots, PDFs, and prior notes.
Those are useful inputs.
They are **not automatic proof**.

The new CTO may provide analysis, plans, and Claude Code prompts.
Those are useful outputs.
They are **not automatically correct**.

The supervisory rule is:

**No claim becomes accepted truth until it is reconciled against evidence.**

---

## 3. Role split

### Founder
Provides:
- product vision,
- priorities,
- approval,
- founder context,
- screenshots / PDFs / live examples,
- access to documents and repo context.

### New CTO
Responsible for:
- intake,
- contradiction detection,
- evidence triage,
- choosing the next narrow evidence-gathering step,
- producing focused Claude Code prompts,
- separating proven from claimed.

### CTO Supervisor
Responsible for:
- checking whether the new CTO is thinking correctly,
- catching framing drift,
- preventing overreach,
- correcting weak prompts,
- enforcing evidence discipline,
- protecting the founder from being led by bad assumptions.

### Claude Code
Responsible for:
- narrow, evidence-based repo or subsystem investigation,
- proof collection,
- reporting commands, outputs, failures, file paths, and runtime evidence.

Claude Code is **not** the strategist. It is the instrument.

---

## 4. Product ladder

There are three AKIOR products.

1. **AKIOR Full** — current priority, main product
2. **AKIOR Light** — downstream product, built only from what AKIOR Full has actually proven
3. **AKIOR Cloud** — downstream Docker/cloud service version for users who do not want the local-first hardware path

### Product ladder rules

- AKIOR Full is first.
- AKIOR Light is second.
- AKIOR Cloud is third.
- Light and Cloud may inherit only from **proven** AKIOR Full patterns.
- Light and Cloud are **not** to be described as solved, trivial, or "just duplication" unless evidence proves that.
- Target capability parity across Full / Light / Cloud is product intent, not current execution proof.

---

## 5. Core product intent to preserve

AKIOR Full is intended to be a **non-technical AI assistant and control system**, not merely a chat app.

Core intended domains:
- communication,
- scheduling,
- contacts / people context,
- memory / knowledge,
- task handling,
- internet assistant work,
- briefing-based assistant behavior.

### Non-technical user rule

The user must not be pushed into:
- terminal commands,
- credential files,
- hidden keys,
- client secrets,
- developer-console work,
- manual technical setup.

External connections should remain browser-based and inside the AKIOR system wherever the product rules require that posture.

---

## 6. Proof model

AKIOR is proof-based.

Nothing counts as done because code exists.

Use only these states:
- **Verified**
- **Built but not yet checked**
- **Planned**
- **Outdated**

### Evidence tiers for supervision

- **Tier 1** — proven by direct execution evidence under realistic conditions
- **Tier 2** — proven by tests, local runs, or sandbox evidence
- **Tier 3** — designed / documented / scaffolded but not executed
- **Tier 4** — claimed with no supporting evidence yet

### Anti-drift rule

Do not convert:
- UI presence into backend proof,
- one successful flow into subsystem completion,
- documentation into runtime proof,
- founder certainty into engineering proof,
- prior CTO language into accepted truth.

---

## 7. Best-known current truth

This section preserves the current supervisory baseline.

### 7.1 Product focus
- AKIOR Full is the active product.
- Current work is still fundamentally Product 1 first.

### 7.2 Stronger proven areas
- WhatsApp link and send have documentary evidence of end-to-end success.
- Founder also supplied same-day phone-side evidence showing that messaging AKIOR on WhatsApp results in a reply in the live thread.
- This is stronger than "linked only."

### 7.3 Important limitation on that WhatsApp proof
The WhatsApp evidence does **not** automatically prove:
- full delegated task execution,
- full contact-rule behavior,
- approval logic correctness,
- multi-step assistant workflow completion,
- production robustness.

### 7.4 Google / Gmail truth boundary
- Gmail browser-session lane is proven end-to-end (read side).
- **Google Workspace browser-first bundle is CLOSED as a suite** (GOOGLE-WORKSPACE-BUNDLE-CLOSURE-AUDIT-01, 2026-04-15). All four providers (Gmail live read, Google Calendar live read, Google Drive minimal browse, Google Contacts minimal list) are proven end-to-end on the managed-browser-gateway lane at product anchor `fa3c4ffd9e85d1e0c237d7d443baf2228d54ed66`.
- Gmail send/compose/reply is **not** solved (registry `capabilities.send=false`).
- Google write/upload/share/delete/move/rename/download/preview/search/detail/edit/merge for Calendar / Drive / Contacts are **not** solved.
- Known non-blocking note: the `[data-id]` CDP selector used by Drive and Contacts picks up Google WIZ-data script entries alongside truthful rows; this is carved-out future scope, not an active blocker.
- Google direction must remain aligned with the non-technical browser-first posture recorded in the current decision chain (DEC-033).

### 7.5 UI truth boundary
- Significant UI already exists.
- The UI PDF is useful evidence of built screens, flow, layout, and identified UX/backend gaps.
- Some UI areas are explicitly described as front-end only, incomplete, buggy, or needing structural cleanup.

### 7.6 Governance reality
- The project has real working parts.
- The written records are not fully clean.
- Drift exists because multiple prior CTOs/operators touched the project.
- Contradictions must be surfaced, not smoothed over.

---

## 8. Known supervisory risks

The following risks must be actively watched when supervising the new CTO.

### Risk 1 — Whole-repo audit too early
A blind full-repo audit on Day 1 creates noise, wastes tokens, and encourages shallow conclusions.

### Risk 2 — Founder-intent upgraded into proof
Statements such as "all three products have full functionality" are product-direction statements unless backed by execution evidence.

### Risk 3 — UI equals backend fallacy
A rich UI flow PDF can make an incomplete system look more complete than it is.

### Risk 4 — One-proof inflation
A working WhatsApp reply lane does not prove the entire communication or assistant system is complete.

### Risk 5 — Record precedence drift
Older roadmap or planning artifacts may conflict with newer status/restore/decision truth.

### Risk 6 — New CTO tries to be strategic too early
If the new CTO starts with roadmap generation, architecture conclusions, or rebuild talk before contradiction review, drift has already begun.

---

## 9. Document precedence order

When records conflict, use this precedence order until a newer explicitly approved truth replaces it:

1. **Latest direct execution evidence**
   - phone screenshots,
   - runtime proof,
   - test logs with concrete evidence,
   - bounded successful verification results.

2. **Restore / locked-state truth**
   - restore block,
   - current next-action lock,
   - locked baseline notes.

3. **Current status / decisions / blockers / handoff cluster**
   - current status,
   - decisions,
   - blockers,
   - handoff.

4. **Roadmap / planning artifacts**
   - only if not contradicted by newer locked truth.

5. **Founder brief / UI PDF / requirement wishlists**
   - valid for intent,
   - not automatic proof.

If two sources conflict, the new CTO must call it out explicitly.

---

## 10. New CTO first-day protocol

The new CTO must follow this sequence.

### Phase 1 — Intake
Ask for:
- founder brief,
- status / SSOT,
- restore / handoff,
- blockers,
- decisions,
- roadmap,
- next-action file,
- UI PDF / screenshots,
- strongest proof artifacts.

### Phase 2 — Contradiction detection
Before asking for repo work, identify:
- what the docs agree on,
- what the docs conflict on,
- what appears current,
- what appears outdated.

### Phase 3 — Narrow repo orientation
Only after document intake:
- repo shape,
- stack,
- entry points,
- key services,
- CI/test surfaces,
- browser automation surfaces.

### Phase 4 — Focused proof review
Pick the smallest high-value subsystem to verify next.

### Phase 5 — Narrow Claude Code pass
Only after the above should the new CTO issue a focused Claude Code prompt.

### Forbidden first-day behavior
The new CTO must not:
- start with a blind whole-codebase audit,
- jump directly into coding,
- produce a roadmap from assumptions,
- smooth over contradictions,
- claim completion without evidence,
- describe Light or Cloud as easy duplicates without proof.

---

## 11. Claude Code usage standard

When the new CTO directs Claude Code, the prompt must be:
- narrow,
- evidence-driven,
- read-first,
- subsystem-scoped,
- explicit about what proof is being collected.

Claude Code prompts should request:
- exact folder or subsystem,
- commands run,
- pass/fail results,
- file paths,
- screenshots if UI verification is involved,
- clear distinction between what worked and what merely exists.

Claude Code should not be asked to "understand the whole project" in one pass.

---

## 12. Supervisor review checklist

Whenever the founder receives a message from the new CTO, the CTO supervisor must check:

1. Did the new CTO preserve the Full / Light / Cloud ladder?
2. Did he separate intent from proof?
3. Did he ask for the smallest next high-value evidence set?
4. Did he avoid whole-repo overreach?
5. Did he identify contradictions instead of glossing over them?
6. Did he treat screenshots and PDFs as bounded evidence?
7. Did he avoid fake percentages or fake certainty?
8. Did he keep Claude Code narrow and useful?
9. Did he avoid roadmap fantasy before evidence intake?
10. Did he name the right next step?

If the answer to any of these is no, intervention is required.

---

## 13. Intervention rules

If the new CTO drifts:
- stop the drift immediately,
- state the exact error,
- rewrite the founder's reply if necessary,
- tighten the next prompt,
- force the process back to the correct sequence.

### Common intervention examples

If the new CTO says: "We should audit the whole repo first."
Response: No. Start with document contradiction review and evidence triage.

If the new CTO says: "Light and Cloud should be easy once Full is done."
Response: Unsupported. Treat that as product strategy, not engineering proof.

If the new CTO says: "The UI shows this feature exists."
Response: UI presence is not backend completion.

If the new CTO says: "WhatsApp is solved."
Response: Narrow it. Which WhatsApp capability is solved, and what remains unproven?

---

## 14. Founder messaging guardrails

The founder should avoid sending the new CTO statements framed like:
- "this part is basically done,"
- "the rest should be easy,"
- "everything works except a few things,"
- "we are close,"
- "just duplicate Full into Light/Cloud."

Better founder framing:
- "Here is what I believe is true."
- "Here is the proof I have."
- "Here is what I think may be outdated."
- "Tell me what is supported, unsupported, or contradicted."

---

## 15. Update rule for this SSOT

This document should be updated only when one of the following happens:
- a new proof artifact materially changes the accepted truth,
- a contradiction is resolved,
- a newer locked-state document replaces an older one,
- the supervisory sequence itself needs correction.

Do not update this document just because a new opinion appears.
Update only when evidence or approved truth changes.

---

## 16. Immediate supervisory stance

As of now, the correct supervisory stance is:
- protect the Day-1 process,
- keep the new CTO evidence-based,
- force contradiction review before repo sprawl,
- preserve the product ladder,
- preserve the non-technical user rule,
- preserve proof discipline,
- use the CTO supervisor as the firewall between founder instinct and CTO overreach.

---

## 17. One-sentence operating summary

**AKIOR supervision rule:** preserve product intent, demand proof, surface contradictions, keep the new CTO narrow and disciplined, and never let founder strategy or attractive UI be mistaken for verified system truth.

---

## 18. Verified Local Execution Floor

This section records the **verified hardware and runtime floor on the AI Desktop host** as of 2026-04-16. This is a **Tier-1 / Tier-2 evidence statement** — it describes what currently exists and is observable, not what is aspirational.

### 18.1 Hardware floor (verified present and largely idle)
- **GPU 0:** NVIDIA RTX PRO 6000 Blackwell Workstation Edition — **96 GB VRAM** — present, driver-visible, capable of holding the 72B-class weight set in VRAM. Currently largely idle.
- **GPU 1:** NVIDIA RTX 3090 — **24 GB VRAM** — present, driver-visible, suitable for mid-sized weight sets and secondary inference. Currently largely idle.
- **GPU 2:** NVIDIA RTX 4060 Ti — **16 GB VRAM** — present, driver-visible, mostly free. Currently used as display GPU and mostly free for small-model / auxiliary inference.
- **System RAM:** **128 GB** — material headroom for CPU-side pipelines, embeddings, caches, and ancillary workloads.

### 18.2 Runtime floor (verified running)
- **Ollama:** already running as a local inference daemon.
- **OpenClaw:** already running with the Ollama plugin wired.
- **Temporal:** already running as the durable workflow runtime.

### 18.3 Model floor (verified installed)
- `qwen2.5:72b` — installed. Sized for Blackwell 96 GB.
- `qwen2.5-coder:32b` — installed. Sized for Blackwell or 3090 depending on quantization.
- `qwen2.5:7b` — installed. Sized for 3090 / 4060 Ti / CPU fallback.
- `nomic-embed-text` — installed. Default local embedding surface.

### 18.4 Current load state (verified)
- No models are **currently loaded into VRAM**. The floor exists and is idle. Loading is on demand.

### 18.5 Scope of this floor
This floor is **AI-Desktop-specific**. It does **not** override or replace the Mac-Mini experiment constitution in `AKIOR-OS-SSOT-v1.0-EXPERIMENT-LOCK.md`, which governs a different host with different hardware (Mac Mini M4, 24 GB unified RAM). Where AKIOR Full runs on AI Desktop, this floor applies. Where it runs on Mac Mini, the Mac-Mini constitution applies.

### 18.6 What this floor does not prove
Consistent with §6 and §7, hardware presence does **not** prove:
- any end-to-end AKIOR capability,
- any orchestrated lane correctness,
- any deployed product feature,
- any successful inbound-message triage round-trip.

The floor is a **capability substrate**. Capability is proven by bounded execution, not by hardware inventory.

---

## 19. Execution-Floor Ownership Law

This law defines who owns the execution floor and what that ownership obligates.

### 19.1 Ownership
The founder owns the hardware, the host, and the hosting costs. The CTO supervisor owns **the doctrine that governs how the floor is used**. The new CTO owns **the narrow execution decisions** that apply the doctrine to the current bounded lane. Claude Code owns **the instrumented evidence collection** inside the current lane.

### 19.2 Non-transferability
Floor ownership is **not transferable to downstream execution agents**. A Claude Code prompt, a sub-agent, a plugin, or a workflow may **use** the floor under the doctrine below. It may not **redefine** the floor, widen its scope, or silently route around it.

### 19.3 Change control on the floor
Material changes to the floor (adding/removing a GPU, adding/removing a runtime, adding/removing a model tier, relocating the model store) require:
- founder acknowledgment,
- an entry in `LIVE_STATE.md` at claim level `Observed` or `Tested` or `Externally verified`,
- update of this section (§18) in the next SSOT revision.

Silent floor edits are treated as drift and must be surfaced by the CTO supervisor.

### 19.4 Floor health is a supervisory concern
If the floor becomes unhealthy (a GPU falls off the bus, a daemon crashes, the model store becomes inaccessible), the new CTO **must** report the health regression before continuing any bounded lane that depends on it. The founder does not learn about floor regressions from product failures; they learn about them from supervisory reports.

---

## 20. Hardware-Aware Routing Law

This law governs which physical resource handles which class of work. It is **doctrinal**, not a runtime configuration: the law defines the routing intent and the proof requirement. Implementation of the routing is out of scope for this document and belongs in the execution layer.

### 20.1 Routing intent by class of work
- **Heavy reasoning, long-context, high-quality local inference →** Blackwell 96 GB (primary local heavy worker). Default local home for 72B-class models.
- **Mid-tier inference, coder-class inference, secondary reasoning →** RTX 3090 24 GB. Default home for 32B and below when the Blackwell is reserved or warm-loaded with a different weight set.
- **Small-model inference, embeddings at scale, auxiliary preprocessing, display →** RTX 4060 Ti 16 GB. Default home for 7B-class, embeddings when VRAM-hosted, and any display-path work.
- **CPU-bound pipelines, large in-memory corpora, non-GPU workloads →** 128 GB system RAM. Default home for batch embeddings over disk-resident corpora, message queue buffering, and Temporal workflow state.
- **Orchestration, workflow durability, retry/compensation →** Temporal.
- **Model serving surface →** Ollama (via OpenClaw plugin).
- **External escalation (cloud API: Claude, etc.) →** reserved for cases where local cannot meet the proof bar. See §23.

### 20.2 Proof-before-routing rule
A routing decision **is not proven by intent alone**. Before any lane claims "routed correctly on local floor," the lane must produce:
- the model that ran,
- the GPU it loaded on,
- the VRAM consumption,
- the latency distribution or at least the single-call latency under realistic input,
- the output quality sample,
- the failure mode under unhappy inputs.

Absent this evidence, the routing is **Tier-3 (scaffolded)**, not **Tier-1 (verified)**.

### 20.3 No silent cloud substitution
If a bounded lane is declared to run on the local floor, the implementation **may not** silently fall back to cloud without surfacing that substitution in the lane's evidence artifact. Silent substitution is a proof-boundary violation (§6 anti-drift rule).

### 20.4 No silent downshift
If the intended resource is unavailable (e.g., Blackwell busy), the lane must either (a) wait, (b) explicitly downshift to a named lower tier with the downshift recorded in evidence, or (c) fail the lane. It may not silently run on a different tier and report success as if the intended tier had served it.

---

## 21. Three-Tier Inference Stack

This section defines the three doctrinal tiers of inference available to AKIOR. Tiers are **not** synonyms for model size — they are **scopes of permitted use**.

### 21.1 Tier-L (Local heavy)
- Physical home: Blackwell 96 GB primarily; RTX 3090 24 GB secondarily.
- Model class: 32B–72B, long-context, reasoning-heavy.
- Permitted use: any bounded lane whose proof bar can be met locally.
- Cost posture: **$0 marginal** per call.
- Escalation condition: local quality insufficient under realistic evaluation (§23.2).

### 21.2 Tier-M (Local mid / small)
- Physical home: RTX 3090, RTX 4060 Ti, CPU+RAM.
- Model class: 7B–32B and embeddings; classification, extraction, summarization, boilerplate, vector ops.
- Permitted use: preprocessing, pre-filters, classification, extraction, embedding, short-context tasks, and any task where Tier-L would be over-provisioning.
- Cost posture: **$0 marginal** per call.
- Escalation condition: local quality insufficient **and** the task is not a good fit for Tier-L.

### 21.3 Tier-C (Cloud escalation)
- Physical home: Claude API (and equivalent external APIs under the same doctrine).
- Model class: frontier cloud models.
- Permitted use: **only** tasks where Tier-L has been attempted under realistic input and failed the proof bar, **or** tasks explicitly classified as frontier-only by the CTO supervisor.
- Cost posture: **paid per call** — counts against the API budget in `AKIOR-OS-SSOT-v1.0-EXPERIMENT-LOCK.md` Rule 4.
- Escalation is a **deliberate act**, logged with the local attempt and its failure mode recorded.

### 21.4 Tier mixing inside a single lane is allowed and normal
A single lane may use Tier-M to preprocess, Tier-L to reason, and Tier-C to cover a frontier sub-step. Tier mixing is not a violation — it is the intended shape of most bounded lanes. The requirement is that each tier's contribution is evidenced.

### 21.5 Tier demotion is not a failure
If a lane originally planned for Tier-L proves fine on Tier-M, that is a legitimate optimization — record it as such. The supervisory concern is **silent** tier movement, not justified tier movement.

---

## 22. Anti-Idle Oracle Utilization Law

The floor is expensive capacity. Idle capacity while cloud spend accrues is a **doctrinal failure**, not a neutral state.

### 22.1 The law
Where the local floor can do the work at an acceptable proof bar, the local floor **shall** do the work. Routing a task to Tier-C while Tier-L is idle and would have sufficed is a supervisory error.

### 22.2 "Oracle-style" framing
The name refers to the operational discipline of keeping owned capacity productive and treating external paid capacity as the **exception**, not the default. The label imports no vendor stack; it imports the discipline.

### 22.3 What this law is not
This law is **not** a mandate to maximize GPU utilization for its own sake. It does not require make-work. It does not require speculative model-loading. The local floor is allowed to be idle when there is no bounded lane that needs it. The law activates when **a lane exists and the floor is the right home for it**.

### 22.4 Anti-fake-parallelism
The law also forbids **fake parallelism**: spinning up multiple concurrent lanes that do not actually progress independent bounded work, burning VRAM and attention for the optics of activity. One bounded mutable lane at a time unless safe isolation is **proven** (§25 preserved doctrine). This law tightens utilization **inside** that discipline; it does not relax it.

### 22.5 Supervisory check
The CTO supervisor must ask, at each routing decision:
- Is the local floor capable of this task at an acceptable proof bar?
- Is it idle or under-loaded right now?
- Is cloud escalation being proposed for a reason that would survive §23.2?

If the answer to the first two is yes and the third is no, the supervisor intervenes.

---

## 23. Proof-First Hybrid Operating Model

This section reconciles local-first utilization with evidence-first discipline so they do not contradict each other.

### 23.1 The hybrid is real
AKIOR runs on a **hybrid**: local floor (Tier-L, Tier-M) + cloud escalation (Tier-C). The hybrid is not a transitional state. It is the steady-state operating model.

### 23.2 Proof of local sufficiency precedes commitment
Before a bounded lane is **committed to local-only**, the lane must demonstrate that the local tier meets the proof bar on realistic input, including unhappy paths. Until that demonstration exists, the lane is **hybrid-eligible** and may fall back to Tier-C with the escalation recorded.

### 23.3 Proof of cloud necessity precedes cloud default
Before a bounded lane is **committed to cloud-default**, the lane must demonstrate that the local tier fails the proof bar on that class of work. Until that demonstration exists, cloud-default is **unsupported** and violates §22.

### 23.4 Evidence-first wins every tie
Where §22 (anti-idle) and §6 (evidence-first) appear to conflict — e.g., local is idle but local has not been proven on this work class — **evidence-first wins**. The lane may run on cloud for this pass, with the local-proof step booked as the explicit next bounded lane. §22 is not a license to route to unproven local surfaces.

### 23.5 First proof lane (current)
The **first bounded proof lane** under this hybrid model is **AKIOR inbound message triage** limited to **classify + extract**. Reply drafting is **out of scope** for this proof lane. The proof artifact must show:
- the inbound sample set (real or realistic),
- the classification taxonomy applied,
- the extraction schema,
- the tier that served the work (expected Tier-M primarily),
- accuracy / failure mode under unhappy inputs,
- round-trip latency under realistic load.

No further AKIOR lane is promoted past scaffolding until this one is at Tier-1/Tier-2 evidence.

### 23.6 No new frameworks yet
The hybrid is built on **OpenClaw + Ollama + Temporal**. No new orchestration framework, no new inference server, no new workflow engine is introduced until the first proof lane is verified. Additions after that must pass the §24 scale-out gate.

### 23.7 One mutable lane, one mutable merge surface
Preserved doctrine: **one mutable implementation lane at a time, and one mutable merge surface at a time**, unless safe isolation is **proven**. Adding a hybrid does not dilute this. It constrains it further: the hybrid is a routing doctrine, not a parallelism doctrine.

---

## 24. Scale-Out Gate

Scale-out (adding hardware, adding frameworks, adding lanes, adding products) is governed by a **gate**, not by ambition.

### 24.1 Preconditions for scale-out
Scale-out is allowed only when **all** of the following hold:
1. The **current bounded proof lane** (§23.5) is at Tier-1 or Tier-2 evidence.
2. The **local floor** (§18) is still healthy and the routing law (§20) is still being honored.
3. The proposed scale-out has a **named uncertainty it reduces** and a **named proof it will produce**.
4. The proposed scale-out does not create a **second mutable merge surface** without proven isolation.
5. The founder has explicitly acknowledged the scale-out in a supervisory message.

### 24.2 Forbidden scale-out shapes
The following are **not** acceptable under this gate:
- Scale-out framed as "we should be faster" with no named uncertainty.
- Scale-out that adds a new framework before the current stack has produced one verified lane.
- Scale-out that fans out AKIOR Full, Light, and Cloud in parallel — see §4 product-ladder rules.
- Scale-out that migrates work from a verified local tier to a cloud tier "for consistency" without a §23.3 demonstration.
- Scale-out that adds GPUs or hosts before the existing floor is demonstrably saturated **on proven work**, not on speculative work.

### 24.3 Supervisory language for the gate
When a scale-out is proposed, the CTO supervisor responds in exactly three ways:
- **"Gated open — proceed with named proof."** (all preconditions met)
- **"Gated held — cite missing precondition."** (not yet; point to the specific unmet precondition)
- **"Gated refused — restates forbidden shape."** (the proposal matches §24.2)

No fourth mode is allowed. "Maybe later" is a held gate, not a new mode.

### 24.4 Closing the gate behind a successful scale-out
After a scale-out is Tier-1 verified, the supervisor **updates §18 (floor), §20 (routing law), and §23 (hybrid model)** in the next SSOT revision to reflect the new proven surface. Scale-out that is not reflected in the SSOT is drift, even when the code works.

---

## 25. Preserved doctrine (re-asserted without change)

The following doctrines remain in force exactly as written elsewhere; §18–§24 above do not soften them:
- **Evidence first.** No claim becomes accepted truth until reconciled against evidence (§2).
- **One bounded lane first.** Widen only after the current lane is bounded and proven (§23.7).
- **One mutable implementation lane at a time** unless safe isolation is proven (§23.7).
- **One mutable merge surface at a time** unless safe isolation is proven (§23.7, §24.1.4).
- **Anti-fake-parallelism.** Concurrency without independent bounded progress is not parallelism (§22.4).
- **Anti-drift.** Do not convert UI into backend, one proof into subsystem, documentation into runtime, certainty into proof, prior CTO language into accepted truth (§6).
- **Product ladder.** Full first, Light second, Cloud third, inherit only from proven (§4).
- **Non-technical user rule.** No terminal, no credentials files, no developer-console work pushed onto the user (§5).

---

## 26. Updated one-sentence operating summary

**AKIOR supervision rule (v2):** preserve product intent, demand proof, surface contradictions, keep the new CTO narrow and disciplined, route every task to the cheapest tier that meets the proof bar on the verified local execution floor, never let idle owned capacity become a reason for cloud default, never let cloud default become a substitute for local proof, and never let founder strategy or attractive UI be mistaken for verified system truth.
