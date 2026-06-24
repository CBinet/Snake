// HTTP boundary only — no SQL, no validation logic. Delegates to
// leaderboard-store.ts and validation.ts and translates results to responses.

import { Router } from 'express'
import { getTopScores, insertScore } from '../leaderboard-store.ts'
import { isHandleAllowed, isPlausibleScore } from '../validation.ts'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100

export const leaderboardRouter = Router()

leaderboardRouter.get('/top', (req, res) => {
  const rawLimit = req.query.limit
  const parsedLimit = typeof rawLimit === 'string' ? Number(rawLimit) : NaN
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT

  res.json(getTopScores(limit))
})

leaderboardRouter.post('/submit', (req, res) => {
  const { handle, score, durationMs } = req.body ?? {}

  if (typeof handle !== 'string' || typeof score !== 'number' || typeof durationMs !== 'number') {
    res.status(400).json({ error: 'invalid request body' })
    return
  }

  if (!isHandleAllowed(handle)) {
    res.status(400).json({ error: 'invalid handle' })
    return
  }

  if (!isPlausibleScore(score, durationMs)) {
    res.status(400).json({ error: 'implausible score' })
    return
  }

  insertScore(handle, score, durationMs)
  res.status(201).json({ handle, score, durationMs })
})
