AKIOR Phase 5 Live Interaction Pack

Files
- useAkiorVoiceState.ts
- akior-state-machine.ts
- AkiorMicDemo.tsx
- phase5-live-guide.txt
- phase5-akior-css-addon.css
- phase5-contract.json

What this adds
- live mic amplitude hook
- stable state resolution logic
- silence detection
- speaking / thinking priority behavior
- demo component for mic + request + TTS testing

Integration order
1. Keep Phase 4 component and CSS
2. Add useAkiorVoiceState.ts
3. Add phase5-akior-css-addon.css after akior.css
4. Wire request lifecycle to setThinking()
5. Wire TTS playback lifecycle to setSpeaking()
6. Use audioLevel to drive AKIOR pulse during listening/speaking
