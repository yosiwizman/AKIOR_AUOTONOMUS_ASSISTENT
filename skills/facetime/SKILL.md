# FaceTime Audio Call Skill

## Name
facetime-audio

## Description
Initiate FaceTime audio calls from AKIOR via macOS AppleScript or URL scheme. This enables voice communication through Apple's native FaceTime infrastructure without requiring third-party services.

## Methods

### Method 1: URL Scheme (Preferred)
```bash
open "facetime-audio://+15551234567"
```
- `facetime-audio://` initiates an audio-only call
- `facetime://` initiates a video call (use audio scheme for voice calls)
- Accepts phone numbers (E.164 format recommended) or Apple ID email addresses

### Method 2: AppleScript
```bash
osascript -e 'open location "facetime-audio://+15551234567"'
```

### Method 3: AppleScript with FaceTime app
```bash
osascript <<'EOF'
tell application "FaceTime"
    activate
end tell
delay 1
open location "facetime-audio://+15551234567"
EOF
```

## Parameters

| Parameter    | Type   | Required | Description                                      |
|-------------|--------|----------|--------------------------------------------------|
| phone_number | string | Yes      | Phone number in E.164 format (e.g., +15551234567) or Apple ID email |

## Usage Examples

### Call a phone number
```bash
open "facetime-audio://+17865181777"
```

### Call an Apple ID email
```bash
open "facetime-audio://user@icloud.com"
```

### Activate FaceTime first, then call
```bash
osascript -e 'tell application "FaceTime" to activate'
sleep 1
open "facetime-audio://+17865181777"
```

## Safety

- ALWAYS confirm with the owner before placing a call (override to autonomous rule for live calls)
- Log all call attempts to ~/akior/ledgers/action.md
- Save evidence to ~/akior/evidence/terminal/

## Limitations

1. **Requires FaceTime app** — must be installed and signed in with an Apple ID on the Mac
2. **Recipient must have Apple device** — FaceTime only works between Apple devices (iPhone, iPad, Mac, Apple Watch)
3. **Apple ID required** — the Mac must be signed into an Apple ID with FaceTime enabled
4. **No programmatic call control** — cannot hang up, mute, or detect call status via AppleScript
5. **No call recording** — FaceTime does not natively support call recording
6. **Network required** — requires active internet connection (Wi-Fi or Ethernet)
7. **No PSTN fallback** — if the recipient is not on an Apple device, the call will fail silently or show an error in the FaceTime UI
8. **Regional restrictions** — FaceTime is not available in all countries

## Bundle Info
- App: /System/Applications/FaceTime.app
- Bundle ID: com.apple.FaceTime
- URL Schemes: `facetime://` (video), `facetime-audio://` (audio)
