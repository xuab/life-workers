// import Stats from './stats.js'

const size = 2
const cols = 300
const rows = 300
const deadColor = 'hsl(0, 0%, 10%)'

const lifeWorker = new Worker('life.js')
const renderWorker = new Worker('render.js')

const buffers = {
  diff1: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * cols * rows),
  diff2: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * cols * rows),
  locks: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2),
}

const canvas = document.createElement('canvas')
canvas.width = cols * size
canvas.height = rows * size
const offscreenCanvas = canvas.transferControlToOffscreen()

// const stats = new Stats()

const root = document.querySelector('#root')
root.style.background = deadColor
root.appendChild(canvas)
// root.appendChild(stats.dom)

// renderWorker.addEventListener('message', () => {
//   stats.end()
//   stats.begin()
// })

renderWorker.postMessage({
  type: 'init',
  options: { cols, rows, size },
  buffers,
  offscreenCanvas,
}, [offscreenCanvas])

lifeWorker.postMessage({
  type: 'init',
  options: { cols, rows },
  buffers,
})
