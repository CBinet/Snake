// Listens for keyboard events and translates them into Direction changes
// and game control actions (pause/resume/restart).

import { resetGame } from '../game/state.ts'
import type { GameState } from '../game/state.ts'
import type { Direction } from '../types.ts'

const MOVEMENT_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
}

export function attachKeyboardControls(state: GameState, onStatusChange?: () => void): void {
  window.addEventListener('keydown', (event) => {
    const direction = MOVEMENT_KEYS[event.key]
    if (direction !== undefined) {
      event.preventDefault()
      if (state.status === 'running') {
        state.setPendingDirection(direction)
      }
      return
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      if (state.status === 'idle') {
        state.status = 'running'
        onStatusChange?.()
      } else if (state.status === 'gameover') {
        resetGame(state)
        onStatusChange?.()
      }
      return
    }

    if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      if (state.status === 'running') {
        state.status = 'paused'
        onStatusChange?.()
      } else if (state.status === 'paused') {
        state.status = 'running'
        onStatusChange?.()
      }
    }
  })
}
