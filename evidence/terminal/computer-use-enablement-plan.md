# Computer Use Enablement Plan

**Generated:** 2026-04-01T04:10Z
**Priority:** CRITICAL PATH — blocks all Live Pilates customer operations
**Status:** Not yet enabled

---

## Why This Is Needed

Wix has no API, no MCP connector, no CLI. Per SSOT Adapter Hierarchy (Sec 24), the only paths to Wix are:
1. Playwright browser automation (preferred)
2. Visual Computer Use — mouse/keyboard/screen (fallback)

Both require browser interaction capability. Claude Code CLI does not include this natively. The following options can enable it:

---

## Option 1: Use Claude Desktop (Recommended)

Claude Desktop (with Cowork or Computer Use enabled) can interact with the browser visually — take screenshots, click, type, read screen content.

**Steps:**
1. Open Claude Desktop on the Mac Mini
2. Start a new conversation or use an existing project
3. Enable Computer Use if prompted (Settings → Beta Features → Computer Use)
4. Brief AKIOR to execute Wix Phase A+B from Claude Desktop
5. AKIOR can then see Chrome, read Wix Inbox, extract content

**Pros:** Native Anthropic capability, no extra installs
**Cons:** Requires switching from Claude Code CLI to Claude Desktop for this task

---

## Option 2: Playwright Browser Automation (Most Deterministic)

Install Playwright and write a script to programmatically read Wix Inbox.

**Steps:**
1. `npm install playwright` (or `pip install playwright`)
2. `npx playwright install chromium`
3. Write a script that connects to or launches a browser, navigates to Wix Inbox, extracts conversation data
4. Requires Wix login credentials or session cookies

**Pros:** Deterministic, scriptable, repeatable, evidence-producing
**Cons:** Wix login may require 2FA handling; initial setup time; may need to handle session/cookies

---

## Option 3: Owner Screenshots (Manual Workaround)

Owner takes screenshots of each Wix Inbox conversation and provides them to AKIOR via file paths.

**Steps:**
1. Owner opens each conversation in Wix Inbox
2. Cmd+Shift+4 to screenshot each conversation
3. Save to ~/akior/evidence/screenshots/wix-inbox/
4. AKIOR reads the screenshots (Claude can read images)

**Pros:** No setup required, works right now
**Cons:** Manual, not repeatable, owner must do the work

---

## Recommendation

**Start with Option 1 (Claude Desktop)** if available — it's the fastest path with native capability. Fall back to Option 3 (screenshots) for immediate unblock if Claude Desktop Computer Use isn't ready yet. Set up Option 2 (Playwright) as the long-term deterministic solution for recurring Wix operations.
