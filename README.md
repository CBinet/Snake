# Snake

A classic Snake game that runs in the browser, rendered with a retro pixel-grid look on an HTML `<canvas>`. Built with Vite and TypeScript — no UI framework, no game engine, just the 2D canvas API.

## Features

- Classic Snake rules: grid-based movement, wall and self-collision detection, and growth on eating food.
- Difficulty ramp: the snake speeds up as your score increases (tick interval shrinks from 150ms down to a 65ms floor).
- Persistent high score, saved to `localStorage` and shown alongside the current score.
- Pause and restart without reloading the page.

## Controls

- **Arrow keys** or **WASD** — change direction
- **Space** or **Enter** — start the game (from the idle screen) or restart after game over
- **P** or **Escape** — pause / resume

## Getting started

Requires [Node.js](https://nodejs.org/) (works with the version supported by Vite 8 / Node 20+).

```bash
npm install
npm run dev
```

This starts the Vite dev server with hot reload. Open the printed local URL in a browser.

Other scripts:

```bash
npm run build    # type-check with tsc, then build to dist/
npm run preview  # serve the production build from dist/ locally
```

## Project structure

```
index.html              entry HTML, hosts the #game-canvas element
src/
  main.ts                wires everything together: sizes the canvas, creates GameState,
                          starts the tick/render loop, attaches keyboard controls
  config.ts               grid size, cell size, color palette
  types.ts                shared types: Point, Direction, GameStatus
  game/
    state.ts               GameState class (snake body, direction, food, score, status)
                            plus resetGame() for restarting a run
    logic.ts                pure functions: movement, wall/self collision, food spawning,
                            and the step() function that advances state by one tick
    difficulty.ts           getTickIntervalMs(score) — maps score to tick speed
    loop.ts                 createLoop(): fixed-tick update loop driven by
                            requestAnimationFrame, decoupling simulation speed from
                            frame rate
  input/
    keyboard.ts              keydown handling: movement keys, start/restart, pause/resume
  render/
    renderer.ts              draws the grid, snake, and food onto the canvas each frame
    overlay.ts                draws the score readout and idle/paused/game-over messages
  storage/
    highscore.ts              get/set the high score in localStorage, with safe fallbacks
                            if storage is unavailable
```

## Deployment

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the project with Vite and deploys it to GitHub Pages on every push to `master`.

To use it for your own fork/copy:

1. Push the repository to GitHub as a repo named **Snake**. The Vite `base` path is hardcoded to `/Snake/` in `vite.config.ts`, so the repo name must match (or you'll need to update that path).
2. In the repo's Settings → Pages, set the source to **GitHub Actions**.
3. Push to `master` — the workflow builds the site and publishes `dist/` to Pages automatically.
