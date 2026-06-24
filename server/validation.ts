// Pure validation helpers for leaderboard submissions. No DB access, no
// Express dependency — safe to unit-test in isolation.

const MIN_HANDLE_LENGTH = 3
const MAX_HANDLE_LENGTH = 10
const HANDLE_PATTERN = /^[A-Za-z0-9 ]+$/

// Baseline filter only, not exhaustive — catches the obvious cases.
const BLOCKED_HANDLES = ['fuck', 'shit', 'nigger', 'cunt', 'retard']

export function isHandleAllowed(handle: string): boolean {
  if (handle.length < MIN_HANDLE_LENGTH || handle.length > MAX_HANDLE_LENGTH) return false
  if (!HANDLE_PATTERN.test(handle)) return false

  const normalized = handle.toLowerCase()
  return !BLOCKED_HANDLES.some((blocked) => normalized.includes(blocked))
}

// Fastest possible scoring rate is one point (one food pickup, see
// src/game/logic.ts step()) per minimum tick interval (MIN_INTERVAL_MS in
// src/game/difficulty.ts, currently 65ms). A 1.5x safety margin absorbs
// timing slop between client and server clocks without letting wildly
// inflated scores through. This only stops naive tampering (e.g. a
// hand-edited request body claiming an enormous score) — a scripted/bot
// client that actually plays the game end-to-end would still pass.
const MIN_TICK_INTERVAL_MS = 65
const SAFETY_MARGIN = 1.5
const MAX_POINTS_PER_MS = SAFETY_MARGIN / MIN_TICK_INTERVAL_MS

export function isPlausibleScore(score: number, durationMs: number): boolean {
  if (!Number.isInteger(score) || score < 0) return false
  if (!Number.isInteger(durationMs) || durationMs <= 0) return false

  return score / durationMs <= MAX_POINTS_PER_MS
}
