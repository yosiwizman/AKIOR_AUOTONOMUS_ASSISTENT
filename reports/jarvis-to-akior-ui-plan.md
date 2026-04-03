# Jarvis V5 to AKIOR UI Migration Plan

**Date:** 2026-04-03  
**Source:** yosiwizman/jarvis-v5-os  
**Target:** ~/akior/dashboard/ (currently static HTML, migrating to Next.js)

---

## Migration Strategy

Migrate the AKIOR dashboard from a single static HTML file to a Next.js + Tailwind app, porting high-value Jarvis V5 components. The existing dark theme (CSS variables) maps cleanly to Tailwind config.

**Two-phase approach:**
1. **Phase A** — Bootstrap Next.js app, port core layout + data components
2. **Phase B** — Port interactive/real-time components, add WebSocket live updates

---

## 1. Components to Copy and Why

### Priority 1 — Direct Value (Phase A)

| Component | Source Path | Why | Effort | Use As-Is / Modify |
|-----------|-----------|-----|--------|---------------------|
| **ActionTimeline** | `apps/web/components/ActionTimeline.tsx` | Display AKIOR action ledger as visual timeline | Medium | Modify — rename props, connect to `/api/status` |
| **LogViewer** | `apps/web/components/LogViewer.tsx` | View ops-console logs and evidence terminal logs | Medium | Modify — point to AKIOR log paths |
| **NotificationToast** | `apps/web/components/NotificationToast.tsx` | Real-time alerts for cron completions, canary failures | Small | Mostly as-is — restyle to AKIOR theme |
| **NotificationHistory** | `apps/web/components/NotificationHistory.tsx` | Alert history panel | Small | Mostly as-is |
| **HudWidget** | `apps/web/src/components/HudWidget.tsx` | Status overlay on dashboard header | Medium | Modify — replace Jarvis metrics with AKIOR services |
| **HudNotificationDropdown** | `apps/web/src/components/HudNotificationDropdown.tsx` | Notification dropdown center | Small | Mostly as-is |
| **ErrorBoundary** | `apps/web/src/components/ErrorBoundary.tsx` | Standard React error handling | Small | As-is |
| **useSystemMetrics** | `apps/web/src/hooks/useSystemMetrics.ts` | CPU/memory/disk polling for dashboard | Small | Modify — point to `/api/status` |
| **useSystemStatus** | `apps/web/src/hooks/useSystemStatus.ts` | Service health polling | Small | Modify — point to `/api/health` |
| **api.ts / apiFetch.ts** | `apps/web/src/lib/api.ts` | API client utility | Small | Modify — set base URL to `localhost:8422` |

### Priority 2 — Valuable Patterns (Phase B)

| Component | Source Path | Why | Effort | Use As-Is / Modify |
|-----------|-----------|-----|--------|---------------------|
| **CalendarApp** | `apps/web/src/components/holomat/CalendarApp.tsx` | Calendar integration widget for dashboard | Medium | Modify — connect to AKIOR Google Calendar MCP |
| **EmailApp** | `apps/web/src/components/holomat/EmailApp.tsx` | Email triage widget | Medium | Modify — connect to `/api/email-triage` |
| **socket.ts + useJarvisConnection** | `apps/web/src/lib/socket.ts`, `hooks/useJarvisConnection.ts` | Real-time WebSocket for live dashboard updates | Large | Modify — rename, connect to AKIOR WebSocket server |
| **JarvisAssistant** | `apps/web/src/components/JarvisAssistant.tsx` | AI assistant chat UI | Large | Heavy modify — rebrand, connect to AKIOR Claude API |
| **ConversationHistory** | `apps/web/components/ConversationHistory.tsx` | Conversation log display | Medium | Modify — connect to AKIOR memory/logs |
| **voice-feedback.ts** | `apps/web/src/lib/voice-feedback.ts` | TTS/voice feedback in browser | Medium | Modify — integrate with AKIOR voice pipeline |
| **ThemeContext** | `apps/web/src/context/ThemeContext.tsx` | Dark/light/custom theme system | Small | Modify — set AKIOR defaults |
| **jarvis-functions.ts** | `apps/web/src/lib/jarvis-functions.ts` | Function calling / tool execution UI | Large | Heavy modify — map to AKIOR tool registry |

### Priority 3 — Future Consideration

| Component | Source Path | Why | Effort | Use As-Is / Modify |
|-----------|-----------|-----|--------|---------------------|
| **DraggableApp** | `apps/web/src/components/holomat/DraggableApp.tsx` | Draggable panel system for dynamic dashboard | Medium | Modify — generic wrapper |
| **AppLauncher** | `apps/web/src/components/holomat/AppLauncher.tsx` | Multi-widget launcher if dashboard grows complex | Medium | Modify |
| **diagnostics page** | `apps/web/app/diagnostics/page.tsx` | System diagnostics view | Large | Heavy modify — different system topology |

---

## 2. Renaming (Jarvis to AKIOR)

| Current Name | New Name | Scope |
|-------------|----------|-------|
| `JarvisAssistant` | `AkiorAssistant` | Component + file |
| `useJarvisConnection` | `useAkiorConnection` | Hook + file |
| `jarvis-functions.ts` | `akior-functions.ts` | Library + all imports |
| `jarvis-function-executor.ts` | `akior-function-executor.ts` | Library + all imports |
| `JarvisModelViewer` | Remove (not needed) | — |
| `BrandMark` | `AkiorBrandMark` | Component — new logo/wordmark |
| `brand.ts` | `brand.ts` | Update constants (name, colors, logo URL) |
| All `Jarvis` string references | `AKIOR` | Global find/replace in ported files |
| Theme colors | Map to AKIOR CSS vars | `--cyan: #00e5ff`, `--green: #00ff88`, etc. |

---

## 3. Dependencies Needed

| Dependency | Version | Purpose | Required In |
|-----------|---------|---------|-------------|
| **Next.js** | 15.x | App Router framework | Phase A |
| **React** | 19.x | UI library | Phase A |
| **TypeScript** | 5.x | Type safety | Phase A |
| **Tailwind CSS** | 4.x | Utility-first styling | Phase A |
| **@tailwindcss/postcss** | 4.x | PostCSS plugin | Phase A |
| **socket.io-client** | 4.x | WebSocket client (if keeping Jarvis pattern) | Phase B |
| **lucide-react** | latest | Icon library (if Jarvis uses it) | Phase A |
| **clsx** or **cn** utility | latest | Conditional class names | Phase A |

**Not needed:** All Jarvis-specific deps (3D viewers, camera libs, smart home SDKs).

---

## 4. Estimated Effort Per Component

| Effort | Time Estimate | Components |
|--------|--------------|------------|
| **Small** | < 1 hour | NotificationToast, NotificationHistory, HudNotificationDropdown, ErrorBoundary, useSystemMetrics, useSystemStatus, api.ts, ThemeContext |
| **Medium** | 1-3 hours | ActionTimeline, LogViewer, HudWidget, CalendarApp, EmailApp, ConversationHistory, voice-feedback.ts, DraggableApp, AppLauncher |
| **Large** | 3-8 hours | socket.ts + useJarvisConnection (WebSocket), JarvisAssistant (chat UI), jarvis-functions.ts (tool execution), diagnostics page |

**Total estimated effort:**
- Phase A (Priority 1): ~12-16 hours
- Phase B (Priority 2): ~16-24 hours
- Phase 3 (Priority 3): ~8-12 hours
- **Grand total: ~36-52 hours**

---

## 5. Priority Order for Migration

### Week 1 — Foundation
1. Scaffold Next.js app at `~/akior/dashboard-next/`
2. Port Tailwind config with AKIOR theme variables
3. Port ErrorBoundary + ThemeContext
4. Port api.ts, useSystemMetrics, useSystemStatus hooks
5. Build main dashboard layout (header, grid, cards) in Next.js

### Week 2 — Core Components
6. Port ActionTimeline — connect to action ledger API
7. Port LogViewer — connect to evidence/terminal logs
8. Port NotificationToast + NotificationHistory
9. Port HudWidget + HudNotificationDropdown
10. Wire all to `/api/*` endpoints on port 8422

### Week 3 — Interactive Features
11. Port CalendarApp + EmailApp widgets
12. Port ConversationHistory
13. Port socket.ts + useAkiorConnection for live updates
14. Add WebSocket endpoint to api.js

### Week 4 — Advanced
15. Port AkiorAssistant (chat UI)
16. Port akior-functions.ts (tool execution UI)
17. Port voice-feedback.ts
18. Polish, test, deploy

---

## 6. What Can Be Used As-Is vs Needs Modification

### As-Is (minimal changes)
- `ErrorBoundary.tsx` — standard React pattern, no Jarvis-specific logic
- `NotificationToast.tsx` — generic toast, just restyle colors
- `NotificationHistory.tsx` — generic list, just restyle
- `HudNotificationDropdown.tsx` — dropdown UI pattern

### Light Modification (rename + reconnect)
- `useSystemMetrics.ts` — change API endpoint URL
- `useSystemStatus.ts` — change API endpoint URL
- `api.ts` / `apiFetch.ts` — change base URL, remove auth headers
- `ThemeContext.tsx` — set AKIOR color defaults
- `HudWidget.tsx` — swap Jarvis metrics for AKIOR service list

### Heavy Modification (significant logic changes)
- `ActionTimeline.tsx` — different data shape (AKIOR ledger format)
- `LogViewer.tsx` — different log format and paths
- `CalendarApp.tsx` — different calendar API (Google Calendar MCP vs Jarvis backend)
- `EmailApp.tsx` — different email source (AKIOR triage API vs Jarvis backend)
- `JarvisAssistant.tsx` — complete rebrand + different AI backend
- `socket.ts` — different WebSocket protocol/events
- `jarvis-functions.ts` — completely different function registry

### Skip Entirely
- All 3D viewer components (3dViewer, JarvisModelViewer, Inline3DViewer)
- Camera components (CameraSettings, camera-handler.ts)
- Smart home (devices page, scan page)
- Auth components (login, useAuth, cookies.ts, csrf.ts)
- Setup/onboarding (setup, onboard, SetupRequiredBanner)
- BrandMark (create new AKIOR branding from scratch)

---

*Generated by AKIOR autonomous planning — 2026-04-03*
