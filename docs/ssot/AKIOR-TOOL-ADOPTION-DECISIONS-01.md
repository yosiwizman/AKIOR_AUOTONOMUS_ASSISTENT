# AKIOR — External Tool Adoption Decisions

**Timestamp:** 2026-04-01T13:00Z
**Issued by:** CTO (owner) review
**Authority:** REFERENCE — CTO decision record
**Scope:** 5 external tools/projects reviewed for AKIOR adoption
**SSOT impact:** NONE — the locked master SSOT (v1.0-EXPERIMENT-LOCK) remains unchanged

---

## Purpose

The CTO reviewed 5 externally-developed tools/projects and classified each for AKIOR's roadmap. This document records those decisions so AKIOR does not re-evaluate these tools without cause, and does not introduce them into live operations prematurely.

---

## Decisions

### 1. Skilz / Skillzwave
| Field | Value |
|-------|-------|
| Classification | **ADOPT LATER — HIGH VALUE** |
| Purpose | Skill installation, version pinning, reproducible skill management for Claude Code |
| Role in AKIOR | Future skill infrastructure layer — would standardize how AKIOR installs, versions, and manages its growing custom skill library |
| Priority | High |
| Timing | v2/v3 infrastructure maturity phase |
| Why not now | AKIOR's current skill library is small enough to manage manually. The immediate critical path is Wix customer ops and browser workflow hardening, not skill infrastructure. Skilz becomes valuable when AKIOR has 10+ custom skills requiring version management. |

### 2. automating-mac-apps-plugin
| Field | Value |
|-------|-------|
| Classification | **ADOPT LATER — MEDIUM-HIGH VALUE** |
| Purpose | Apple-native macOS app automation (Mail, Notes, Calendar, Reminders, Contacts, Keynote, Numbers) |
| Role in AKIOR | Future Mac-native operations layer — would enable AKIOR to control Apple apps directly without browser workarounds |
| Priority | Medium-high |
| Timing | Evaluate in Forge / lab first, not on the current Wix critical path |
| Why not now | Current operations primarily use web-based surfaces (Wix, Gmail connector, GitHub CLI). Mac-native app automation is valuable but not on the critical path for Live Pilates customer ops or the current v1 validation targets. Should be lab-tested in Forge before any production use. |

### 3. skills_viewer
| Field | Value |
|-------|-------|
| Classification | **ADOPT LATER — MEDIUM VALUE** |
| Purpose | Inspect and debug the Claude Code skill stack |
| Role in AKIOR | Developer/debug utility — useful for understanding what skills are loaded, their configuration, and troubleshooting skill conflicts |
| Priority | Medium |
| Timing | Add when AKIOR's custom skill library becomes larger |
| Why not now | AKIOR's current skill stack is small and well-understood. The debug utility becomes valuable when the stack grows complex enough to need inspection tooling. Not a customer-ops or production priority. |

### 4. confluence-skill
| Field | Value |
|-------|-------|
| Classification | **CONDITIONAL** |
| Purpose | Confluence documentation workflows (read, create, update Confluence pages) |
| Role in AKIOR | Only relevant if Confluence becomes a real operating surface for AKIOR or the owner's business |
| Priority | Conditional / low for now |
| Timing | Only adopt if Confluence enters the live workflow |
| Why not now | Confluence is not currently part of any AKIOR domain, Live Pilates workflow, or Software 4 All pipeline. No reason to adopt unless it becomes an active surface. |

### 5. ShowUI-Aloha
| Field | Value |
|-------|-------|
| Classification | **R&D ONLY** |
| Purpose | Teach-once GUI workflow research — a system for learning GUI interaction patterns from demonstration |
| Role in AKIOR | Future experimental GUI-learning lane — could theoretically reduce the effort needed to create new App Packs by learning from human demonstrations |
| Priority | Research only |
| Timing | Not part of current production stack or current Wix/customer-ops path |
| Why not now | This is a research project, not a production tool. AKIOR's current GUI needs (Wix, browser automation) are better served by Playwright and Computer Use, which are already in the SSOT-approved stack. ShowUI-Aloha may be interesting for future capability growth but is not on any current critical path. |

---

## Summary

| Tool | Classification | Priority | Timing |
|------|---------------|----------|--------|
| Skilz / Skillzwave | Adopt later | High | v2/v3 |
| automating-mac-apps-plugin | Adopt later | Medium-high | Forge/lab evaluation |
| skills_viewer | Adopt later | Medium | When skill library grows |
| confluence-skill | Conditional | Low | Only if Confluence enters workflow |
| ShowUI-Aloha | R&D only | Research | Not production priority |

**None of these tools are required for immediate AKIOR production operations.** The current production priority remains: harden existing Claude + Wix + browser workflow, complete Live Pilates customer-ops pipeline, and mature the v1 bootstrap before introducing new stacks.

**The locked master SSOT (AKIOR-OS-SSOT-v1.0-EXPERIMENT-LOCK.md) was not modified by this decision.**

---

*Tool Adoption Decisions — CTO review record*
