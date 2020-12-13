import Stats from './stats.js'
import { init, step } from './life.js'

const size = 2
const cols = 240
const rows = 240
const aliveColor = 'hsl(0, 0%, 90%)'
const deadColor = 'hsl(0, 0%, 10%)'

const root = document.querySelector('#root')
root.style.background = deadColor

const canvas = document.createElement('canvas')
canvas.width = cols * size
canvas.height = rows * size
root.appendChild(canvas)

const stats = new Stats()
root.appendChild(stats.dom)

const ctx = canvas.getContext('2d')
ctx.scale(size, size)

const renderCells = (cells, color) => {
  cells.forEach((i) => {
    ctx.fillStyle = color
    ctx.fillRect(Math.floor(i / rows), i % rows, 1, 1)
  })
}

const render = ({ alive, dead }) => {
  renderCells(alive, aliveColor)
  renderCells(dead, deadColor)
}

render(init(cols, rows))
;(function loop() {
  stats.begin()
  render(step())
  stats.end()
  requestAnimationFrame(loop)
})()
