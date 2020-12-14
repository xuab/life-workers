import Stats from './stats.js'

const size = 2
const cols = 300
const rows = 300
const aliveColor = 'hsl(0, 0%, 90%)'
const deadColor = 'hsl(0, 0%, 10%)'

const worker = new Worker('worker.js')
const buffers = {
  alive1: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * cols * rows),
  alive2: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * cols * rows),
  dead1: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * cols * rows),
  dead2: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * cols * rows),
  lock: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
}
let alive1 = new Int32Array(buffers.alive1)
let alive2 = new Int32Array(buffers.alive2)
let dead1 = new Int32Array(buffers.dead1)
let dead2 = new Int32Array(buffers.dead2)
const lock = new Int32Array(buffers.lock)

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
  let i = 0
  while (i < cells.length && cells[i] > -1) {
    const x = cells[i]
    ctx.fillStyle = color
    ctx.fillRect(x % cols, Math.floor(x / cols), 1, 1)
    i += 1
  }
}

const render = () => {
  renderCells(alive1, aliveColor)
  renderCells(dead1, deadColor)
}

worker.addEventListener('message', () => {
  stats.end()
  stats.begin()
  worker.postMessage({ type: 'step' })
  Atomics.store(lock, 0, 1)
  render()
  Atomics.store(lock, 0, 0)
  Atomics.notify(lock, 0, 1)
  ;[alive1, alive2] = [alive2, alive1]
  ;[dead1, dead2] = [dead2, dead1]
})

const options = { cols, rows }
worker.postMessage({ type: 'init', buffers, options })
