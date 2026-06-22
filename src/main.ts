import './style.css'
import { GRID_SIZE, CELL_SIZE, COLORS } from './config.ts'
import { GameState } from './game/state.ts'
import { step } from './game/logic.ts'
import { createLoop } from './game/loop.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!
canvas.width = GRID_SIZE * CELL_SIZE
canvas.height = GRID_SIZE * CELL_SIZE

const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false

ctx.fillStyle = COLORS.background
ctx.fillRect(0, 0, canvas.width, canvas.height)

const state = new GameState()
state.status = 'running'

const TICK_INTERVAL_MS = 150

const loop = createLoop(
  () => {
    step(state)
    console.log('head:', state.snake[0], 'score:', state.score, 'length:', state.snake.length, 'status:', state.status)
    if (state.status === 'gameover') {
      loop.stop()
    }
  },
  () => TICK_INTERVAL_MS,
)

loop.start()
