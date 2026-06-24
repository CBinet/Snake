import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { migrate } from './db.ts'
import { leaderboardRouter } from './routes/leaderboard.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLIENT_BASE = '/Snake'
const CLIENT_DIST = join(__dirname, '..', 'dist')

const PORT = process.env.PORT ?? 3001

migrate()

const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/leaderboard', leaderboardRouter)

if (process.env.NODE_ENV === 'production') {
  app.use(CLIENT_BASE, express.static(CLIENT_DIST))
  app.get(`${CLIENT_BASE}/*splat`, (_req, res) => {
    res.sendFile(join(CLIENT_DIST, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
