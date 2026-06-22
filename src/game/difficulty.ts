// Determines tick speed/difficulty scaling as the snake grows or score
// increases over the course of a run.

const START_INTERVAL_MS = 150
const MS_DECREASE_PER_POINT = 4
const MIN_INTERVAL_MS = 65

export function getTickIntervalMs(score: number): number {
  return Math.max(MIN_INTERVAL_MS, START_INTERVAL_MS - score * MS_DECREASE_PER_POINT)
}
