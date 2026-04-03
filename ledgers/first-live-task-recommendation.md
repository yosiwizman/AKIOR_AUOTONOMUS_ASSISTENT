# First Live Task Recommendations

**Created:** 2026-04-01T02:28Z

## Ranking Criteria
- **Reliability:** uses only verified PASS connectors
- **Business value:** actionable output for owner
- **Low blast radius:** read-only, no outbound messages, no deployments

---

## Rank 1: Gmail + Calendar Morning Briefing (read-only)

**Task:** Read latest 20 inbox emails, classify by urgency, cross-reference today's calendar, produce a prioritized daily briefing written to ~/akior/evidence/terminal/daily-briefing.md

**Why first:**
- Uses Gmail (PASS) and Calendar (PASS) — both verified
- Pure read + classify — zero outbound risk
- Immediate business value: owner gets structured daily priorities
- Validates the exact flow the Morning Briefing scheduled task will use

**Blast radius:** None. Read-only.

---

## Rank 2: Gmail/Wix Customer Operations Summary (read-only, no outbound replies)

**Task:** Search Gmail for customer-facing emails (Wix orders, support inquiries, customer messages). Classify each by type (order, question, complaint, return). Produce a customer operations summary at ~/akior/evidence/terminal/customer-ops-summary.md

**Why second:**
- Uses Gmail (PASS) only
- Read + classify only — no replies, no outbound
- Directly relevant to business operations
- Surfaces customer issues that may need owner attention

**Blast radius:** None. Read-only. No Wix login required — works from Gmail side only.

---

## Rank 3: GitHub Repository Health Scan

**Task:** Use `gh` CLI to list all repos, check for open PRs, open issues, recent commits. Produce a repo health summary at ~/akior/evidence/terminal/github-health-summary.md

**Why third:**
- Uses GitHub (PASS) — verified
- Read-only scan of existing repos
- Useful for software domain awareness
- Lower immediate business value than email/customer tasks

**Blast radius:** None. Read-only.

---

## Recommendation

Start with **Rank 1** (Morning Briefing). It validates the scheduled task pipeline with zero risk and delivers immediate value.
