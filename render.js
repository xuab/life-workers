const aliveColor = 'hsl(0, 0%, 90%)'
const deadColor = 'hsl(0, 0%, 10%)'

let options = null
let diff1 = null
let diff2 = null
let locks = null
let ctx = null

const render = () => {
  Atomics.wait(locks, 1, 0)

  let i = 0
  while (i < diff1.length && diff1[i] !== 0) {
    const x = diff1[i]
    const [index, color] = x > 0 ? [x - 1, aliveColor] : [-x - 1, deadColor]
    ctx.fillStyle = color
    ctx.fillRect(index % options.cols, Math.floor(index / options.cols), 1, 1)
    i += 1
  }

  Atomics.store(locks, 1, 0)
  Atomics.store(locks, 0, 1)
  Atomics.notify(locks, 0)
  ;[diff1, diff2] = [diff2, diff1]
  setTimeout(render)
}

self.onmessage = (m) => {
  switch (m.data.type) {
    case 'init':
      console.log('[RENDER] init')
      diff1 = new Int32Array(m.data.buffers.diff1)
      diff2 = new Int32Array(m.data.buffers.diff2)
      locks = new Int32Array(m.data.buffers.locks)
      ctx = m.data.offscreenCanvas.getContext('2d')
      ctx.scale(m.data.options.size, m.data.options.size)
      options = m.data.options
      render()
      return
    default:
      return
  }
}