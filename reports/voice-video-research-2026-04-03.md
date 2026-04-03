# Voice & Video Call Research Report

**Date:** 2026-04-03  
**Author:** AKIOR  
**Scope:** FaceTime automation, AI avatar video calls, feasibility assessment

---

## 1. FaceTime Native Automation

### What Works
- FaceTime responds to AppleScript (`tell application "FaceTime" to get name` returns "FaceTime").
- **facetime:// URL scheme** can initiate calls: `open facetime://user@example.com` or `open facetime://+15551234567` works from Terminal.
- **FaceTime Links** (macOS 12+): A Go library (`holysoles/facetime`) wraps FaceTime to create shareable call links via a web server. Links work in Chromium browsers for non-Apple users.
- **OpenClaw skill** (`facetime-auto-call`): Published on ClawHub. Uses AppleScript + UI scripting to initiate audio/video calls. Claims 100% success rate with multi-depth fallback for notification clicking.
- **facetimectl** (GitHub: `omonimus1/facetimectl`): CLI tool for making FaceTime calls from terminal.

### Limitations
- Apple **moves the Call confirmation button** between macOS releases. Sequoia (15.x) is reportedly the most difficult for UI scripting. Every major macOS version breaks existing AppleScript approaches.
- FaceTime has **no official scripting dictionary** -- all automation is UI scripting (clicking buttons), which is fragile.
- Requires: Apple ID signed into FaceTime, accessibility permissions for the controlling process, recipient must have FaceTime-enabled Apple device.
- **Audio-only** automation is more reliable than video (video requires camera access approval).
- No way to programmatically **answer** incoming calls without UI scripting.

### Feasibility Rating: **Medium**
- Audio calls: Achievable today using `facetime-auto-call` OpenClaw skill or `facetimectl`.
- Video calls: Achievable but fragile (UI scripting breaks across OS updates).
- Setup time: ~1 hour (install skill, grant accessibility permissions, test).
- Cost: Free (uses existing Apple ID and Mac hardware).
- Risk: Apple can break this with any macOS update.

---

## 2. AI Avatar Over Video Call (WebRTC/LiveKit)

This is the most promising path for AKIOR to appear as a visual presence on calls.

### Option A: LiveKit Agents + Avatar Plugin (Recommended)

LiveKit is an open-source real-time communication framework with first-class avatar support.

**Supported avatar providers (LiveKit plugins):**

| Provider | Self-Hosted | Realistic | Latency | Pricing |
|----------|------------|-----------|---------|---------|
| bitHuman | Yes (Docker+GPU) | High (photo-realistic) | Low (~40ms) | 2 credits/min self-hosted |
| Tavus | No (cloud) | Very high | Low | Usage-based (contact sales) |
| Hedra | No (cloud) | High | Low | API-based |
| Simli | No (cloud) | High | Low | API-based |
| Anam | No (cloud) | High | Low | API-based |
| AvatarTalk | No (cloud) | Medium-High | Low | API-based |
| LemonSlice | No (cloud) | Medium | Low | API-based |

**How it works:**
1. LiveKit Agent runs STT + LLM + TTS pipeline
2. Avatar plugin joins the LiveKit room as a video participant
3. Agent sends audio to avatar worker, which generates lip-synced video at 25 FPS
4. End user sees a talking avatar in a standard WebRTC video call

**bitHuman Self-Hosted (best for AKIOR):**
- Requires: NVIDIA GPU with 8+ GB VRAM (RTX 3080 or better)
- Runs 8 concurrent sessions per GPU
- Docker container, ~5 GB model weights (auto-downloads)
- 25 FPS lip-synced output from any face image
- Startup time: ~48 seconds (after initial model download)

**Feasibility Rating: Medium-Hard**
- AKIOR's Mac Mini does NOT have an NVIDIA GPU. Would need either:
  - Cloud GPU instance (RunPod, Lambda, etc.) ~$0.30-0.80/hr for RTX 3080+
  - External eGPU (Thunderbolt) with NVIDIA card ~$500-1000 hardware
  - Use cloud-only providers (Tavus, Hedra, etc.) -- no GPU needed locally
- Setup time: 2-4 hours (LiveKit + avatar provider setup)
- Cost: $50-200/month for moderate usage with cloud GPU, or API credits

### Option B: OpenAvatarChat (Fully Open Source)

Modular digital avatar chat system from Alibaba's HumanAIGC team.

**Components:** VAD (Silero) + ASR (SenseVoice) + LLM (MiniCPM-o) + TTS (CosyVoice) + Avatar (LiteAvatar/MuseTalk)

**Hardware requirements (full local):**
- LiteAvatar mode: ~24 GB VRAM (LLM + ASR + TTS + Avatar)
- Cloud-API mode: ~3 GB VRAM (only avatar rendering local)
- Requires: Linux, CUDA 12.4+, Python 3.11

**Feasibility Rating: Hard**
- Requires NVIDIA GPU (not available on Mac Mini)
- Linux-only (no macOS support)
- Heavy VRAM requirements for full local deployment
- Would need a dedicated Linux server with GPU
- Setup time: 4-8 hours
- Cost: $200-500 for cloud GPU server setup

### Option C: Amica (3D Avatar, Lightweight)

Open-source 3D anime-style avatar with voice chat, runs in browser.

- **No GPU required** for the avatar rendering (WebGL in browser)
- Uses external APIs for STT/LLM/TTS (OpenAI, etc.)
- Emotion engine with facial expressions
- Runs as a web app

**Feasibility Rating: Easy-Medium**
- Can run on Mac Mini (no GPU needed)
- 3D anime style, NOT photo-realistic
- Setup time: 1-2 hours
- Cost: API costs for STT/LLM/TTS (~$5-20/month)
- Limitation: Not suitable for "real person" video calls

---

## 3. Screen Sharing with Avatar Overlay

### Pickle AI Approach
Pickle AI creates a photo-realistic AI avatar that replaces your webcam feed in Zoom/Teams/FaceTime. It lip-syncs to your live voice with near-zero latency.

- **Not open source** -- proprietary product
- Works as virtual camera driver
- Could theoretically be used to make AKIOR "appear" on FaceTime/Zoom calls

**Feasibility Rating: Medium**
- Depends on Pickle AI availability and pricing
- Would need a way to route AKIOR's TTS audio through the system
- Setup time: 1-2 hours if the product is accessible
- Not self-hosted, privacy concerns

### DIY Virtual Camera Approach
1. Generate avatar video with any avatar engine (bitHuman, MuseTalk, etc.)
2. Route output through a virtual camera (OBS Virtual Camera)
3. FaceTime/Zoom picks up the virtual camera as the video source

**Feasibility Rating: Medium-Hard**
- OBS Virtual Camera works on macOS
- Still needs GPU for avatar rendering (cloud or external)
- More manual setup, but maximum flexibility
- Setup time: 3-6 hours
- Cost: GPU rental + avatar service costs

---

## 4. Third-Party Managed Services

| Service | What It Does | Pricing | Good For |
|---------|-------------|---------|----------|
| Tavus | Photo-realistic AI avatars, API | Contact sales (likely $0.05-0.15/min) | Production video agents |
| bitHuman | Avatar rendering API + self-hosted | 2 credits/min | High-volume, privacy-first |
| Hedra | Realistic avatar generation | API-based | Quick integration with LiveKit |
| Anam | Real-time interactive avatars | API-based | Customer-facing use cases |
| Call Annie | AI companion with avatar | Free/consumer | Reference only, not self-hosted |

**Feasibility Rating: Easy**
- No GPU or special hardware needed
- Just API integration
- Setup time: 1-2 hours
- Cost: $20-100/month depending on usage
- Trade-off: dependency on external service, data leaves your infrastructure

---

## 5. Summary & Recommendations

### Recommended Path (Phase 1 -- Immediate)

**FaceTime Audio Calls via AppleScript**
- Install `facetime-auto-call` OpenClaw skill or `facetimectl`
- Grant accessibility permissions
- AKIOR can make outbound FaceTime audio calls today
- Feasibility: **Easy** | Setup: ~1 hour | Cost: **Free**

### Recommended Path (Phase 2 -- Short Term)

**LiveKit + Cloud Avatar Provider (Tavus or Hedra)**
- Set up LiveKit server (self-hosted or cloud)
- Integrate cloud avatar provider (no local GPU needed)
- AKIOR appears as a realistic talking avatar on WebRTC video calls
- Callers connect via web browser link (works on any device)
- Feasibility: **Medium** | Setup: ~4 hours | Cost: **$30-100/month**

### Recommended Path (Phase 3 -- If GPU Available)

**LiveKit + bitHuman Self-Hosted**
- Add NVIDIA GPU to infrastructure (eGPU or cloud instance)
- Full privacy, 8 concurrent sessions, 25 FPS photo-realistic avatar
- Feasibility: **Medium-Hard** | Setup: ~6 hours | Cost: **$500 one-time + $30-80/month cloud GPU**

### NOT Recommended
- OpenAvatarChat: Too heavy, Linux-only, requires 24GB+ VRAM
- SadTalker/Wav2Lip standalone: Not real-time, designed for batch processing
- Building from scratch: Massive effort, solved problem

---

## Hardware Gap

The Mac Mini's lack of an NVIDIA GPU is the main constraint for self-hosted avatar rendering. Options to address:
1. **Cloud GPU** (RunPod/Lambda/Vast.ai): $0.30-0.80/hr, spin up on demand
2. **eGPU via Thunderbolt**: One-time ~$300 enclosure + ~$300-600 GPU
3. **Cloud-only avatar APIs**: No GPU needed, pay per minute

---

*Research complete. No installations were made. All findings based on public documentation and web research.*
