import Stats from './stats.js'

const size = 2
const cols = 300
const rows = 300
const aliveColor = 'hsl(0, 0%, 90%)'
const deadColor = 'hsl(0, 0%, 10%)'

const worker = new Worker('life.js')
const buffers = {
  state1: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * cols * rows),
  state2: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * cols * rows),
  lock: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
}
let state1 = new Int32Array(buffers.state1)
let state2 = new Int32Array(buffers.state2)
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

const render = () => {
  let i = 0
  while (i < state1.length && state1[i] !== 0) {
    const x = state1[i]
    const [index, color] = x > 0 ? [x - 1, aliveColor] : [Math.abs(x) - 1, deadColor]
    ctx.fillStyle = color
    ctx.fillRect(index % cols, Math.floor(index / cols), 1, 1)
    i += 1
  }
}

worker.addEventListener('message', () => {
  stats.end()
  stats.begin()
  worker.postMessage({ type: 'step' })
  Atomics.store(lock, 0, 1)
  render()
  Atomics.store(lock, 0, 0)
  Atomics.notify(lock, 0)
  ;[state1, state2] = [state2, state1]
})

const options = { cols, rows }
worker.postMessage({ type: 'init', buffers, options })
