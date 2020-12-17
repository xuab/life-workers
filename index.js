import Stats from './stats.js'

const options = {
  size: 2,
  cols: 360,
  rows: 240,
}

const colors = {
  dead: 'hsl(0, 0%, 10%)',
  alive: 'hsl(0, 0%, 90%)',
}

const workers = {
  life: new Worker('life.js'),
  render: new Worker('render.js'),
}

const buffer = (n) => new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * n)
const buffers = {
  diff1: buffer(options.cols * options.rows),
  diff2: buffer(options.cols * options.rows),
  locks: buffer(3),
}
const locks = new Int32Array(buffers.locks)

const root = document.querySelector('#root')
root.style.background = colors.dead

const stats = new Stats()
root.appendChild(stats.dom)

const toggleBtn = document.querySelector('#toggle')
const genEl = document.querySelector('#gen')
const life = document.querySelector('#life')

let pause = true
let gen = 1

toggleBtn.onclick = () => {
  pause = !pause
  toggleBtn.textContent = pause ? 'Start' : 'Pause'
  Atomics.store(locks, 2, pause ? 0 : 1)
  Atomics.notify(locks, 2)
}

workers.render.onmessage = (m) => {
  if (m.data === 'tick') {
    genEl.textContent = gen
    gen += 1
    stats.end()
    stats.begin()
  }
}

const initRender = () => {
  const canvas = document.createElement('canvas')
  canvas.width = options.cols * options.size
  canvas.height = options.rows * options.size
  life.textContent = ''
  life.appendChild(canvas)
  const offscreenCanvas = canvas.transferControlToOffscreen()

  workers.render.postMessage({
    type: 'init',
    options,
    colors,
    buffers,
    offscreenCanvas,
  }, [offscreenCanvas])
}

const initLife = () => {
  workers.life.postMessage({ type: 'init', options, buffers })
}

initRender()
initLife()