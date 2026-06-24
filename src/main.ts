import './style.css'
import { GRID_SIZE, CELL_SIZE } from './config.ts'
import { GameState } from './game/state.ts'
import { step } from './game/logic.ts'
import { getTickIntervalMs } from './game/difficulty.ts'
import { createLoop } from './game/loop.ts'
import { render } from './render/renderer.ts'
import { renderOverlay } from './render/overlay.ts'
import { renderLeaderboardPanel } from './render/leaderboard-panel.ts'
import { attachKeyboardControls } from './input/keyboard.ts'
import { showNamePromptIfQualifying } from './input/name-prompt.ts'
import { getHighScore, setHighScoreIfBeaten } from './storage/highscore.ts'
import { refreshTopScores, getCachedTopScores } from './leaderboard/leaderboard-store.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!
canvas.width = GRID_SIZE * CELL_SIZE
canvas.height = GRID_SIZE * CELL_SIZE

const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false

const state = new GameState()

let highScore = getHighScore()
let previousStatus = state.status
let runStartedAt = Date.now()

function draw(): void {
  render(ctx, state)
  renderOverlay(ctx, state, highScore)
  if (state.status === 'idle' || state.status === 'gameover') {
    renderLeaderboardPanel(ctx, getCachedTopScores().entries)
  }
}

function onStatusChange(): void {
  const enteredRunning = previousStatus !== 'running' && state.status === 'running'
  const enteredGameover = previousStatus !== 'gameover' && state.status === 'gameover'
  const enteredIdleOrGameover =
    previousStatus !== 'idle' && previousStatus !== 'gameover' &&
    (state.status === 'idle' || state.status === 'gameover')

  if (enteredRunning) {
    runStartedAt = Date.now()
  }

  if (enteredGameover) {
    highScore = setHighScoreIfBeaten(state.score)
    showNamePromptIfQualifying(state.score, Date.now() - runStartedAt, () => {
      void refreshTopScores()
    })
  }

  if (enteredIdleOrGameover) {
    void refreshTopScores()
  }

  previousStatus = state.status
  draw()
}

function tick(): void {
  step(state)
  if (state.status !== previousStatus) {
    onStatusChange()
  }
}

const loop = createLoop(
  tick,
  () => getTickIntervalMs(state.score),
  draw,
)

attachKeyboardControls(state, onStatusChange)

void refreshTopScores()
draw()
loop.start()
