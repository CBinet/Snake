// Plain DOM form layered over the canvas to collect a handle for leaderboard
// submission — the one place plain DOM is justified, since canvas has no
// native text input. Submission-trigger rule chosen for simplicity: always
// show the prompt on every game over (no "qualifies for top N" check against
// the cached leaderboard, since the server is the source of truth on submit
// anyway and a client-side gate would just be a UX nicety).

import { submitScore } from '../leaderboard/client.ts'
import { refreshTopScores } from '../leaderboard/leaderboard-store.ts'

const HANDLE_MAX_LENGTH = 10

function positionOverCanvas(form: HTMLFormElement, canvas: HTMLCanvasElement): void {
  const rect = canvas.getBoundingClientRect()
  form.style.position = 'fixed'
  form.style.left = `${rect.left + rect.width / 2}px`
  // Gameover overlay's backdrop (src/render/overlay.ts drawCenteredLines) extends to
  // canvasSize/2 + 72 for its 3-line layout; clear that before placing the form.
  form.style.top = `${rect.top + rect.height / 2 + 84}px`
  form.style.transform = 'translate(-50%, 0)'
}

function buildForm(canvas: HTMLCanvasElement): {
  form: HTMLFormElement
  input: HTMLInputElement
  error: HTMLDivElement
} {
  const form = document.createElement('form')
  form.style.display = 'flex'
  form.style.flexDirection = 'column'
  form.style.gap = '4px'
  form.style.alignItems = 'center'
  form.style.fontFamily = 'ui-monospace, "Cascadia Code", "Courier New", monospace'
  form.style.zIndex = '10'

  const input = document.createElement('input')
  input.type = 'text'
  input.maxLength = HANDLE_MAX_LENGTH
  input.placeholder = 'NAME'
  input.autocomplete = 'off'

  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.textContent = 'SUBMIT SCORE'

  const error = document.createElement('div')
  error.style.color = '#ff2e6c'
  error.style.fontSize = '12px'
  error.style.minHeight = '14px'

  const row = document.createElement('div')
  row.style.display = 'flex'
  row.style.gap = '4px'
  row.append(input, submit)

  form.append(row, error)
  positionOverCanvas(form, canvas)

  return { form, input, error }
}

export function showNamePromptIfQualifying(score: number, durationMs: number, onSubmit: (handle: string) => void): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')
  if (canvas === null) return

  const { form, input, error } = buildForm(canvas)
  document.body.append(form)
  input.focus()

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const handle = input.value.trim()
    if (handle.length === 0) {
      error.textContent = 'enter a name'
      return
    }

    submitScore(handle, score, durationMs).then((result) => {
      if (!result.ok) {
        error.textContent = result.error
        return
      }

      form.remove()
      onSubmit(handle)
      void refreshTopScores()
    })
  })
}
