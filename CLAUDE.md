# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A browser-based Snake game built with Vite + TypeScript, rendered to a `<canvas>` with the 2D context. No frameworks, no test runner, no linter configured — just `vite` and `typescript` as dependencies.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check with `tsc` (noEmit) then build via `vite build`
- `npm run preview` — preview the production build locally

There are no test or lint scripts in this project.

## Verifying changes

Do not start the dev server, open a browser, or write/run Playwright (or any other browser-automation) scripts to verify UI or frontend changes. Verify with type-checking (`npm run build`) and code review only, then report the task as complete. This overrides the default guidance to test UI changes in a browser before reporting completion.

## Architecture

Entry point is `index.html` → `src/main.ts`, which sizes the canvas (`GRID_SIZE * CELL_SIZE`), grabs the 2D context, wires `createLoop`'s `onTick`/`onFrame` to `step`/`draw`, and calls `attachKeyboardControls(state, draw)` — passing `draw` as the `onStatusChange` callback so a key that changes `GameStatus` (start/restart/pause/resume) repaints immediately instead of waiting for the next animation frame. Constants (grid size, cell size, color palette) live in `src/config.ts`; shared types (`Point`, `Direction`, `GameStatus`) live in `src/types.ts`.

The module layout (all modules are fully implemented across 6 completed milestones):

- `src/game/state.ts` — the `GameState` class (snake body, food position, score, `GameStatus`, pending direction) plus the `resetGame` free function; both initial construction and reset share a single `initState` helper so the two paths can't drift apart. `setPendingDirection` guards against 180° neck reversal by checking the already-queued `pendingDirection` (falling back to the committed `direction`).
- `src/game/logic.ts` — pure functions for movement (`getNextHead`), collision detection (`isWallCollision`, `isSelfCollision`), food spawning (`spawnFood`), and the `step` function that advances state by one tick.
- `src/game/difficulty.ts` — `getTickIntervalMs` scales tick speed down (faster gameplay) as score increases, clamped to a minimum interval.
- `src/game/loop.ts` — `createLoop` drives a fixed-tick update loop (requestAnimationFrame-based) with accumulator-based catch-up (clamped to bound worst-case stutter after a long throttle/background period), calling `onTick` on each tick and `onFrame` every animation frame.
- `src/input/keyboard.ts` — `attachKeyboardControls` translates keydown events into `Direction` changes and pause/resume/restart/start transitions, invoking an optional `onStatusChange` callback so the caller can force an immediate redraw on status transitions.
- `src/render/renderer.ts` — `render` draws the grid, snake, and food onto the canvas each frame from game state.
- `src/render/overlay.ts` — `renderOverlay` draws UI overlays (score readout, idle/paused/game-over messaging) on top of the canvas.
- `src/storage/highscore.ts` — `getHighScore`/`setHighScoreIfBeaten` persist and retrieve the high score via `localStorage`, with validation against malformed/non-integer stored values.

Follow the existing division of responsibility when modifying these files rather than merging concerns across them (e.g. keep collision/movement logic out of the renderer, keep canvas drawing out of `state.ts`).
