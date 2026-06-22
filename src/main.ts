import './style.css'
import { GRID_SIZE, CELL_SIZE, COLORS } from './config.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!
canvas.width = GRID_SIZE * CELL_SIZE
canvas.height = GRID_SIZE * CELL_SIZE

const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false

ctx.fillStyle = COLORS.background
ctx.fillRect(0, 0, canvas.width, canvas.height)
