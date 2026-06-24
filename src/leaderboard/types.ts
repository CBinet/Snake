// Mirrors server/leaderboard-store.ts's LeaderboardEntry shape.

export type LeaderboardEntry = {
  handle: string
  score: number
  durationMs: number
  createdAt: string
}
