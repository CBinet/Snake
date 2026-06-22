// Draws the grid, snake, and food onto the canvas 2D context each frame
// based on the current game state.

import { GRID_SIZE, CELL_SIZE, COLORS } from '../config.ts'
import type { GameState } from '../game/state.ts'

const SEGMENT_INSET = 2

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = COLORS.gridLine
  ctx.lineWidth = 1

  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * CELL_SIZE + 0.5
    ctx.beginPath()
    ctx.moveTo(pos, 0)
    ctx.lineTo(pos, GRID_SIZE * CELL_SIZE)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, pos)
    ctx.lineTo(GRID_SIZE * CELL_SIZE, pos)
    ctx.stroke()
  }
}

function drawSnake(ctx: CanvasRenderingContext2D, snake: GameState['snake']): void {
  snake.forEach((segment, index) => {
    const x = segment.x * CELL_SIZE
    const y = segment.y * CELL_SIZE

    ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snakeBody
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)

    ctx.strokeStyle = COLORS.snakeBorder
    ctx.lineWidth = SEGMENT_INSET
    ctx.strokeRect(
      x + SEGMENT_INSET / 2,
      y + SEGMENT_INSET / 2,
      CELL_SIZE - SEGMENT_INSET,
      CELL_SIZE - SEGMENT_INSET,
    )
  })
}

function drawFood(ctx: CanvasRenderingContext2D, food: GameState['food']): void {
  const padding = 4
  ctx.fillStyle = COLORS.food
  ctx.fillRect(
    food.x * CELL_SIZE + padding,
    food.y * CELL_SIZE + padding,
    CELL_SIZE - padding * 2,
    CELL_SIZE - padding * 2,
  )
}

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  const canvasSize = GRID_SIZE * CELL_SIZE

  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  drawGrid(ctx)
  drawFood(ctx, state.food)
  drawSnake(ctx, state.snake)
}
