// Core Snake rules: movement, collision detection (walls/self), food
// consumption, and growth. Pure functions operating on game state.

import { GRID_SIZE } from '../config.ts'
import type { Direction, Point } from '../types.ts'
import type { GameState } from './state.ts'

const DIRECTION_DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function getNextHead(snake: Point[], direction: Direction): Point {
  const head = snake[0]!
  const delta = DIRECTION_DELTA[direction]
  return { x: head.x + delta.x, y: head.y + delta.y }
}

export function isWallCollision(point: Point, gridSize: number): boolean {
  return point.x < 0 || point.y < 0 || point.x >= gridSize || point.y >= gridSize
}

export function isSelfCollision(point: Point, snakeBody: Point[]): boolean {
  const bodyWithoutTail = snakeBody.slice(0, -1)
  return bodyWithoutTail.some((segment) => segment.x === point.x && segment.y === point.y)
}

export function spawnFood(snake: Point[], gridSize: number): Point {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`))
  const freeCells = gridSize * gridSize - occupied.size
  if (freeCells <= 0) {
    return { x: -1, y: -1 }
  }

  let food: Point
  do {
    food = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    }
  } while (occupied.has(`${food.x},${food.y}`))

  return food
}

export function step(state: GameState): void {
  if (state.status !== 'running') return

  if (state.pendingDirection !== null) {
    state.direction = state.pendingDirection
    state.pendingDirection = null
  }

  const nextHead = getNextHead(state.snake, state.direction)

  if (isWallCollision(nextHead, GRID_SIZE) || isSelfCollision(nextHead, state.snake)) {
    state.status = 'gameover'
    return
  }

  state.snake.unshift(nextHead)

  if (nextHead.x === state.food.x && nextHead.y === state.food.y) {
    state.score += 1
    state.food = spawnFood(state.snake, GRID_SIZE)
  } else {
    state.snake.pop()
  }
}
