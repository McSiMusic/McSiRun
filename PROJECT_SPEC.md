# Chicken Road: CS 1.6 Tactical Edition - Technical Specification & Task Plan

## 1. Product Overview
Build a playable browser crash/step-multiplier game inspired by **Chicken Road** and styled to fit **cs2skin.com** (`cs2skin.com/crash` dark tactical UI fused with **Counter-Strike 1.6** pixel art rendered in **PixiJS**).

- **Core Loop:** Player sets a bet amount and difficulty level, clicks **Play**, and hops the CS 1.6 chicken crate-by-crate across an endless `cs_italy` street. Each safe landing on a `de_dust` crate raises the multiplier. After at least 1 step, the player can **Cash Out** to win `bet * multiplier`, or risk jumping to the next crate. If an AWP sniper hits the chicken on the next lane, the round ends immediately and the bet is lost.
- **No Backend:** 100% client-side game math, simulated live-wins ticker, and `sessionStorage` persistence via Redux Toolkit.

---

## 2. Visual & Technical Architecture

### A. Top Header Bar (`src/components/layout/Header.tsx`)
- **Left:** Pixel-art `CHICKEN ROAD` branding + simulated **Live Wins** ticker (`Yellow Sleepy... +$168.00`) and fake online counter (`Online: 981`).
- **Right:** `How to play?` button (opens pixel modal), Wallet Balance pill (`$ 1,000.00` initial demo balance + quick `+ Refill` when balance is low), and Sound Mute/Unmute toggle.

### B. PixiJS Game Stage (`src/components/game/PixiStageCanvas.tsx` + `src/pixi/`)
- Full-width responsive PixiJS v8 canvas (`min-h-[280px]` on mobile, `min-h-[380px]` on desktop) with `TextureStyle.defaultOptions.scaleMode = 'nearest'`.
- **Infinite Parallax `cs_italy` Background (`ItalyParallaxLayer.ts`):**
  - Multi-layer `TilingSprite` backdrop featuring Mediterranean sunset sky, warm cream/ochre plaster buildings, shuttered windows, terracotta roofs, stone walls, and cobblestone lane scrolling smoothly left as the chicken advances.
- **Start Zone & `de_dust` Crate Track (`CrateTrackLayer.ts`):**
  - Dark arched `cs_italy` alley doorway on lane `0` where the chicken spawns.
  - Sequence of pixel-art `de_dust` wooden cargo crates separated by vertical dashed lane markers, each displaying its multiplier (`1.03x`, `1.07x`, `1.12x`, `1.17x`, etc.).
- **CS 1.6 Chicken & AWP FX (`ChickenActor.ts`, `AwpFxLayer.ts`):**
  - Pixel-art CS 1.6 chicken with idle bobbing, parabolic hop arc + wing flap, and eliminated state.
  - On loss: sniper laser flash, screen shake, feather particle burst, scorched crate decal, and `awp_shot` audio.

### C. Bottom Tactical Control Deck (`src/components/controls/BettingPanel.tsx`)
- **Bet Amount:** `MIN` (`$1.00`), numeric input, `MAX` (up to balance or `$500`), and quick chips (`2 $`, `3 $`, `8 $`, `20 $`). Locked during active rounds.
- **Difficulty Selector:** `Easy` (10% hit risk) | `Medium` (20%) | `Hard` (35%) | `Hardcore` (50%) with live risk indicator.
- **Action Controls:**
  - Idle/Finished: Prominent green **`PLAY`** button + quick re-bet/reset icon button.
  - Active Round: Large thumb-friendly **`GO NEXT (1.12x)`** button + **`CASH OUT ($X.XX)`** button.

### D. `sessionStorage` Persistence (`cs16_chicken_road_state_v1`)
Persist `balance`, `betAmount`, `difficulty`, `isMuted`, and `history` (last 15 rounds) in `sessionStorage` via Redux Toolkit, hydrating safely inside `useEffect` to avoid Next.js SSR mismatches.

---

## 3. Sequential Implementation Tasks

- [ ] **Task 1: Project Scaffold, Dependencies & GitHub Actions CI**
  - Initialize Next.js (App Router, TypeScript, Tailwind CSS) if not already initialized.
  - Install `@reduxjs/toolkit`, `react-redux`, and `pixi.js`.
  - Configure pixel fonts (`Press Start 2P` and `VT323`) in `src/app/layout.tsx` and pixel utility styles in `globals.css`.
  - Create `.github/workflows/ci.yml` following `.agents/skills/github-actions-cicd/SKILL.md` to run `npm ci`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` on push/PR.

- [ ] **Task 2: Types, Game Math & Redux Store + `sessionStorage` Sync**
  - Create `src/types/game.ts`.
  - Implement `src/lib/gameMath.ts` (difficulty multiplier curves, step hit RNG, payout calculation).
  - Create `src/store/walletSlice.ts`, `src/store/gameSlice.ts`, `src/store/sessionStorage.ts`, `src/store/index.ts`, and SSR-safe `StoreProvider.tsx`.

- [ ] **Task 3: Procedural Web Audio Sound Engine**
  - Implement `src/lib/audio/soundEngine.ts` following `.agents/skills/cs16-web-audio/SKILL.md` (`ui_click`, `bet_adjust`, `chicken_jump`, `step_safe`, `awp_shot`, `cashout`).

- [ ] **Task 4: PixiJS Procedural Pixel-Art Texture Generators**
  - Following `.agents/skills/cs16-pixijs-renderer/SKILL.md`, implement crisp offscreen-canvas pixel texture generators in `src/pixi/textures/`:
    - `chickenTextures.ts` (CS 1.6 chicken frames)
    - `italyBgTextures.ts` (`cs_italy` sky, buildings, cobblestone layers)
    - `dustCrateTextures.ts` (`de_dust` wooden crate states)

- [ ] **Task 5: PixiJS Scene Entities, Camera Tracking & React Canvas Bridge**
  - Build `ItalyParallaxLayer.ts`, `CrateTrackLayer.ts`, `ChickenActor.ts`, `AwpFxLayer.ts`, and `GameSceneManager.ts` in `src/pixi/`.
  - Create `src/components/game/PixiStageCanvas.tsx` with `ResizeObserver` responsiveness and clean Pixi teardown.

- [ ] **Task 6: Tactical Header, Live Wins Ticker & How-to-Play Modal**
  - Build `Header.tsx`, `LiveWinsTicker.tsx`, and `HowToPlayModal.tsx` in `src/components/layout/`.

- [ ] **Task 7: Responsive Betting & Gameplay Control Deck**
  - Build `BettingPanel.tsx`, `BetInput.tsx`, `DifficultySelector.tsx`, and `ActionButtons.tsx` in `src/components/controls/`, wired to Redux and `soundEngine`.

- [ ] **Task 8: Verification, Build Check & Submission README**
  - Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` locally to confirm the GitHub Actions CI pipeline passes cleanly.
  - Verify mobile (`375x812`) and desktop (`1440x900`) viewports, `sessionStorage` persistence across reloads, and write `README.md` summarizing architecture decisions and build time.