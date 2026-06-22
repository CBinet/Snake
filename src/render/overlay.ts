// Renders UI overlays (score, idle/paused/game-over messaging) on top of
// the game canvas.

import { GRID_SIZE, CELL_SIZE, COLORS } from '../config.ts'
import type { GameState } from '../game/state.ts'

const MONOSPACE_FONT = 'ui-monospace, "Cascadia Code", "Courier New", monospace'

function drawScoreReadout(ctx: CanvasRenderingContext2D, score: number, highScore: number): void {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = `14px ${MONOSPACE_FONT}`

  ctx.fillStyle = COLORS.textPrimary
  ctx.fillText(`SCORE ${score}`, 8, 8)

  ctx.fillStyle = COLORS.textSecondary
  ctx.fillText(`HIGH ${highScore}`, 8, 26)
}

function drawCenteredBackdrop(ctx: CanvasRenderingContext2D, canvasSize: number, height: number): void {
  ctx.fillStyle = COLORS.overlayBackdrop
  ctx.fillRect(0, (canvasSize - height) / 2, canvasSize, height)
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  lines: { text: string; font: string; color: string }[],
  lineHeight: number,
): void {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const totalHeight = lines.length * lineHeight
  drawCenteredBackdrop(ctx, canvasSize, totalHeight + lineHeight)

  const startY = canvasSize / 2 - totalHeight / 2 + lineHeight / 2
  lines.forEach((line, index) => {
    ctx.font = line.font
    ctx.fillStyle = line.color
    ctx.fillText(line.text, canvasSize / 2, startY + index * lineHeight)
  })
}

export function renderOverlay(ctx: CanvasRenderingContext2D, state: GameState, highScore: number): void {
  const canvasSize = GRID_SIZE * CELL_SIZE

  drawScoreReadout(ctx, state.score, highScore)

  if (state.status === 'idle') {
    drawCenteredLines(ctx, canvasSize, [
      { text: 'SNAKE', font: `bold 36px ${MONOSPACE_FONT}`, color: COLORS.textPrimary },
      { text: 'PRESS SPACE TO START', font: `16px ${MONOSPACE_FONT}`, color: COLORS.textSecondary },
    ], 40)
  } else if (state.status === 'paused') {
    drawCenteredLines(ctx, canvasSize, [
      { text: 'PAUSED', font: `bold 32px ${MONOSPACE_FONT}`, color: COLORS.textPrimary },
    ], 40)
  } else if (state.status === 'gameover') {
    drawCenteredLines(ctx, canvasSize, [
      { text: 'GAME OVER', font: `bold 32px ${MONOSPACE_FONT}`, color: COLORS.food },
      { text: `SCORE ${state.score}`, font: `18px ${MONOSPACE_FONT}`, color: COLORS.textPrimary },
      { text: 'PRESS SPACE TO RESTART', font: `16px ${MONOSPACE_FONT}`, color: COLORS.textSecondary },
    ], 36)
  }
}
