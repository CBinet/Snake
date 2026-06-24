// All SQL against leaderboard_entries lives here — no other module should
// construct queries against this table.

import { db } from './db.ts'

export type LeaderboardEntry = {
  handle: string
  score: number
  durationMs: number
  createdAt: string
}

export function insertScore(handle: string, score: number, durationMs: number): void {
  db.prepare(
    `INSERT INTO leaderboard_entries (handle, score, duration_ms) VALUES (?, ?, ?)`,
  ).run(handle, score, durationMs)
}

export function getTopScores(limit: number): LeaderboardEntry[] {
  const rows = db
    .prepare(
      `SELECT handle, score, duration_ms AS durationMs, created_at AS createdAt
       FROM leaderboard_entries
       ORDER BY score DESC
       LIMIT ?`,
    )
    .all(limit) as LeaderboardEntry[]
  return rows
}
