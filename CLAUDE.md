# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A browser-based Snake game built with Vite + TypeScript, rendered to a `<canvas>` with the 2D context. No frameworks, no test runner, no linter configured — just `vite` and `typescript` as dependencies.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check with `tsc` (noEmit) then build via `vite build`
- `npm run preview` — preview the production build locally

There are no test or lint scripts in this project.

## Architecture

Entry point is `index.html` → `src/main.ts`, which sizes the canvas (`GRID_SIZE * CELL_SIZE`) and grabs the 2D context. Constants (grid size, cell size, color palette) live in `src/config.ts`; shared types (`Point`, `Direction`, `GameStatus`) live in `src/types.ts`.

The intended module layout (most are currently stub files containing only a planning comment, with no implementation yet — check each file's actual contents before assuming behavior exists):

- `src/game/state.ts` — authoritative game state (snake body, food position, score, `GameStatus`) plus creation/reset helpers.
- `src/game/logic.ts` — pure functions for movement, collision detection (walls/self), food consumption, and growth.
- `src/game/difficulty.ts` — tick speed/difficulty scaling as score/length increases.
- `src/game/loop.ts` — fixed-tick update loop (requestAnimationFrame-based) that advances state and triggers rendering.
- `src/input/keyboard.ts` — keyboard event handling → `Direction` changes and pause/resume/restart controls.
- `src/render/renderer.ts` — draws grid, snake, and food onto the canvas each frame from game state.
- `src/render/overlay.ts` — UI overlays (score, idle/paused/game-over messaging) on top of the canvas.
- `src/storage/highscore.ts` — persists/retrieves high score via `localStorage`.

When implementing one of these stubs, follow the division of responsibility implied by its existing header comment rather than merging concerns across files (e.g. keep collision/movement logic out of the renderer, keep canvas drawing out of `state.ts`).
