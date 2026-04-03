# Voice Transcription Setup Checkpoint
**Timestamp:** 2026-04-03T01:48:00
**Status:** Configured, pending live test

## What was done
1. Installed whisper-cpp 1.8.4 via Homebrew (binary: /opt/homebrew/bin/whisper-cli)
2. Downloaded ggml-base.bin model (148MB) to /Users/yosiwizman/.openclaw/models/ggml-base.bin
3. Enabled OpenClaw audio transcription: tools.media.audio.enabled = true
4. Enabled transcript echo: tools.media.audio.echoTranscript = true
5. Enabled Groq plugin as fallback provider (free whisper API)
6. Added WHISPER_CPP_MODEL env var to LaunchAgent plist
7. Reinstalled and restarted LaunchAgent

## Config state
- tools.media.audio.enabled: true
- tools.media.audio.echoTranscript: true
- Auto-detection mode (no explicit models list)
- Auto-detect order: whisper-cli (local) -> provider keys (OpenAI -> Groq -> Deepgram -> Google)

## Pending
- Live test: send a voice message to +13054098490 via WhatsApp
- If whisper-cli fails on OGG/Opus, may need to add explicit CLI config with ffmpeg conversion
- Groq API key may be needed if local whisper fails

## Rollback
- openclaw config set tools.media.audio.enabled false
- Remove WHISPER_CPP_MODEL from LaunchAgent plist
