// Persists and retrieves the high score from localStorage between sessions.

const HIGH_SCORE_KEY = 'snake.highscore.v1'

export function getHighScore(): number {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY)
    if (raw === null) return 0
    const parsed = Number(raw)
    return Number.isInteger(parsed) && Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

export function setHighScoreIfBeaten(score: number): number {
  const currentHighScore = getHighScore()
  if (score <= currentHighScore) return currentHighScore

  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score))
  } catch {
    // Storage unavailable (e.g. disabled in privacy mode) — fail silently.
  }
  return score
}
