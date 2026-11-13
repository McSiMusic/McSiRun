# AGENTS.md - Project Rules & Architecture Contract

## Operating rules

1. **No git commits or history changes:** Never execute `git commit`, `git push`, `git reset`, or alter git history.
2. **Decomposition:** Keep React UI, PixiJS scene/entities, Redux, audio, and game math separate. Target fewer than 150 lines per module.
3. **Fullscreen without scrolling:** Lock `html`, `body`, `#__next` (if present), and `main` to `100dvh`, full viewport width, and `overflow: hidden`. The canvas fills the viewport beneath the header. Float the betting dock over the bottom of the stage, and use its measured height to keep the track, chicken and rewards clear of it on desktop and mobile.
4. **Detailed artwork:** Render game artwork with PixiJS textures sourced from detailed SVG assets in `public/sprites/`, except for the high-resolution `screen-crack.png` impact overlay. Do not use low-resolution `fillRect` grids or crude procedural Pixi `Graphics` shapes. Build animated characters as containers of separately articulated SVG sprites and animate them with the Pixi ticker.
5. **Family-friendly effects:** Eliminations contain no blood or gore. Animate an incoming tracer, then hide the chicken on impact and burst 28-36 white/grey SVG feathers with an impact ring and fading screen-glass crack. Do not mark the crate.
6. **Twenty lanes and rewards:** Every round has at most 20 steps. On reaching step 10, offer the pistol with an immediate cashout or the choice to keep running. Cashouts from steps 10-19 award the original classified pistol; a safe step 20 awards the AWP | Dragon Lore grand prize and automatically cashes out the maximum multiplier. Show a result banner after every round and a claim modal for skin wins. Mark each safely reached crate with an emerald glow and checkmark.
7. **Readable type:** Desktop (`768px` and wider) HUD labels, controls, status text, and Pixi crate multipliers are at least 16 CSS pixels. Compact mobile labels and controls may use 12-14px below 768px; do not achieve these minimums by scaling text down afterward.
8. **Seamless tiling:** Every repeating background tile must have exact edge-to-edge continuity; windows, cornices and cobblestones must remain intact at seams.
9. **Responsive input:** Support mobile from 360px and desktop from 1280px with `ResizeObserver`, and maintain at least 44 by 44 pixel touch targets.
10. **Audio feedback:** User interactions and game events have Web Audio feedback and a global mute toggle. Default to muted and persist the preference in local storage. Play only the first two seconds of `public/sound/awp.ogg` at gain 0.09, fading the final 100ms, with a procedural fallback only when loading or playback fails.
11. **CI ready:** Pass strict TypeScript (`tsc --noEmit`), ESLint, and the Next.js production build.
12. **Round display:** Settings changes never start or reset a round or alter its displayed multiplier curve. Only Play starts a new round and applies the selected difficulty. After a completed round, label the start button Play Again until the page reloads; this flag is never persisted. Show a stage dim behind the result while keeping the dock interactive; reveal losses only after the elimination sequence.
13. **Depth and feedback:** Before play, the full chicken stands on the street in front of crate 1. Play immediately starts the first risk-checked jump onto its lid; subsequent jumps land on the next crate's lid. Show the reached multiplier on safe landing; retain the cleared-crate effects.
14. **Localization and PWA:** Localize all UI, accessibility labels and dialogs in English and Russian; persist the language in session storage. Provide a chicken-branded installable PWA with a service worker caching game assets and a settings menu for installation and language.

## Architecture

- Next.js App Router with strict TypeScript and Tailwind CSS.
- PixiJS v8 mounted in `src/components/game/PixiStageCanvas.tsx`; resize with `ResizeObserver` and tear down the application on unmount.
- Redux Toolkit and React Redux; persist balance, bet, difficulty, language, and the last 15 rounds to session storage via SSR-safe hydration. Persist the mute preference separately in local storage.
- UI styling uses cs2skin-inspired obsidian/indigo surfaces, violet, amber and emerald accents, rounded controls, and modern sans-serif typography.
- Audio is centralized in `src/lib/audio/soundEngine.ts`.
- Detailed art lives in `public/sprites/`; animated components and scenes live in `src/pixi/`. Use a stacked portrait dock with a difficulty dropdown, and a horizontal dock for landscape and desktop.
