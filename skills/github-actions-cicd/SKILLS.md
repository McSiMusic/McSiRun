---
name: github-actions-cicd
description: GitHub Actions CI/CD workflow setup for Next.js + TypeScript + PixiJS validation (lint, typecheck, production build).
---

# GitHub Actions CI/CD Skill

## Workflow Requirements (`.github/workflows/ci.yml`)
- Trigger on `push` to `main` / `master` and on all `pull_request` events.
- Use `actions/checkout@v4` and `actions/setup-node@v4` with Node.js `20` and `npm` dependency caching.
- Run sequential verification steps:
  1. `npm ci`
  2. `npm run lint`
  3. `npx tsc --noEmit`
  4. `npm run build`
- Ensure `next.config.ts` / `next.config.mjs` supports clean production builds without SSR `window`/`document`/`canvas` crashes (guard all PixiJS and `AudioContext` references behind client-side lifecycle hooks).