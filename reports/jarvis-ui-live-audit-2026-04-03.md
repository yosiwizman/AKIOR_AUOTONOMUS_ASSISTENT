# AKIOR Console (Jarvis V5) -- Live UI Audit

**Date:** 2026-04-03  
**URL:** http://localhost:3001  
**Version:** AKIOR Console v6.2 (Build: 17a3e39, Apr 3, 08:16 AM)  
**Next.js:** v14.2.35 (dev mode)  
**Node:** v24.13.1  

---

## CRITICAL: Build System Broken -- ALL Pages Affected

### Root Cause
The Next.js dev server has a **corrupted webpack cache**. The file `.next/server/522.js` is missing, causing a cascading failure:

```
Error: Cannot find module './522.js'
Require stack:
- apps/web/.next/server/webpack-runtime.js
- apps/web/.next/server/app/holomat/page.js
```

### Impact
- **ALL CSS files return HTTP 500** -- every page renders completely unstyled (raw HTML)
- **ALL JavaScript chunks return HTTP 500** -- client-side interactivity is broken
- Buttons do not work (e.g., "Quick Access" on login page is non-functional)
- The HUD widget shows "LOADING" / "ERROR" for all metrics (CPU, Memory, Status)
- System status values show as dashes (0%, 0.0GB)

### Fix
Delete `.next` directory and restart the dev server:
```bash
cd ~/akior/forge/jarvis-v5-os/apps/web
rm -rf .next
npm run dev -- -p 3001 -H localhost
```

---

## Route-by-Route Assessment

### Accessible Routes (in sidebar navigation)

| Route | URL | Status | Notes |
|-------|-----|--------|-------|
| Login | `/login` | RENDERS (no CSS/JS) | Warning icon takes up 80% of viewport. Buttons non-functional due to JS 500s. |
| Dashboard/Menu | `/menu` | RENDERS (no CSS) | Lists all modules with descriptions. Layout completely broken -- nav links jammed together horizontally. |
| Voice Assistant | `/jarvis` | RENDERS (no CSS) | Avatar SVG circle renders. Shows idle state. Page very tall due to unsized SVG. |
| 3D Model Studio | `/3dmodel` | RENDERS (no CSS) | Camera/Upload/Text prompt tabs visible. Network cameras: none connected. |
| 3D Viewer | `/3dViewer` | RENDERS (no CSS) | Shows "Provide a modelUrl query parameter." Minimal content. |
| Create Image | `/createimage` | RENDERS (no CSS) | AI Image Studio with DALL-E 3. Prompt textarea and Generate button visible. |
| 3D Printers | `/3dprinters` | RENDERS (no CSS) | "No printers found" -- needs Bambu Labs credentials. Dashboard/History tabs. |
| Files | `/files` | RENDERS (no CSS) | Upload cloud icon takes up 90% of viewport. "Loading files..." stuck. |
| Chat | `/chat` | RENDERS (no CSS) | "Text Chat with Function Calling" using GPT-5. Send button disabled (empty input). Functional layout. |
| Security | `/security` | RENDERS (no CSS) | "Waiting for camera clients" -- needs /camera page open on another device. |
| Camera | `/camera` | RENDERS (no CSS) | Camera Client page. Friendly name input, camera permissions, Wi-Fi config. |
| Holomat | `/holomat` | RENDERS (no CSS) | Fullscreen and SCAN buttons. Minimal content area. |
| Functions | `/functions` | **BLANK** | Completely empty DOM -- page fails to server-render at all. |
| Scheduled Tasks | `/tasks` | RENDERS (no CSS) | "+ Add Task" button. "Loading scheduled tasks..." stuck due to JS failure. |
| Settings | `/settings` | **BLANK** | Completely empty DOM -- page fails to server-render at all. |

### Additional Routes (not in sidebar)

| Route | URL | Status | Notes |
|-------|-----|--------|-------|
| Setup Wizard | `/setup` | RENDERS (no CSS) | 5-step wizard: PIN, HTTPS cert, Remote Access, LLM Provider, Meshy API Key. All unstyled but content visible. |
| Diagnostics | `/diagnostics` | RENDERS (no CSS) | Shows auth state, build info, hostname info. Brand version: 2026-02-02-canonical-host. |
| Display | `/display` | RENDERS (no CSS) | System Status Monitor. Shows CPU, Memory, Uptime -- all showing "--" (loading). |
| Dashboard (direct) | `/dashboard` | **404** | Not a valid route. Sidebar "Dashboard" link points to `/menu`. |
| Devices | `/devices` | Not tested | Directory exists in app/. |
| Onboard | `/onboard` | Not tested | Directory exists in app/. |
| Scan | `/scan` | Not tested | Directory exists in app/. |
| API Health | `/api/health/build` | Exists | API route for build info. |

---

## Visual Quality Assessment

### Current State: UNUSABLE
Every page is rendering as raw, unstyled HTML due to the webpack cache corruption. Under normal conditions the app uses a dark theme ("dark . modern" visible in sidebar footer), but currently:

1. **No dark theme** -- all pages are white background with black text
2. **No layout** -- sidebar navigation renders as a horizontal list of links jammed together
3. **Oversized SVG icons** -- the warning triangle (login), cloud upload (files), and avatar circle (voice) expand to fill the viewport because CSS sizing constraints are missing
4. **HUD widget broken** -- the bottom status bar (date, time, CPU, memory) renders but shows "LOADING" for all values and metrics show dashes
5. **AKIOR Assistant FAB** -- the floating action button with the AKIOR avatar logo renders but is likely non-functional

### What Works Despite CSS Failure
- Server-side HTML rendering works for most pages (content is visible)
- Navigation links are functional (clicking works via full page reload)
- Page titles render correctly ("AKIOR Console")
- Content hierarchy is preserved (headings, paragraphs, lists)
- The setup wizard content is fully readable

### What Is Completely Broken
- `/settings` -- blank page (empty DOM)
- `/functions` -- blank page (empty DOM)
- All client-side JavaScript (form submissions, button handlers, WebSocket connections)
- Theme system (dark mode not applied)
- HUD system metrics (always shows LOADING/ERROR)
- Login Quick Access button (non-functional)

---

## Branding Audit: "Jarvis" vs "AKIOR"

### Good: AKIOR Branding Already Applied
- Page title: "AKIOR Console"
- Sidebar header: "AKIOR"
- Login page: "AKIOR" with "Advanced Knowledge Intelligence Operating Resource" tagline
- Setup wizard: "AKIOR Setup"
- Diagnostics: "AKIOR Diagnostics"
- Display: "AKIOR Display"
- FAB button: "Open AKIOR Assistant" with AKIOR branding
- Chat references "AKIOR's GPT-5 text assistant"
- Files page: "Central library for every asset AKIOR creates"

### Bad: Residual "Jarvis" References
**340 occurrences of "Jarvis/jarvis/JARVIS" across 33 files** in `apps/web/`:

Key files with Jarvis references:
- `app/jarvis/page.tsx` -- the voice assistant route is literally `/jarvis`
- `src/components/JarvisAssistant.tsx` -- main component still named Jarvis
- `src/components/JarvisModelViewer.tsx` -- component name
- `src/hooks/useJarvisConnection.ts` -- hook name (20 occurrences)
- `src/lib/jarvis-function-executor.ts` -- module name
- `src/lib/jarvis-functions.ts` -- module name
- `src/hooks/useFunctionSettings.ts` -- 1 reference
- `app/chat/page.tsx` -- 13 references
- `app/functions/page.tsx` -- 16 references
- `app/holomat/page.tsx` -- 7 references
- `app/settings/page.tsx` -- 30 references
- `app/globals.css` -- 105 CSS class references
- `src/components/HudWidget.tsx` -- 21 references
- `src/components/HudNotificationDropdown.tsx` -- 18 references
- `src/lib/brand.ts` -- 3 references (likely the brand config file)
- `package.json` -- 1 reference

### Branding Recommendations
1. **Rename `/jarvis` route to `/voice` or `/assistant`** -- the URL itself is a Jarvis reference
2. **Rename component files**: JarvisAssistant.tsx -> AkiorAssistant.tsx, JarvisModelViewer.tsx -> AkiorModelViewer.tsx
3. **Rename hook files**: useJarvisConnection.ts -> useAkiorConnection.ts
4. **Rename lib files**: jarvis-function-executor.ts -> akior-function-executor.ts, jarvis-functions.ts -> akior-functions.ts
5. **Update globals.css**: Replace all `.jarvis-*` CSS classes with `.akior-*`
6. **Update brand.ts**: Ensure this is the single source of truth for brand names
7. **Diagnostics page** shows alias `jarvis.local` alongside `akior.local` -- consider removing

---

## Recommendations (Priority Order)

### P0 -- Fix Immediately
1. **Delete `.next` cache and restart dev server** -- this single fix will restore CSS, JS, and all interactive functionality
2. **Investigate why settings and functions pages render blank** -- these may have additional import/build errors

### P1 -- Fix This Week
3. **SVG icon sizing** -- add explicit width/height or max-width constraints to prevent icons from filling the viewport (login warning, files upload cloud, voice avatar)
4. **HUD widget error handling** -- the status bar permanently shows LOADING/ERROR; needs fallback states and error recovery
5. **Dashboard route** -- `/dashboard` returns 404; sidebar links to `/menu`. Either redirect /dashboard -> /menu or create a proper dashboard page

### P2 -- Fix This Sprint
6. **Complete Jarvis-to-AKIOR rebrand** -- 340 occurrences across 33 files
7. **Navigation consistency** -- sidebar nav items have no icons, no active state indicator, and run together without spacing when CSS fails
8. **Login page UX** -- the "First Run Setup Required" flow should auto-redirect to setup, not require a button click that depends on JS

### P3 -- Polish
9. **Remove unused routes** from sidebar (3D Printers when no printers configured, Holomat if not actively used)
10. **Add loading skeletons** -- many pages show "Loading..." text that never resolves without JS
11. **Add error boundaries** -- blank pages (settings, functions) should show a meaningful error

---

## Screenshots Captured

All saved to `~/akior/evidence/screenshots/`:

| File | Route |
|------|-------|
| `jarvis-ui-login.png` | /login (viewport) |
| `jarvis-ui-login-full.png` | /login (full page) |
| `jarvis-ui-dashboard.png` | /dashboard (404) |
| `jarvis-ui-menu.png` | /menu (actual dashboard) |
| `jarvis-ui-chat.png` | /chat |
| `jarvis-ui-settings.png` | /settings (blank) |
| `jarvis-ui-tasks.png` | /tasks |
| `jarvis-ui-functions.png` | /functions (blank) |
| `jarvis-ui-voice.png` | /jarvis (voice assistant) |
| `jarvis-ui-security.png` | /security |
| `jarvis-ui-createimage.png` | /createimage |
| `jarvis-ui-files.png` | /files |
| `jarvis-ui-setup.png` | /setup |
| `jarvis-ui-diagnostics.png` | /diagnostics |
| `jarvis-ui-3dmodel.png` | /3dmodel |
| `jarvis-ui-3dviewer.png` | /3dViewer |
| `jarvis-ui-3dprinters.png` | /3dprinters |
| `jarvis-ui-holomat.png` | /holomat |
| `jarvis-ui-camera.png` | /camera |
| `jarvis-ui-display.png` | /display |

---

## All Discovered Routes

```
/login          -- Auth gate (first-run setup prompt)
/setup          -- 5-step setup wizard
/menu           -- Main dashboard / module index
/jarvis         -- Voice assistant with avatar
/chat           -- Text chat with GPT-5 function calling
/3dmodel        -- 3D Model Studio (Meshy.ai)
/3dViewer       -- 3D model viewer (needs modelUrl param)
/createimage    -- AI Image Studio (DALL-E 3 / GPT Image)
/3dprinters     -- Bambu Lab printer dashboard
/files          -- Shared file library
/security       -- Live camera wall
/camera         -- Camera client (streaming source)
/holomat        -- Futuristic scanning interface
/functions      -- Function management (BLANK)
/tasks          -- Scheduled task management
/settings       -- System configuration (BLANK)
/diagnostics    -- System diagnostics & build info
/display        -- System status monitor (kiosk mode)
/devices        -- Device management (not in sidebar)
/onboard        -- Onboarding flow (not in sidebar)
/scan           -- Scanner (not in sidebar)
/dashboard      -- 404 (not a valid route)
/api/health/build -- Build info API endpoint
/api/auth/me    -- Auth state API endpoint
```
