---
name: cs16-web-audio
description: Web Audio feedback and real AWP sample playback for McSiRun.
---

# CS 1.6 Web Audio Skill

- Use a lazy-initialized singleton audio engine and respect the Redux mute state for every sound, including sounds already playing. Default to muted and persist the preference in local storage.
- Preload `public/sound/awp.ogg` and play only its first two seconds on elimination at gain 0.09, with a 100ms fade at the end. Log loading/playback errors and use the procedural AWP synthesizer only if the sample fails.
- Synthesize UI clicks, bet adjustments, chicken jumps, safe landings and cashouts with Web Audio. Keep interaction and game-event sounds distinct.
- Elimination visuals must remain family-friendly: no blood or gore; animate a tracer and hide the chicken at impact, showing 28-36 white/grey feather particles, an impact ring and a temporary screen crack, with no crate mark.
- The game runs fullscreen without scrolling. Keep HUD and status text at least 16px on desktop; compact mobile labels may use 12-14px. Automatically cash out after the twentieth safe step.
- Game art must use detailed SVG textures and the PNG screen-crack overlay, not low-resolution `fillRect` grids or crude Pixi `Graphics`; animate the chicken as separately articulated SVG sprites.
- Ensure all repeating SVG background tiles match exactly at their edges, with no sliced windows, cornices or cobblestone bricks.
