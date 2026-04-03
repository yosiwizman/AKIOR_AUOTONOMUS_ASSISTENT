# AKIOR Final Production Handoff

## Canonical folder structure

```text
public/
  akior/
    state-idle.svg
    state-listening.svg
    state-speaking.svg
    state-thinking-loading.svg

src/
  components/
    akior/
      AkiorCore.tsx
      useAkiorVoiceState.ts
      akior-state-machine.ts
  styles/
    akior.css
  demo/
    AkiorDemo.tsx
```

## Install steps

1. Copy `public/akior/*` into your app's public assets folder.
2. Copy `src/components/akior/*` into your component folder.
3. Copy `src/styles/akior.css` into your styles folder and import it once.
4. Use `AkiorCore` for rendering.
5. Use `useAkiorVoiceState` to bind live microphone, request lifecycle, and TTS playback.
6. Use `akior-state-machine.ts` if you want deterministic state resolution outside the hook.
7. Use `src/demo/AkiorDemo.tsx` for validation before integrating with the real voice pipeline.

## Canonical state rules

Priority order:

```text
speaking > thinking > listening > idle
```

Meaning:
- `speaking` only during actual TTS playback
- `thinking` while backend / model / tool request is in flight
- `listening` only when real voice amplitude is detected
- `idle` as the default standby state

## Production guidance

- Do not force `listening` just because the mic is open.
- Always clear `thinking` in `finally` blocks.
- Keep `speaking` tied to actual TTS lifecycle events.
- Respect `prefers-reduced-motion`.
- On mobile, reduce orb size and glow intensity.
