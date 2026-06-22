import './style.css'
import { GRID_SIZE, CELL_SIZE } from './config.ts'
import { GameState } from './game/state.ts'
import { step } from './game/logic.ts'
import { getTickIntervalMs } from './game/difficulty.ts'
import { createLoop } from './game/loop.ts'
import { render } from './render/renderer.ts'
import { renderOverlay } from './render/overlay.ts'
import { attachKeyboardControls } from './input/keyboard.ts'
import { getHighScore, setHighScoreIfBeaten } from './storage/highscore.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!
canvas.width = GRID_SIZE * CELL_SIZE
canvas.height = GRID_SIZE * CELL_SIZE

const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false

const state = new GameState()

let highScore = getHighScore()
let previousStatus = state.status

function draw(): void {
  render(ctx, state)
  renderOverlay(ctx, state, highScore)
}

function tick(): void {
  step(state)
  if (previousStatus !== 'gameover' && state.status === 'gameover') {
    highScore = setHighScoreIfBeaten(state.score)
  }
  previousStatus = state.status
}

const loop = createLoop(
  tick,
  () => getTickIntervalMs(state.score),
  draw,
)

attachKeyboardControls(state, draw)

draw()
loop.start()
