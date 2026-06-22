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

export class GameState {
  snake: Point[]
  direction: Direction
  pendingDirection: Direction | null
  food: Point
  score: number
  status: GameStatus

  constructor() {
    const center = Math.floor(GRID_SIZE / 2)
    this.snake = [
      { x: center, y: center },
      { x: center - 1, y: center },
      { x: center - 2, y: center },
    ]
    this.direction = 'right'
    this.pendingDirection = null
    this.food = { x: center + 5, y: center }
    this.score = 0
    this.status = 'idle'
  }

  setPendingDirection(dir: Direction): void {
    if (dir === OPPOSITE_DIRECTION[this.direction]) return
    this.pendingDirection = dir
  }
}

export function resetGame(state: GameState): void {
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
  state.status = 'running'
}
