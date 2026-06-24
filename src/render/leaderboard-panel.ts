// Draws the top-scores leaderboard panel onto the canvas — rank, handle,
// score — styled to match src/render/overlay.ts. Only meant to be called
// when state.status is 'idle' or 'gameover' (caller decides that).

import { GRID_SIZE, CELL_SIZE, COLORS } from '../config.ts'
import type { LeaderboardEntry } from '../leaderboard/types.ts'

const MONOSPACE_FONT = 'ui-monospace, "Cascadia Code", "Courier New", monospace'
const PANEL_TOP = 36
const ROW_HEIGHT = 16
const PANEL_RIGHT_MARGIN = 8

export function renderLeaderboardPanel(ctx: CanvasRenderingContext2D, entries: LeaderboardEntry[]): void {
  if (entries.length === 0) return

  const canvasSize = GRID_SIZE * CELL_SIZE
  const rightEdge = canvasSize - PANEL_RIGHT_MARGIN

  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.font = `12px ${MONOSPACE_FONT}`

  entries.forEach((entry, index) => {
    const y = PANEL_TOP + index * ROW_HEIGHT
    ctx.fillStyle = index === 0 ? COLORS.textPrimary : COLORS.textSecondary
    ctx.fillText(`${index + 1}. ${entry.handle} ${entry.score}`, rightEdge, y)
  })
}
