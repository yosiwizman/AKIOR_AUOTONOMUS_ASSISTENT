# Jarvis V5 OS — UI Component Audit

**Date:** 2026-04-03  
**Repo:** yosiwizman/jarvis-v5-os  
**Stack:** Next.js (App Router) + Tailwind CSS + TypeScript  
**Structure:** Monorepo (`apps/web`, `apps/server`, `packages/shared`)

---

## 1. Pages (App Router — `apps/web/app/`)

| Page | Description | AKIOR Relevance |
|------|-------------|-----------------|
| `page.tsx` | Root/home page | Low — Jarvis-specific landing |
| `jarvis/page.tsx` | Main assistant view | **HIGH** — chat/assistant UI pattern |
| `chat/page.tsx` | Text chat interface | **HIGH** — reusable chat component |
| `display/page.tsx` | Display/dashboard view | **HIGH** — dashboard layout patterns |
| `devices/page.tsx` | Smart home device control | Medium — device monitoring pattern |
| `diagnostics/page.tsx` | System diagnostics | **HIGH** — maps to AKIOR health checks |
| `settings/page.tsx` | Settings panel | Medium — settings UI pattern |
| `security/page.tsx` | Security dashboard | Medium — security monitoring |
| `files/page.tsx` | File system browser | Medium — file management UI |
| `camera/page.tsx` | Camera viewer | Low — hardware-specific |
| `3dViewer/page.tsx` | 3D model viewer | Low — Jarvis-specific |
| `3dmodel/page.tsx` | 3D model page | Low — Jarvis-specific |
| `3dprinters/page.tsx` | 3D printer control | Low — hardware-specific |
| `createimage/page.tsx` | Image generation | Low — different use case |
| `holomat/page.tsx` | Holomat desktop environment | Medium — multi-app launcher concept |
| `functions/page.tsx` | Function management | Medium — tool/function registry UI |
| `login/page.tsx` | Login/auth page | Low — AKIOR has different auth model |
| `menu/page.tsx` | Navigation menu | Medium — navigation pattern |
| `onboard/page.tsx` | Onboarding flow | Low — AKIOR doesn't need onboarding |
| `scan/page.tsx` | Network scanner | Low — hardware-specific |
| `setup/page.tsx` | Initial setup | Low |
| `test-email-notifications/page.tsx` | Email notification test | Medium — notification testing pattern |

## 2. Reusable Components

### Top-Level Components (`apps/web/components/`)

| Component | Description | AKIOR Relevance |
|-----------|-------------|-----------------|
| `ActionTimeline.tsx` | Action/event timeline | **HIGH** — maps to AKIOR action ledger |
| `ConversationHistory.tsx` | Chat history viewer | **HIGH** — conversation log display |
| `LogViewer.tsx` | Log viewer component | **HIGH** — maps to AKIOR evidence logs |
| `NotificationToast.tsx` | Toast notifications | **HIGH** — real-time alert display |
| `NotificationHistory.tsx` | Notification log | **HIGH** — alert history |
| `NotificationPreferences.tsx` | Notification settings | Medium — preference management |
| `CameraSettings.tsx` | Camera configuration | Low — hardware-specific |
| `InsecureBanner.tsx` | Security warning banner | Low |

### Core Components (`apps/web/src/components/`)

| Component | Description | AKIOR Relevance |
|-----------|-------------|-----------------|
| `HudWidget.tsx` | HUD overlay widget | **HIGH** — status overlay for dashboard |
| `HudNotificationDropdown.tsx` | HUD notification dropdown | **HIGH** — notification center |
| `BuildInfo.tsx` / `BuildInfoModal.tsx` | Build/version info | Medium — version display |
| `ErrorBoundary.tsx` | Error boundary | **HIGH** — standard React pattern |
| `JarvisAssistant.tsx` | Main assistant component | **HIGH** — AI assistant UI pattern |
| `BrandMark.tsx` | Brand/logo component | Low — Jarvis-specific branding |
| `FileUpload.tsx` | File upload component | Medium |
| `SetupRequiredBanner.tsx` | Setup prompt | Low |
| `Inline3DViewer.tsx` | Inline 3D model viewer | Low |
| `JarvisModelViewer.tsx` | 3D model viewer | Low |
| `navigation-bridge.tsx` | Navigation bridge | Medium — routing pattern |

### Holomat Desktop Components (`apps/web/src/components/holomat/`)

| Component | Description | AKIOR Relevance |
|-----------|-------------|-----------------|
| `AppLauncher.tsx` | App launcher/dock | Medium — multi-widget launcher concept |
| `CalendarApp.tsx` | Calendar widget | **HIGH** — calendar integration display |
| `EmailApp.tsx` | Email widget | **HIGH** — email triage widget |
| `ClockApp.tsx` | Clock widget | Medium — time display |
| `CalculatorApp.tsx` | Calculator | Low |
| `SettingsApp.tsx` | Settings widget | Low |
| `DraggableApp.tsx` | Draggable window wrapper | Medium — draggable panel pattern |
| `ModelCreatorApp.tsx` / `ModelViewerApp.tsx` | 3D tools | Low |
| `MeasurementDisplay.tsx` | Measurement overlay | Low |
| `DummyApps.tsx` | Placeholder apps | Low |

## 3. Hooks (`apps/web/src/hooks/`)

| Hook | Description | AKIOR Relevance |
|------|-------------|-----------------|
| `useSystemMetrics.ts` | System metrics polling | **HIGH** — CPU/memory/disk monitoring |
| `useSystemStatus.ts` | Service status polling | **HIGH** — service health checks |
| `useJarvisConnection.ts` | WebSocket connection | **HIGH** — real-time connection pattern |
| `useWeather.ts` | Weather data | Medium — could add to briefing |
| `useAuth.ts` | Authentication | Low — different auth model |
| `useFunctionSettings.ts` | Function config | Low |
| `useSetupStatus.ts` | Setup state | Low |

## 4. Libraries (`apps/web/src/lib/`)

| Library | Description | AKIOR Relevance |
|---------|-------------|-----------------|
| `api.ts` / `apiFetch.ts` | API client | **HIGH** — API communication pattern |
| `socket.ts` | WebSocket client | **HIGH** — real-time data streaming |
| `voice-feedback.ts` | Voice/TTS feedback | **HIGH** — maps to AKIOR voice goals |
| `jarvis-functions.ts` / `jarvis-function-executor.ts` | Function calling | **HIGH** — tool execution pattern |
| `integrations.ts` | Integration registry | Medium — integration management |
| `time-parser.ts` | Natural language time | Medium — utility |
| `capture.ts` / `camera-handler.ts` | Camera/screenshot | Low |
| `cookies.ts` / `csrf.ts` | Auth utilities | Low |
| `brand.ts` | Branding config | Low |

## 5. Infrastructure

| Item | Details |
|------|---------|
| **Context:** | `ThemeContext.tsx` (theme system), `NotificationContext.tsx` (notification state) |
| **Styling:** | Tailwind CSS (`tailwind.config.ts`), `globals.css` |
| **Config:** | `next.config.mjs`, TypeScript throughout |
| **Server:** | Express backend with routes for auth, smart home, LLM, ops, security, lockdown |
| **CI/CD:** | GitHub Actions (CodeQL, Dependabot, `jarvis-ci.yml`, secret scanning) |

## 6. Recommended Components to Port to AKIOR

### Priority 1 — Direct Value

1. **ActionTimeline** — Display AKIOR action ledger entries in a visual timeline
2. **LogViewer** — View ops-console logs and evidence logs
3. **HudWidget + HudNotificationDropdown** — Status overlay + notification center for dashboard
4. **NotificationToast** — Real-time alerts (cron completions, canary failures)
5. **useSystemMetrics / useSystemStatus hooks** — System monitoring with polling
6. **socket.ts + useJarvisConnection** — Real-time WebSocket data for live dashboard updates

### Priority 2 — Valuable Patterns

7. **JarvisAssistant / chat page** — AI assistant chat UI (for future AKIOR web chat)
8. **ConversationHistory** — Conversation log display
9. **CalendarApp + EmailApp (holomat)** — Calendar and email widgets for dashboard
10. **voice-feedback.ts** — TTS/voice feedback (aligns with AKIOR voice goals)
11. **jarvis-functions.ts** — Function calling/tool execution UI pattern
12. **ThemeContext** — Theme system (dark/light/custom)
13. **ErrorBoundary** — Standard error handling

### Priority 3 — Future Consideration

14. **DraggableApp** — Draggable panel system for a more dynamic dashboard
15. **AppLauncher** — Multi-widget launcher (if AKIOR dashboard grows complex)
16. **diagnostics page** — System diagnostics view

## 7. Migration Notes

- Jarvis uses **Next.js App Router** — AKIOR dashboard is currently static HTML. Two paths:
  - **Quick path:** Extract component logic and adapt to vanilla JS/HTML for current dashboard
  - **Full path:** Migrate AKIOR dashboard to Next.js (recommended long-term)
- Jarvis theme system uses CSS variables similar to current AKIOR dashboard — theme porting is straightforward
- WebSocket patterns from Jarvis could replace the current manual-refresh approach in AKIOR
- The holomat desktop metaphor (draggable app windows) is an interesting pattern if AKIOR dashboard evolves into a full web OS

---

*Generated by AKIOR autonomous audit — 2026-04-03*
