#!/bin/bash
# whisper-transcribe.sh — Transcribe audio files via whisper-cpp
# Handles ogg/opus (WhatsApp voice messages) by converting to wav first.
# Usage: whisper-transcribe.sh <audio-file>
# Outputs transcription text to stdout.

set -euo pipefail

INPUT="$1"
MODEL="/Users/yosiwizman/.openclaw/models/ggml-base.bin"
WHISPER="/opt/homebrew/bin/whisper-cli"
FFMPEG="/opt/homebrew/bin/ffmpeg"

if [ ! -f "$INPUT" ]; then
  echo "[whisper-transcribe] File not found: $INPUT" >&2
  exit 1
fi

MIME=$(file --brief --mime-type "$INPUT" 2>/dev/null || echo "unknown")
EXT="${INPUT##*.}"

# If the file is wav and not opus-in-ogg, try direct
if [[ "$EXT" == "wav" && "$MIME" == "audio/x-wav" ]]; then
  exec "$WHISPER" -m "$MODEL" --no-timestamps "$INPUT" 2>/dev/null
fi

# Otherwise convert to wav via ffmpeg
TMPWAV=$(mktemp /tmp/whisper-XXXXXX.wav)
trap 'rm -f "$TMPWAV"' EXIT

"$FFMPEG" -y -i "$INPUT" -ar 16000 -ac 1 -c:a pcm_s16le "$TMPWAV" </dev/null >/dev/null 2>&1

"$WHISPER" -m "$MODEL" --no-timestamps "$TMPWAV" 2>/dev/null
