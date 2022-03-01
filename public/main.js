import Stats from './stats.js'

const options = { size: 2, cols: 600, rows: 300 }

const buffers = {
  diff1: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * options.cols * options.rows),
  diff2: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * options.cols * options.rows), 
  state: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 4),
}

const toggleBtn = document.querySelector('#toggle')
const stepBtn = document.querySelector('#step')
const counter = document.querySelector('#counter')
const main = document.querySelector('main')

const life = new Worker('life.js')
const render = new Worker('render.js')
const state = new Int32Array(buffers.state)

const canvas = document.createElement('canvas')
canvas.width = options.cols * options.size
canvas.height = options.rows * options.size
const offscreenCanvas = canvas.transferControlToOffscreen()
main.appendChild(canvas)

const stats = new Stats()
document.body.appendChild(stats.dom)

toggleBtn.onclick = () => {
  const running = Atomics.load(state, 2) === 1
  Atomics.store(state, 2, running ? 0 : 1)
  Atomics.notify(state, 2)
  toggleBtn.textContent = running ? 'Start' : 'Pause'
}

stepBtn.onclick = () => {
  Atomics.store(state, 2, 0)
  Atomics.notify(state, 2)
  toggleBtn.textContent = 'Start'
}

;(function loop (n = 0) {
  const a = Atomics.load(state, 3)
  requestAnimationFrame(() => loop(a === n ? n : a))
  if (a === n) return
  stats.end()
  stats.begin()
  counter.textContent = a
})()

life.postMessage({ type: 'init', options, buffers })
render.postMessage({ type: 'init', options, buffers, offscreenCanvas }, [offscreenCanvas])
