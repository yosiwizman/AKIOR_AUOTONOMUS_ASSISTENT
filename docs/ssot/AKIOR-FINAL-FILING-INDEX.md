# AKIOR OS — Final Filing Index

**Package:** AKIOR OS v1.0-EXPERIMENT-LOCK
**Date:** March 31, 2026
**Status:** LOCKED — Canonical source of truth for the AKIOR experiment build

---

## Canonical File Set

| # | File | Purpose | Size |
|---|------|---------|------|
| 1 | **AKIOR-OS-SSOT-v1.0-EXPERIMENT-LOCK.md** | Master Single Source of Truth. The complete experiment constitution, architecture, reliability layer, local inference layer, and all operational doctrine in one file. This is the Bible. | ~920 lines |
| 2 | **AKIOR-SSOT-LOCK-MEMO.md** | CTO-grade formal statement that the experiment constitution is locked. Lists what is locked, what the owner retains, what is not retained. | ~50 lines |
| 3 | **AKIOR-OWNER-INTERACTION-MODEL.md** | Plain-English document explaining the owner's role: brief, review, override. No babysitting. Written for the owner, not for engineers. | ~85 lines |
| 4 | **AKIOR-BUILD-AUTHORIZATION-GATE.md** | Go/no-go checklist for experiment start. 13-item gate plus bootstrap setup items. Gate status: GO. | ~75 lines |
| 5 | **AKIOR-CONSTITUTIONAL-OVERRIDE-SUMMARY.md** | Bullet summary of the 10 non-negotiable rules from the owner's PDF. Quick reference for the experiment constitution. | ~70 lines |
| 6 | **AKIOR-BOOTSTRAP-HANDOFF.md** | Everything AKIOR needs at first boot: what's locked, what to validate, what tools are in play, what reliability checks to run, what evidence to produce, what local inference checks to run. | ~120 lines |
| 7 | **AKIOR-FINAL-FILING-INDEX.md** | This file. Index of all canonical documents and their purpose. | ~60 lines |

---

## How to Use This Package

**For the owner:** Read the Owner Interaction Model (file 3) and Constitutional Override Summary (file 5). These explain your role and your locked rules in plain English.

**For the bootstrap prompt:** The bootstrap prompt pasted into Claude Code on the Mac Mini should reference the SSOT (file 1) as the governing document. The Bootstrap Handoff (file 6) contains the exact sequence AKIOR follows at first boot.

**For ongoing operation:** The SSOT (file 1) is the single source of truth. If any question arises about what AKIOR is allowed to do, the answer is in the SSOT. If the SSOT and any other document conflict, the SSOT wins.

**For owner review:** The Lock Memo (file 2) and Build Auth Gate (file 4) confirm the experiment is authorized. The owner can reference these to verify that all governance decisions were made and recorded.

---

## Architectural Layers in the SSOT

| Layer | SSOT Sections | Purpose |
|-------|--------------|---------|
| Constitutional Override | Top of document | 10 non-negotiable rules |
| Core Architecture | Sections 1-17 | Executive Core, Parallel Execution, Worker Mesh, Domain Packs, Memory, Routing |
| Local Inference Acceleration | Section 18 | Ollama + MLX as auxiliary engine under Claude orchestration |
| Communications | Section 19 | All approved channels |
| Roadmap | Section 20 | v1-v6 with reliability milestones |
| Operator Reliability Layer | Sections 22-33 | App Catalog, Task Families, App Packs, Golden Tasks, Canaries, Evidence, Bounded-95 |
| Governance History | Section 34 | What was removed by constitutional override |
| Build Authorization | Section 35 | Experiment is GO |

---

## Version History

| Version | Date | What Changed |
|---------|------|-------------|
| v0.1 | Mar 31, 2026 | Initial architecture draft |
| v0.2 | Mar 31, 2026 | 8 CTO redlines applied |
| v0.2.1 | Mar 31, 2026 | 4 precision patches |
| v0.3 | Mar 31, 2026 | Adaptive Capability Engine + Tool Layer Governance + 10 Muscle Groups |
| v0.3.1 | Mar 31, 2026 | Plan/auth wording micro-fixes |
| v0.3.2 | Mar 31, 2026 | Multi-Hat Doctrine + Legal Operations domain |
| v0.3.3 | Mar 31, 2026 | Final consistency patch |
| v0.3.4 | Mar 31, 2026 | Governance alignment patch |
| v0.3.5 | Mar 31, 2026 | Workflow consistency patch |
| v0.3.6 | Mar 31, 2026 | Final micro-patch |
| v0.3.7 | Mar 31, 2026 | Ultra-micro patch (lock-ready) |
| **v1.0-EXPERIMENT-LOCK** | **Mar 31, 2026** | **Owner constitutional override applied. Reliability layer added. Local Inference Acceleration Layer added. Package filed.** |

---

*Final Filing Index — AKIOR OS v1.0-EXPERIMENT-LOCK*
