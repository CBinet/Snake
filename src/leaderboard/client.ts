// The only module that calls fetch() for leaderboard purposes — keeps the
// network boundary in one place so the rest of the client stays test/UI-only.

import type { LeaderboardEntry } from './types.ts'

export async function fetchTopScores(limit?: number): Promise<LeaderboardEntry[]> {
  try {
    const query = limit !== undefined ? `?limit=${limit}` : ''
    const response = await fetch(`/api/leaderboard/top${query}`)
    if (!response.ok) return []
    return (await response.json()) as LeaderboardEntry[]
  } catch {
    return []
  }
}

export async function submitScore(
  handle: string,
  score: number,
  durationMs: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch('/api/leaderboard/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, score, durationMs }),
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      return { ok: false, error: body?.error ?? 'request failed' }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'network error' }
  }
}
