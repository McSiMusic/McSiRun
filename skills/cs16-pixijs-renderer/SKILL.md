---
name: cs16-pixijs-renderer
description: PixiJS v8 SVG scene, articulated chicken animation, 20-lane track and family-friendly effects.
---

# CS 1.6 PixiJS SVG Rendering Skill

- Lock the app to `100dvh` with no page scrolling; the stage fills the space below the header and the floating bottom dock must not obscure the track or rewards. Use `ResizeObserver` to account for the dock height.
- Load detailed SVG artwork at 2x resolution and the high-resolution PNG screen crack from `public/sprites/` as Pixi textures. Use nearest-neighbor sampling and renderer resolution of at least 2. Never use low-resolution `fillRect` grids or crude procedural `Graphics` paths for game art.
- Build the chicken from separate body, head, wing, and leg SVG sprites in a `Container`. Animate breathing, head movement, wing twitch, and a 60ms crouch, 240ms parabolic jump, and 80ms landing. On elimination animate an incoming tracer; at impact hide the chicken and burst 28-36 white/grey SVG feathers with an impact ring and a fading cracked-glass overlay. No blood, gore, or crate bullet mark.
- Start the full chicken on the street in front of crate 1; Play immediately animates the first risk-checked jump onto its lid and later jumps land on the next crate's lid. Track exactly 20 crates. Mark each safely reached crate with an emerald glow and checkmark. Center multiplier labels at least 16px, a purple-glowing original pistol above crate 10 and the golden prize above crate 20. At step 10 offer a pistol cashout or continued play; a safe step 20 automatically cashes out and triggers a golden flash. Show a result banner after each round and a claim modal for skin wins.
- Render the chicken in front of the enlarged crates and show the reached multiplier floating upward on safe landing. Freeze the displayed curve until Play starts the next round, regardless of edits to bet or difficulty.
- Tiling background SVGs must match at both edges exactly, without cutting architectural or cobblestone details. Move layers at different parallax speeds.
- Position the sniper tracer in the same world coordinate space as the center of a nearby window and the chicken's destination crate; scale it toward the foreground, terminate it at the hit target, and reveal the loss banner and unlock replay after the elimination sequence. Keep the camera and reserved dock area stable across round states.
- Preload and play only the first two seconds of `public/sound/awp.ogg` on elimination at gain 0.09, fading the last 100ms and respecting mute; use procedural fallback only when the sample fails.
- Keep Pixi independent of React, configure textures before loading, resize on host changes, and destroy the application cleanly on unmount.
