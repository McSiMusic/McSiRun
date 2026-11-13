# McSiRun - Tactical Edition

A fullscreen client-side arcade game built with Next.js, Redux Toolkit, PixiJS, and the Web Audio API. The game uses demo credits only; no backend or real-money wagering is involved.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- `app/` contains the App Router entry point, modern gaming UI styling, and Inter font setup.
- `src/store/` keeps wallet and round state in Redux Toolkit. Session hydration is deferred to a client effect to avoid SSR mismatches, and the `cs16_chicken_road_state_v1` session key stores wallet settings, language and the last 15 rounds. Sound starts muted and its preference is stored separately in local storage as `mcsirun_sound_muted`.
- `src/lib/gameMath.ts` centralizes multiplier, hit-risk, bet-clamp, payout calculations and the 20-step cap. At step 10 players can cash out for the demo pistol or continue; later cashouts through step 19 also award the pistol. Step 20 automatically cashes out and awards the demo AWP | Dragon Lore prize.
- `src/lib/audio/soundEngine.ts` preloads the supplied AWP audio sample, playing only its first two seconds at 9% gain with a short fade, and synthesizes other effects; a procedural AWP sound is used only if the sample fails.
- `src/pixi/` owns SVG artwork, the high-resolution PNG impact overlay, and isolated scene entities. The chicken starts in front of crate 1, and Play immediately risks the first jump onto its lid; later jumps land on subsequent crate lids. The React canvas bridge initializes PixiJS, watches its host with `ResizeObserver`, syncs snapshots, and tears the renderer down on unmount.
- `src/components/` separates the header, demo wallet top-up, instructions, full-viewport canvas, result banner, and floating responsive betting controls. The scene uses the dock's measured height to keep the track clear. Bet and difficulty edits leave a finished board intact; Play applies the selected difficulty to a new round. After a round the button reads Play Again until reload, and loss results appear after the elimination animation.
- The settings menu switches English/Russian and offers PWA installation where supported. The service worker caches sprites, icons and the AWP sound; the application shell still requires a network connection.
- `.github/workflows/ci.yml` runs lint, strict TypeScript checking, and a production build on pushes and pull requests.

## Checks

```bash
npm run lint
npx tsc --noEmit
node --test
npm run build
```

