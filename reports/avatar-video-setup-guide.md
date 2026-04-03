# AI Avatar Video Calls on macOS — Setup Guide

**Date:** 2026-04-03
**Status:** Research complete, ready for owner action

---

## Executive Summary

You can use a VRM avatar as your video feed in Zoom, Google Meet, Teams, and most conferencing apps on macOS. **FaceTime has significant limitations** — Apple restricts third-party virtual cameras in FaceTime, though newer CoreMediaIO Camera Extensions (macOS 13+) may partially work. The recommended stack is **VCamApp + VRM avatar + OBS (optional fallback)**.

---

## 1. VCamApp (Recommended — Primary Tool)

**What it is:** A macOS-native app that renders a VRM avatar with face/hand tracking via your webcam, and exposes it as a virtual camera via CoreMediaIO Camera Extension.

**Brew install:**
```bash
brew install --cask vcamapp
```

**Version:** 0.13.3 (open-source, GitHub: vcamapp/app)

**Key features:**
- Face, hand, and finger tracking using your Mac's webcam
- VRM 0.x and 1.0 avatar support (auto-converts 0.x to 1.0)
- Apple Silicon optimized (also works on Intel Macs)
- Virtual camera appears as "VCam - CameraExtension" in app camera lists
- Menu bar integration
- External tracker support (iFacialMocap, VCamMocap for higher fidelity)

### Setup Steps

1. Install: `brew install --cask vcamapp`
2. Launch VCam from Applications
3. **Enable Camera Extension** (required on macOS Sequoia 15+):
   - System Settings > General > Login Items & Extensions
   - Click the info icon next to "Camera Extensions"
   - Enable VCam.app
4. Load a VRM avatar file (drag-and-drop or use the file picker)
   - Free avatars available at VRoid Hub (hub.vroid.com)
   - Or create custom avatars with VRoid Studio (free)
5. In your conferencing app, select **"VCam - CameraExtension"** as your camera

### Pricing
- Free tier with basic features
- Paid tiers available for advanced features (check vcamapp.com)

---

## 2. VRM Avatars — Where to Get Them

**VRM** is the standard avatar format (based on glTF). Sources:

| Source | URL | Notes |
|--------|-----|-------|
| VRoid Hub | hub.vroid.com | Browse/download community avatars |
| VRoid Studio | vroid.com/studio | Create your own avatar (free app) |
| Ready Player Me | readyplayer.me | Photo-to-avatar, exports VRM |
| Booth.pm | booth.pm | Japanese marketplace, paid/free avatars |

VCamApp auto-converts VRM 0.x to 1.0 — any VRM file should work.

---

## 3. App Compatibility Matrix

| App | VCam Virtual Camera | Notes |
|-----|---------------------|-------|
| Zoom | YES | Select "VCam - CameraExtension" in video settings |
| Google Meet | YES | Works in Chrome camera selector |
| Microsoft Teams | YES | Camera selector in settings |
| OBS Studio | YES | Add as video capture source |
| Slack Huddles | YES | Camera selector |
| Discord | YES | Camera selector |
| FaceTime | PARTIAL/NO | Apple restricts virtual cameras; Camera Extensions (macOS 13+) may appear but behavior is unreliable |
| Safari WebRTC | PARTIAL | Some virtual cameras blocked |

### FaceTime Workaround

FaceTime has historically blocked all third-party virtual cameras since macOS 10.14 Mojave. With macOS 13+ Camera Extensions (CoreMediaIO), some extensions now appear in FaceTime, but results are inconsistent. **For reliable avatar calls, use Zoom or Google Meet instead.**

If FaceTime is absolutely required:
- Use OBS virtual camera (sometimes registers due to system extension depth)
- Or use Continuity Camera with iPhone + a separate avatar app feeding into iPhone camera (not practical)

---

## 4. OBS Studio (Alternative / Compositing Layer)

OBS provides a virtual camera and allows compositing multiple sources. Useful as a fallback or for advanced setups.

**Brew install:**
```bash
brew install --cask obs
```

**Version:** 32.1.1

### OBS + Avatar Setup

**Option A: VCamApp output into OBS**
1. Run VCamApp with your avatar
2. In OBS, add a Video Capture source, select "VCam - CameraExtension"
3. Add overlays, backgrounds, or other sources as needed
4. Start OBS Virtual Camera (Tools > Start Virtual Camera)
5. In conferencing app, select "OBS Virtual Camera"

**Option B: VU-VRM as OBS Browser Source (mic-based lip sync, no webcam needed)**
1. Clone VU-VRM: `git clone https://github.com/Automattic/VU-VRM ~/akior/forge/vu-vrm`
2. In OBS, add a Browser Source pointing to the local `index.html`
3. OBS must be launched with mic access for browser sources:
   ```bash
   open -a OBS --args --enable-media-stream
   ```
4. Load a VRM file in the browser source, adjust lip-sync levels
5. Avatar lip-syncs to your microphone without needing a webcam
6. Start OBS Virtual Camera for use in conferencing apps

**VU-VRM is ideal for:** audio-only avatar presence (no face tracking, just lip sync from mic volume). Good for multitasking or when you don't want webcam tracking.

---

## 5. Other Notable Tools

| Tool | Type | Notes |
|------|------|-------|
| **Hyper: VTuber Avatar Studio** | Mac App Store | Face + hand mocap, VRM support, virtual webcam. Polished UI. |
| **Celluloid** | macOS app | Virtual camera with AI enhancements, works with FaceTime (claims CoreMediaIO extension). Worth testing. |
| **XSplit VCam** | Cask: `xsplit-vcam` | Background replacement, but does NOT work with FaceTime/Safari. |
| **VSeeFace** | Windows only | Not available on macOS. |

---

## 6. VU-VRM (Automattic) — Reference Clone

**Repo:** https://github.com/Automattic/VU-VRM
**What:** Lip-sync VRM avatar client. No webcam needed — uses microphone volume for mouth movement (like a VU meter).
**Use case:** Zero-webcam avatar presence in OBS virtual camera pipeline.

```bash
# Clone for reference (lightweight, single HTML file + JS)
git clone https://github.com/Automattic/VU-VRM ~/akior/forge/vu-vrm
```

This is a browser-based tool. Load it as an OBS browser source or serve locally.

---

## 7. What Works and What's Limited on macOS

### Works Well
- VCamApp face/hand tracking with VRM avatars into Zoom/Meet/Teams
- OBS virtual camera as compositing layer
- VU-VRM mic-based lip sync (no webcam dependency)
- CoreMediaIO Camera Extensions on macOS 13+ Ventura and newer

### Known Limitations
- **FaceTime blocks most virtual cameras.** Apple's restriction. CoreMediaIO extensions sometimes appear but may not render correctly.
- **OBS virtual camera can override system camera.** Known bug where OBS's system extension persists even after uninstall, hijacking FaceTime's camera. Fix: delete `/Library/CoreMediaIO/Plug-Ins/DAL/` OBS entries and `/Library/SystemExtensions/` OBS entries.
- **Safari WebRTC** also restricts some virtual cameras.
- **Performance:** Running face tracking + avatar rendering + virtual camera + conferencing = moderate CPU/GPU load. Apple Silicon handles it well; Intel Macs may struggle.
- **Audio sync:** VCamApp provides video only. Your microphone audio goes directly through the conferencing app as normal.

---

## 8. Recommended Action Plan

**Phase 1 — Quick Setup (30 min)**
1. `brew install --cask vcamapp`
2. Download a VRM avatar from VRoid Hub
3. Launch VCamApp, load avatar, enable Camera Extension in System Settings
4. Test in Zoom or Google Meet

**Phase 2 — Advanced (optional, 1 hr)**
1. `brew install --cask obs`
2. Clone VU-VRM for mic-based lip sync option
3. Set up OBS compositing with background scenes
4. Test OBS Virtual Camera in conferencing apps

**Phase 3 — FaceTime (experimental)**
1. Test if VCam Camera Extension appears in FaceTime camera selector
2. If not, try Celluloid (claims FaceTime support via Camera Extension)
3. Accept that FaceTime avatar support is unreliable — use Zoom/Meet for avatar calls

---

## Download Links

| Tool | Install | URL |
|------|---------|-----|
| VCamApp | `brew install --cask vcamapp` | https://vcamapp.com/en |
| VCamApp Source | git clone | https://github.com/vcamapp/app |
| OBS Studio | `brew install --cask obs` | https://obsproject.com |
| VU-VRM | git clone | https://github.com/Automattic/VU-VRM |
| VRoid Studio | Manual download | https://vroid.com/studio |
| VRoid Hub | Browse avatars | https://hub.vroid.com |
| Hyper | Mac App Store | https://apps.apple.com/us/app/hyper-vtuber-avatar-studio/id6476638368 |
| VCam Docs | Reference | https://docs.vcamapp.com/en |

---

*Guide prepared by AKIOR. No large apps were installed — only research and download links provided.*
