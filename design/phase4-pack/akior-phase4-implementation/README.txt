AKIOR Phase 4 Implementation Pack

Contents
- AkiorCore.tsx
- akior.css
- akior-tailwind-map.ts
- akior-react-example.tsx
- install-notes.txt

Expected public asset paths
Place these in your public folder:
- /public/akior/state-idle.svg
- /public/akior/state-listening.svg
- /public/akior/state-speaking.svg
- /public/akior/state-thinking-loading.svg

Recommended integration order
1. Copy the 4 state SVG files into /public/akior
2. Add AkiorCore.tsx to your components folder
3. Import akior.css globally or in the component entry
4. Use AkiorCore with state:
   - idle
   - listening
   - speaking
   - thinking

Live voice hookup
- listening: mic permission granted, user is speaking or system is waiting
- speaking: TTS playback or assistant speech output
- thinking: request in flight, model processing, tools running
- idle: default neutral state

Reduced motion
Pass reducedMotion={true} or tie it to prefers-reduced-motion
