// Holds and mutates the authoritative game state: snake body, food position,
// score, and current GameStatus. Will expose creation/reset helpers used by
// the game loop and renderer.

import { GRID_SIZE } from '../config.ts'
import type { Direction, GameStatus, Point } from '../types.ts'

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

function initState(state: GameState, status: GameStatus): void {
  const center = Math.floor(GRID_SIZE / 2)
  state.snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ]
  state.direction = 'right'
  state.pendingDirection = null
  state.food = { x: center + 5, y: center }
  state.score = 0
  state.status = status
}

export class GameState {
  snake: Point[] = []
  direction: Direction = 'right'
  pendingDirection: Direction | null = null
  food: Point = { x: 0, y: 0 }
  score = 0
  status: GameStatus = 'idle'

  constructor() {
    initState(this, 'idle')
  }

  setPendingDirection(dir: Direction): void {
    if (dir === OPPOSITE_DIRECTION[this.pendingDirection ?? this.direction]) return
    this.pendingDirection = dir
  }
}

export function resetGame(state: GameState): void {
  initState(state, 'running')
}
