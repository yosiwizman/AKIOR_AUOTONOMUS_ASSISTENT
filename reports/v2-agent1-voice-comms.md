# V2 Agent 1 -- Voice & Communications Setup Report

**Date:** 2026-04-02
**Agent:** AKIOR v2 / Agent 1
**Scope:** OpenClaw voice plugins, ClawHub skills, iMessage, WhatsApp voice transcription

---

## 1. ClawHub Search Results

### Search: "clawr"
| Skill | Description | Score |
|-------|-------------|-------|
| clawring | clawr.ing | 2.906 |
| clawrag | ClawRAG - Self-hosted RAG & Memory | 2.464 |
| clawra | Clawra | 2.426 |
| clawrma | Clawrma | 2.213 |
| use-clawrss | Use ClawRSS | 2.150 |
| nate-clawrank | Clawrank | 2.102 |

### Search: "voice call"
| Skill | Description | Score |
|-------|-------------|-------|
| voice-call | Voice Call | 3.480 |
| telegram-offline-voice | Telegram Offline Voice | 1.074 |
| phone-voice | Phone Voice Integration | 1.068 |
| vapi-calls | VAPI Calls | 1.059 |
| phone-calls-bland | AI Phone Calls (Bland AI) | 1.048 |
| agentic-calling | Agentic Calling | 1.043 |
| telegram-voice-group | Telegram Voice Group | 1.036 |
| elevenlabs-phone-reminder-lite | ElevenLabs Phone Reminder (Lite) | 1.029 |
| ringbot | RingBot | 1.021 |
| clawcall | ClawCall | 1.000 |

**Note:** VirusTotal verification was not performed on individual skills. The `voice-call` skill (score 3.480) is available as a stock OpenClaw plugin and was enabled directly. ClawHub skills like `clawring`, `phone-voice`, `vapi-calls`, and `phone-calls-bland` were not installed -- they require individual `clawhub install` + VirusTotal review before adoption.

---

## 2. OpenClaw Voice Plugins -- Enabled

All five plugins were successfully enabled. Gateway restart required to apply.

| Plugin | ID | Status | Description |
|--------|----|--------|-------------|
| @openclaw/voice-call | voice-call | **loaded** | OpenClaw voice-call plugin |
| @openclaw/elevenlabs-speech | elevenlabs | **loaded** | OpenClaw ElevenLabs speech plugin |
| @openclaw/deepgram-provider | deepgram | **loaded** | OpenClaw Deepgram media-understanding provider |
| @openclaw/bluebubbles | bluebubbles | **loaded** | OpenClaw BlueBubbles channel plugin |
| @openclaw/imessage | imessage | **loaded** | OpenClaw iMessage channel plugin |

### API Keys Needed

| Plugin | Key Required | Config Field | Status |
|--------|-------------|--------------|--------|
| elevenlabs | ElevenLabs API key | TBD (check `openclaw config`) | **NOT SET -- will not function without key** |
| deepgram | Deepgram API key | TBD | **NOT SET -- will not function without key** |
| voice-call | Depends on provider (ElevenLabs or Deepgram) | N/A | **Depends on speech provider keys above** |
| bluebubbles | BlueBubbles server URL + password | TBD | **NOT SET -- requires BlueBubbles server running on Mac** |
| imessage | Local macOS access (AppleScript) | N/A | **Should work locally -- no external key needed** |

---

## 3. iMessage via BlueBubbles

- **BlueBubbles plugin:** Enabled and loaded.
- **iMessage plugin:** Enabled and loaded (native macOS AppleScript approach).
- **SKILL.md:** Not found at `~/.openclaw/workspace-dev/skills/bluebubbles/SKILL.md`. The skill docs directory does not exist for BlueBubbles.
- **Two paths available:**
  1. **imessage plugin** -- Direct macOS integration via AppleScript. Should work on this Mac Mini without additional setup. Simpler but limited to local machine.
  2. **bluebubbles plugin** -- Requires a running BlueBubbles server (a separate macOS app). More feature-rich (read receipts, group chats, attachments) but needs the BlueBubbles app installed and configured with a server password.

**Recommendation:** Start with the `imessage` plugin for basic send/receive. Adopt BlueBubbles later if richer iMessage features are needed.

---

## 4. WhatsApp Voice Transcription

- **WhatsApp plugin:** Already loaded (`@openclaw/whatsapp`, status: loaded).
- **Config schema `media` section:** Only contains `preserveFilenames` (boolean) and `ttlHours` (integer 1-168). No dedicated voice transcription or media transcription fields found in the top-level config schema.
- **Voice transcription path:** WhatsApp voice messages would need to flow through the `deepgram` plugin (speech-to-text) for transcription. This is not auto-wired -- it requires:
  1. A valid Deepgram API key configured
  2. A workflow or hook that routes incoming WhatsApp voice messages to Deepgram for transcription
  3. Alternatively, ElevenLabs or another STT provider could be used

---

## 5. Also Noted: Related Plugins Available but Not Enabled

| Plugin | Status | Notes |
|--------|--------|-------|
| @openclaw/microsoft-speech | disabled | Alternative to ElevenLabs/Deepgram |
| Talk Voice | loaded | Voice selection management (list/set voices) |
| Phone Control | loaded | Arm/disarm phone node commands |

---

## 6. Summary

### Installed and Ready (pending gateway restart)
- voice-call
- elevenlabs
- deepgram
- bluebubbles
- imessage

### Needs API Keys to Function
- **ElevenLabs** -- requires API key from elevenlabs.io
- **Deepgram** -- requires API key from deepgram.com
- **BlueBubbles** -- requires BlueBubbles macOS server app installed + configured

### Blocked / Needs Further Work
- WhatsApp voice transcription has no built-in config toggle; needs Deepgram key + workflow wiring
- BlueBubbles SKILL.md not found; may need `clawhub install` for the skill pack separately
- ClawHub skills (clawring, phone-voice, vapi-calls, phone-calls-bland) not installed -- need individual review

### Next Steps
1. Set ElevenLabs and Deepgram API keys in OpenClaw config
2. Test `imessage` plugin with a basic send/receive
3. Wire WhatsApp voice message -> Deepgram transcription workflow
4. Evaluate whether BlueBubbles server app is worth installing for richer iMessage support
5. Review ClawHub `clawring` and `phone-voice` skills for potential installation
