# Global Leaderboard — Progress & Remaining Work

Status as of 2026-06-22. This file lets another agent/session resume the feature without re-deriving context. Update or delete this file once the feature is fully shipped and documented.

## Done (milestones 1-5, verified working)

**Note:** `server/` is currently untracked in git — nothing from this feature has been committed yet. Confirm with the user whether/when to commit.

### Milestone 1 — server scaffold + schema
- `server/db.ts` — opens `server/data/leaderboard.db` via `better-sqlite3` (creates `data/` dir if absent). Exports `db` (raw Database handle) and `migrate()` (creates `leaderboard_entries` table if missing: `id` PK autoincrement, `handle` text not null, `score` integer not null, `duration_ms` integer not null, `created_at` text not null default current timestamp).
- `server/index.ts` — Express app, `express.json()` body parsing, `GET /api/health` → `{ ok: true }`, calls `migrate()` before `app.listen(process.env.PORT ?? 3001)`.
- `tsconfig.server.json` — Node-targeted (`module`/`moduleResolution: "nodenext"`, `lib: ["ES2023"]`, no DOM), `include: ["server"]` only — doesn't affect the client `tsconfig.json` (`include: ["src"]`).
- `package.json` — added deps `express`, `better-sqlite3`; devDeps `@types/express`, `@types/better-sqlite3`, `@types/node`, `tsx`; script `"server": "tsx server/index.ts"`.
- `vite.config.ts` — added `server.proxy` forwarding `/api` → `http://localhost:3001` for dev.
- `.gitignore` — added `server/data/` (don't commit the SQLite file).

### Milestone 2 — store + validation (pure logic, no HTTP)
- `server/leaderboard-store.ts` — exports `LeaderboardEntry` type (`{ handle, score, durationMs, createdAt }`), `insertScore(handle: string, score: number, durationMs: number): void`, `getTopScores(limit: number): LeaderboardEntry[]` (ordered by `score DESC`, SQL aliases `duration_ms`/`created_at` to camelCase). **All SQL against `leaderboard_entries` lives only in this file.**
- `server/validation.ts` — exports `isHandleAllowed(handle: string): boolean` (length 3-10, pattern `/^[A-Za-z0-9 ]+$/`, lowercase blocklist substring check) and `isPlausibleScore(score: number, durationMs: number): boolean`. Bound derivation: `MIN_TICK_INTERVAL_MS = 65` (from `src/game/difficulty.ts`'s `MIN_INTERVAL_MS`), 1 point per food pickup (from `src/game/logic.ts` `step()`), `SAFETY_MARGIN = 1.5` → `MAX_POINTS_PER_MS = 1.5 / 65`. Comment in file notes this stops naive tampering only, not a scripted/bot client.

### Milestone 3 — routes
- `server/routes/leaderboard.ts` — Express `Router`, no SQL/validation logic itself:
  - `GET /top` — optional `?limit=` (positive integer, else default `10`, clamped to max `100`), calls `getTopScores`, returns JSON array.
  - `POST /submit` — body `{ handle, score, durationMs }`. Type-checks all three (else `400 { error: "invalid request body" }`), then `isHandleAllowed` (else `400 { error: "invalid handle" }`), then `isPlausibleScore` (else `400 { error: "implausible score" }`). On success: `insertScore` + `201 { handle, score, durationMs }`.
- Wired into `server/index.ts` via `app.use('/api/leaderboard', leaderboardRouter)` → full paths `GET /api/leaderboard/top`, `POST /api/leaderboard/submit`.
- Manually verified via curl: empty-DB `GET /top` → `[]`; valid `POST /submit` → `201` + entry visible in next `GET /top`; implausible score → `400`; blocklisted handle → `400`; missing fields → `400`; `?limit=` clamping/fallback works.

### Milestone 4 — client network layer (done, verified working)
- `src/leaderboard/types.ts` — `LeaderboardEntry` type matching the server shape (`{ handle, score, durationMs, createdAt }`).
- `src/leaderboard/client.ts` — `fetchTopScores(limit?)` (GET `/api/leaderboard/top`, returns `[]` on any network failure/non-2xx) and `submitScore(handle, score, durationMs)` (POST `/api/leaderboard/submit`, returns `{ ok: true }` or `{ ok: false, error }`, surfacing the server's `error` field on 400s). The only file in the client that calls `fetch()` for leaderboard purposes.
- `src/leaderboard/leaderboard-store.ts` — in-memory cache of last-fetched entries/loading/error; `refreshTopScores(limit?)` and `getCachedTopScores()`.
- Verified live: `npm run server` + `npm run dev` running side by side, confirmed `GET /api/leaderboard/top` and `POST /api/leaderboard/submit` round-trip correctly via curl (submitted a test `verify`/score 5 entry, saw it come back in `top`). `tsc --noEmit` clean for both client and server configs; `npm run build` succeeds.

## Remaining open decisions (confirm before/while building 5-6)

1. **Hosting/datastore** — current build assumes a single always-on host with persistent disk (SQLite). If targeting serverless/edge hosting instead, the datastore needs to become Postgres before milestone 6 (production wiring) — would require revisiting `server/db.ts` and `leaderboard-store.ts`.
2. **Identity model** — anonymous handle, no accounts (accepted tradeoff: handles aren't protected from impersonation).
3. **Anti-cheat rigor** — cheap plausibility check only (already built in milestone 2). Does not stop a scripted/bot client playing a real game end-to-end.
4. **Name moderation** — minimal hardcoded blocklist only (already built), no moderation queue/admin tooling.

## Remaining milestones

### Milestone 5 — rendering + submission UI (done, verified working)
- `src/render/leaderboard-panel.ts` — `renderLeaderboardPanel(ctx, entries)` draws a right-aligned ranked list (rank, handle, score) top-right, below the "TOP SCORES" label. No-ops on empty entries.
- `src/input/name-prompt.ts` — `showNamePromptIfQualifying(score, durationMs, onSubmit)` builds an absolutely-positioned DOM form (text input max 10 chars, submit button) centered under the canvas. Submission-trigger rule: always shows on every game over (server is the real gatekeeper). On submit calls `submitScore`; on success removes the form, calls `onSubmit(handle)`, triggers `refreshTopScores()`; on failure shows the server's error inline and leaves the form open for retry.
- `src/render/overlay.ts` — added `drawTopScoresLabel` (drawn-text only, no state/fetch logic).
- `src/main.ts` — added `runStartedAt` tracking and a unified `onStatusChange` handler that calls `refreshTopScores()` on idle/gameover entry, calls `showNamePromptIfQualifying` at the gameover transition (alongside `setHighScoreIfBeaten`), and calls `draw()` (which now also renders the leaderboard panel on idle/gameover).
- **Bug found and fixed during browser verification:** the name-prompt form's vertical offset (`rect.height / 2 + 40`) overlapped the gameover overlay's "PRESS SPACE TO RESTART" line — the 3-line gameover backdrop (`drawCenteredLines` in `src/render/overlay.ts`) actually extends to `canvasSize/2 + 72`. Fixed by changing the offset to `+ 84` in `src/input/name-prompt.ts`, with a comment recording the backdrop math so the two don't drift apart again.
- Verified live via a headless-Chromium Playwright script (dev + server running side by side): idle panel renders with no overlap; game-over triggers the form; valid submission (`verify`/score 5, `verify2`/score 0) added entries and refreshed the panel; a too-short handle (`ab`) got a `400` with `invalid handle` rendered inline, form stayed open; zero console/page errors throughout. Screenshots confirmed the layout fix.

Prompt for `feature-builder` (historical — already executed above):

```
You are working in the Snake game project at C:\Users\Gaming PC\Desktop\Snake (git repo, clean tree).

Milestones 1-4 are built: the full server-side leaderboard API, plus src/leaderboard/types.ts,
client.ts, and leaderboard-store.ts on the client (fetchTopScores, submitScore,
refreshTopScores/getCachedTopScores). Read CLAUDE.md, src/render/renderer.ts,
src/render/overlay.ts, src/main.ts, and src/input/keyboard.ts fully before starting — this
milestone touches the most existing files of any milestone so far and must respect the current
division of responsibility exactly (canvas drawing only in render/, no game logic in renderer
files, etc).

Build Milestone 5: visible leaderboard panel + score submission UI.

Create src/render/leaderboard-panel.ts exporting a renderLeaderboardPanel(ctx, entries:
LeaderboardEntry[]) function that draws a ranked list (rank, handle, score) onto the canvas,
styled consistently with src/render/overlay.ts (same font/COLORS palette from src/config.ts).
Only drawn when state.status is 'idle' or 'gameover'; position it so it doesn't overlap the
existing centered overlay text.

Create src/input/name-prompt.ts exporting something like showNamePromptIfQualifying(score:
number, durationMs: number, onSubmit: (handle: string) => void): void that creates a minimal
absolutely-positioned DOM form (text input, max 10 chars, submit button) layered over the
canvas — the one place plain DOM is justified instead of canvas, since canvas has no native
text input. Pick whichever submission-trigger rule is simplest (e.g. always show on game over)
and note your choice. On submit: call submitScore from src/leaderboard/client.ts, remove the DOM
form, trigger refreshTopScores().

Wire into src/main.ts: call refreshTopScores() on idle/gameover entry; call
renderLeaderboardPanel from the existing draw(); call showNamePromptIfQualifying at the gameover
status transition (same point that currently calls setHighScoreIfBeaten).

Minor addition to src/render/overlay.ts: a small "TOP SCORES" label near the panel — drawn text
only, no fetching/state logic added to this file.

Follow the project's existing conventions exactly: explicit .ts extensions, import type for
type-only imports, sparse why-only comments, strict TypeScript, keep collision/data logic out of
render files.

Run npm run build to confirm everything type-checks. Do not start the dev server or the API
server yourself, and do not attempt any browser/UI verification. Report back what you built and
that the build passed.
```

After this milestone, run `/verify` (or `/run`) to confirm in the browser that: the panel shows
real submitted scores, game-over triggers the name prompt, a valid submission adds an entry and
refreshes the panel, and a blocklisted/malformed handle shows the server's error inline rather
than failing silently.

### Milestone 6 — production wiring (not started)

Prompt for `feature-builder`:

```
You are working in the Snake game project at C:\Users\Gaming PC\Desktop\Snake (git repo, clean
tree). All prior milestones are built and working in dev (Vite dev server + Express server side
by side via proxy). Read CLAUDE.md, package.json, tsconfig.json, tsconfig.server.json,
vite.config.ts, and server/index.ts before starting.

Build Milestone 6: make this deployable as a single always-on process.

Update server/index.ts so production serves the built client (express.static pointing at the
Vite build output, typically dist/) and falls back to index.html for any non-/api route — but
/api/* routes must take priority over the static/catch-all fallback.

Update package.json scripts:
- "build" should continue running the client build AND type-check/compile the server (e.g. `tsc
  -p tsconfig.server.json`) — decide whether the server runs compiled JS or via tsx in
  production, and wire scripts accordingly without colliding output dirs with the client's dist/.
- add a "start" script that runs the production server entry point — what a host would run after
  npm run build.

Do not change any client or server business logic — purely build/deploy wiring. The existing dev
workflow (npm run dev + npm run server, proxied) must keep working unchanged.

Run npm run build to confirm it succeeds (client + server, type errors in either fail the
build). Do not start the production server, the dev server, or the API server yourself, and do
not attempt to hit any route. Report back what changed and that the build passed.
```

After this milestone, run `/verify` (or `/run`) to confirm: `npm run start` boots a single
process serving the playable game at its root and answering `/api/leaderboard/top` correctly,
and `npm run dev` / `npm run server` still work exactly as before.

## After milestone 6: code review pass

Prompt for `code-reviewer`:

```
You are reviewing the global-leaderboard feature added to the Snake game project at
C:\Users\Gaming PC\Desktop\Snake. This introduced a backend for the first time. Read CLAUDE.md
first (it may not yet reflect this change — a doc update is tracked separately, run after this
review).

Review all of: server/index.ts, server/db.ts, server/leaderboard-store.ts, server/validation.ts,
server/routes/leaderboard.ts, src/leaderboard/types.ts, src/leaderboard/client.ts,
src/leaderboard/leaderboard-store.ts, src/render/leaderboard-panel.ts, src/input/name-prompt.ts,
and the touched portions of src/main.ts, src/render/overlay.ts, package.json,
tsconfig.json/tsconfig.server.json, vite.config.ts — against this project's established
conventions (explicit .ts import extensions, import type for type-only imports, sparse why-only
comments, strict separation of concerns between state/logic/render/storage, visible in
src/storage/highscore.ts, src/game/state.ts, src/render/overlay.ts).

Specifically check:
1. No SQL outside server/leaderboard-store.ts.
2. No anti-cheat/validation logic outside server/validation.ts, and the plausibility bound is
   actually derived from real constants in src/game/difficulty.ts and src/game/logic.ts (not a
   guessed magic number), with a comment explaining the derivation and its known limitation.
3. No fetch() calls outside src/leaderboard/client.ts.
4. No canvas drawing outside src/render/*, no game-state mutation inside any render file.
5. The DOM-based name-prompt form is the only DOM UI element introduced, and is properly removed
   after submission/cancellation rather than accumulating duplicate elements.
6. A down/unreachable server degrades gracefully (empty panel, no crash), no unhandled promise
   rejections.
7. The production server (Milestone 6) prioritizes /api/* over the static/catch-all fallback.
8. Handle/score/durationMs validation duplication between client and server doesn't let the
   server-side check be bypassed — server-side is the source of truth, client-side is UX only.
9. tsconfig.server.json doesn't leak DOM lib types into server code, and the client
   tsconfig/build is unaffected.

Report findings as concrete file:line references with suggested fixes, not general observations.
```

## After review: doc update pass

Prompt for `doc-writer`:

```
You are updating documentation for the Snake game project at C:\Users\Gaming PC\Desktop\Snake
after the global-leaderboard feature was added and reviewed. Read the current CLAUDE.md in full,
plus the actual current contents of all server/* and src/leaderboard/* files, src/render/
leaderboard-panel.ts, and src/input/name-prompt.ts so the documentation matches what was actually
built (not the original plan, which may have shifted during implementation/review).

Update CLAUDE.md:
- The "Project" section currently says "No frameworks, no test runner, no linter configured —
  just vite and typescript as dependencies." No longer accurate — rewrite to describe the
  project as a client (Vite/TS/canvas, unchanged) plus a small Express+SQLite server backing a
  global leaderboard.
- Add/extend an "## Architecture" or new "## Server" section documenting server/index.ts,
  server/db.ts's schema, server/leaderboard-store.ts and server/validation.ts's responsibilities
  (including the anti-cheat plausibility check's known limitation), and the two routes.
- Document the new client-side src/leaderboard/* modules and src/render/leaderboard-panel.ts /
  src/input/name-prompt.ts in the existing "module layout" list, matching its one-line-per-module
  style.
- Update "## Commands" to include how to run the server in dev and how production start works —
  verify actual script names in package.json rather than assuming.
- Keep the file's existing terse, descriptive tone — no marketing language.

Do not modify any source code — documentation only. Report back exactly what changed.
```

## Key file reference

- `C:\Users\Gaming PC\Desktop\Snake\CLAUDE.md`
- `C:\Users\Gaming PC\Desktop\Snake\package.json`
- `C:\Users\Gaming PC\Desktop\Snake\src\main.ts`
- `C:\Users\Gaming PC\Desktop\Snake\src\game\state.ts`
- `C:\Users\Gaming PC\Desktop\Snake\src\render\overlay.ts`
- `C:\Users\Gaming PC\Desktop\Snake\src\storage\highscore.ts`
- `C:\Users\Gaming PC\Desktop\Snake\src\game\difficulty.ts`
- `C:\Users\Gaming PC\Desktop\Snake\src\game\logic.ts`
- `C:\Users\Gaming PC\Desktop\Snake\server\db.ts`
- `C:\Users\Gaming PC\Desktop\Snake\server\index.ts`
- `C:\Users\Gaming PC\Desktop\Snake\server\leaderboard-store.ts`
- `C:\Users\Gaming PC\Desktop\Snake\server\validation.ts`
- `C:\Users\Gaming PC\Desktop\Snake\server\routes\leaderboard.ts`
