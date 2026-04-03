# V2 Agent 2 — Browser & GUI Capabilities Report

**Date:** 2026-04-02

## 1. MCP Servers — Current State

| MCP Server | Status | Purpose |
|---|---|---|
| **playwright** | Connected | Full browser automation (navigate, click, fill, screenshot, evaluate JS) |
| **firecrawl** | Newly registered | Web scraping/crawling (local mode; hosted mode needs FIRECRAWL_API_KEY) |
| **ddg-search** | Connected | DuckDuckGo web search + page content fetching |
| **context7** | Connected | Library/framework documentation lookup |
| **Supabase** | Connected | Database/backend |
| **Google Calendar** | Connected | Calendar management |
| **Gmail** | Connected | Email read/draft |
| **Ticket Tailor** | Needs auth | Event ticketing |
| **memory** | Connected | Persistent memory store |

### Playwright MCP Tools Available
- `browser_navigate`, `browser_click`, `browser_fill_form`, `browser_type`
- `browser_snapshot`, `browser_take_screenshot`
- `browser_evaluate`, `browser_run_code`
- `browser_press_key`, `browser_select_option`, `browser_hover`, `browser_drag`
- `browser_file_upload`, `browser_handle_dialog`
- `browser_tabs`, `browser_navigate_back`, `browser_resize`
- `browser_console_messages`, `browser_network_requests`
- `browser_wait_for`, `browser_close`

### Firecrawl MCP — Newly Added
- Registered via: `npx -y firecrawl-mcp`
- Scope: local (project-level config at `/Users/yosiwizman/.claude.json`)
- Note: Works in local scraping mode without API key. For hosted Firecrawl service, set `FIRECRAWL_API_KEY` env var.

## 2. OpenClaw Skills — Browser/Web Related

OpenClaw has 23/63 skills ready. No dedicated browser, web scrape, or crawl skills are currently installed. The skills list references browser tooling only in passing (as an alternative for complex web UI interactions).

## 3. ClawHub — Available Skills (Not Installed)

### Web Scraping (clawhub search "scrape")
| Skill | Relevance |
|---|---|
| scrape-web | Generic web scraping (score 3.5) |
| xcrawl-scrape | XCrawl-based scraping (3.4) |
| firecrawl-scrape-cn | Firecrawl scrape Chinese variant (3.4) |
| axelhu-playwright-scrape | Playwright-based scraping (3.2) |
| deep-scraper | Deep recursive scraping (2.5) |

### Browser Automation (clawhub search "browser")
| Skill | Relevance |
|---|---|
| agent-browser-clawdbot | Agent Browser (3.8) |
| browser-automation | Browser Automation (3.8) |
| agent-browser-stagehand | Stagehand-based agent browser (3.6) |
| stagehand-browser-cli | Stagehand Browser CLI (3.6) |
| browser-pc | Browser Automation CLI (3.6) |

### Desktop/GUI Automation (clawhub search "desktop" / "gui" / "screen")
| Skill | Relevance | Notes |
|---|---|---|
| desktop-control-win | Windows-only (3.6) | Not applicable (macOS) |
| linux-desktop | Linux-only (3.5) | Not applicable |
| e2b-desktop | E2B sandbox desktop (3.4) | Cloud VM approach |
| virtual-desktop | Universal browser execution (3.3) | Possible candidate |
| desktop-operator | Desktop operator (3.3) | Generic |
| desktop-agent-ops | Desktop Agent Ops (3.3) | Generic |
| oc-desktop-control | OpenClaw Desktop Control (3.2) | OpenClaw-native |
| screen-monitor | Screen Monitor (3.6) | Monitoring, not control |
| screen-vision | Screen Vision (3.3) | Visual analysis |
| windows-gui-automation-cn | Windows GUI (Chinese) (3.3) | Not applicable |

### ShowUI-Aloha
- **Not found on ClawHub.** No results returned for "ShowUI" search.
- ShowUI-Aloha is a research project (GitHub: showlab/ShowUI) focused on vision-language model-based GUI grounding. It requires GPU inference and is not packaged as a ClawHub skill or MCP server.
- Classification: **R&D-only** — not ready for production integration.

## 4. Summary of Current Capabilities

### Already Working
- **Playwright MCP** — Full browser automation: navigation, clicking, form filling, screenshots, JS evaluation, network monitoring. This is the primary browser tool.
- **DDG Search MCP** — Web search and page content fetching via DuckDuckGo.
- **Firecrawl MCP** — Just registered. Web scraping/crawling in local mode.

### Available but Not Installed
- Several ClawHub browser/scraping skills exist but Playwright MCP already covers most use cases.
- `oc-desktop-control` and `virtual-desktop` are the most promising ClawHub skills for macOS GUI automation, but neither is verified for macOS.

### GUI Automation Gap
- **No macOS-native GUI automation is currently installed.** Playwright handles web browser automation only.
- For true desktop GUI control (clicking native apps, reading screen content), options include:
  1. **AppleScript/osascript** — Already available natively on macOS via Bash
  2. **cliclick** — macOS CLI tool for mouse/keyboard simulation (`brew install cliclick`)
  3. **Hammerspoon** — macOS automation framework with Lua scripting
  4. **oc-desktop-control** (ClawHub) — Untested, may wrap similar tools

### Recommendations
1. **Firecrawl MCP** is now registered and ready to test next session.
2. **Playwright MCP** remains the primary browser automation surface — no changes needed.
3. For macOS GUI automation, consider installing `cliclick` (`brew install cliclick`) as a lightweight first step, rather than large ML-based solutions like ShowUI-Aloha.
4. The `oc-desktop-control` ClawHub skill should be evaluated if more structured GUI automation is needed.
5. ShowUI-Aloha should remain classified as **R&D-only** — it requires GPU resources and is not production-ready for AKIOR's use case.
