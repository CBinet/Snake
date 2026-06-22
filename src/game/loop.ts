// Drives the fixed-tick update loop (requestAnimationFrame-based) that
// advances game state on a timer and triggers rendering each frame.

const MAX_CATCH_UP_TICKS = 2

export function createLoop(onTick: () => void, getIntervalMs: () => number, onFrame?: () => void) {
  let rafId: number | null = null
  let lastTimestamp: number | null = null
  let accumulatedMs = 0

  function frame(timestamp: number): void {
    if (lastTimestamp !== null) {
      const intervalMs = getIntervalMs()
      accumulatedMs = Math.min(accumulatedMs + (timestamp - lastTimestamp), intervalMs * MAX_CATCH_UP_TICKS)
      while (accumulatedMs >= intervalMs) {
        onTick()
        accumulatedMs -= intervalMs
      }
    }
    lastTimestamp = timestamp
    onFrame?.()
    rafId = requestAnimationFrame(frame)
  }

  function start(): void {
    if (rafId !== null) return
    lastTimestamp = null
    accumulatedMs = 0
    rafId = requestAnimationFrame(frame)
  }

  function stop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    lastTimestamp = null
    accumulatedMs = 0
  }

  return { start, stop }
}
