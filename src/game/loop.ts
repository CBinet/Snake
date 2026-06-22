// Drives the fixed-tick update loop (requestAnimationFrame-based) that
// advances game state on a timer and triggers rendering each frame.

export function createLoop(onTick: () => void, getIntervalMs: () => number) {
  let rafId: number | null = null
  let lastTimestamp: number | null = null
  let accumulatedMs = 0

  function frame(timestamp: number): void {
    if (lastTimestamp !== null) {
      accumulatedMs += timestamp - lastTimestamp
      const intervalMs = getIntervalMs()
      while (accumulatedMs >= intervalMs) {
        onTick()
        accumulatedMs -= intervalMs
      }
    }
    lastTimestamp = timestamp
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
