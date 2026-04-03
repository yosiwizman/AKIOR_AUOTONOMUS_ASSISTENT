# Avatar Selection Setup Report

**Date:** 2026-04-03
**Status:** Complete

## 1. VCam Installation

- **Method:** `brew install --cask vcamapp`
- **Version:** 0.13.3
- **Location:** /Applications/VCam.app
- **Status:** Successfully installed

## 2. VRM Avatars Downloaded

All avatars stored in `~/akior/avatars/`:

| File | Name | Size | License | Source |
|------|------|------|---------|--------|
| orion.vrm | Orion | 5.9 MB | CC0 | ToxSam / Open Source Avatars (IPFS) |
| aurora.vrm | Aurora | 7.3 MB | CC0 | ToxSam / Open Source Avatars (IPFS) |
| devil.vrm | Devil | 1.3 MB | CC0 | 100Avatars R1 (Arweave) |

All files verified as valid glTF binary model v2 format.

## 3. Jarvis Settings Page - Avatar Section Added

### Files Modified

1. **`packages/shared/src/settings.ts`**
   - Added `AvatarSettings` type (`selectedAvatar`, `avatarsDir`, `vcamEnabled`)
   - Added `avatar` field to `AppSettings` type
   - Added default avatar settings pointing to `~/akior/avatars/`
   - Added `updateAvatarSettings()` export function
   - Updated `normalizeSettings()` to merge avatar defaults

2. **`apps/server/src/utils/settingsContract.ts`**
   - Added Zod schema for `avatar` field in `RawSettingsSchema`

3. **`apps/web/app/settings/page.tsx`**
   - Added `updateAvatarSettings` and `AvatarSettings` imports
   - Added "Avatar Selection" section before the Build Info footer with:
     - VCam toggle (enable/disable virtual camera)
     - 3-column grid of avatar cards (Orion, Aurora, Devil)
     - Click-to-select with blue highlight and checkmark
     - Active avatar preview panel showing selected file

### UI Features

- Avatar cards display in a responsive 3-column grid
- Selected avatar gets a blue border + glow effect + checkmark badge
- VCam toggle uses the same switch style as other settings toggles
- Preview panel shows the active avatar with file path
- Settings persist via the existing localStorage + server sync pipeline

## 4. Additional Avatar Sources

For future expansion, free CC0 VRM avatars can be found at:
- https://opensourceavatars.com/en/gallery (300+ avatars)
- https://github.com/ToxSam/open-source-avatars (JSON registry with download URLs)
- https://github.com/neonglitch86/BunkerBunnies
- https://hub.vroid.com (free community avatars)

## 5. VCam Usage

1. Open VCam.app from /Applications
2. Load a VRM file from ~/akior/avatars/
3. In the Jarvis Settings page, toggle "VCam Virtual Camera" on and select an avatar
4. VCam creates a virtual webcam device usable in any video app (Zoom, Meet, etc.)
