// In-memory client-side cache of the top-scores leaderboard — no persistence,
// just enough state for the renderer to show the latest fetch without every
// caller re-issuing a network request.

import type { LeaderboardEntry } from './types.ts'
import { fetchTopScores } from './client.ts'

let cachedEntries: LeaderboardEntry[] = []
let loading = false
let error: string | null = null

export async function refreshTopScores(limit?: number): Promise<void> {
  loading = true
  error = null

  const entries = await fetchTopScores(limit)
  cachedEntries = entries
  loading = false
}

export function getCachedTopScores(): {
  entries: LeaderboardEntry[]
  loading: boolean
  error: string | null
} {
  return { entries: cachedEntries, loading, error }
}
