import './style.css'
import { GRID_SIZE, CELL_SIZE } from './config.ts'
import { GameState } from './game/state.ts'
import { step } from './game/logic.ts'
import { createLoop } from './game/loop.ts'
import { render } from './render/renderer.ts'
import { renderOverlay } from './render/overlay.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!
canvas.width = GRID_SIZE * CELL_SIZE
canvas.height = GRID_SIZE * CELL_SIZE

const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false

const state = new GameState()
// TEMPORARY: input wiring doesn't exist yet (next milestone), so force
// 'running' here to visually verify rendering. Remove this line once
// src/input/keyboard.ts drives status transitions from idle -> running.
state.status = 'running'

const TICK_INTERVAL_MS = 150

function draw(): void {
  render(ctx, state)
  renderOverlay(ctx, state, 0)
}

const loop = createLoop(
  () => {
    step(state)
    if (state.status === 'gameover') {
      loop.stop()
    }
    draw()
  },
  () => TICK_INTERVAL_MS,
)

draw()
loop.start()
