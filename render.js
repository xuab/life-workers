let options = null
let colors = null
let diff1 = null
let diff2 = null
let locks = null
let ctx = null

const render = () => {
  self.postMessage('tick')
  Atomics.wait(locks, 1, 0)

  let i = 0
  while (i < diff1.length && diff1[i] !== 0) {
    const x = diff1[i]
    const [index, color] = x > 0 ? [x - 1, colors.alive] : [-x - 1, colors.dead]
    ctx.fillStyle = color
    ctx.fillRect(index % options.cols, Math.floor(index / options.cols), 1, 1)
    i += 1
  }

  Atomics.store(locks, 1, 0)
  Atomics.store(locks, 0, 1)
  Atomics.notify(locks, 0)
  ;[diff1, diff2] = [diff2, diff1]

  Atomics.wait(locks, 2, 0)
  requestAnimationFrame(render)
}

self.onmessage = (m) => {
  switch (m.data.type) {
    case 'init':
      diff1 = new Int32Array(m.data.buffers.diff1)
      diff2 = new Int32Array(m.data.buffers.diff2)
      locks = new Int32Array(m.data.buffers.locks)
      ctx = m.data.offscreenCanvas.getContext('2d')
      ctx.scale(m.data.options.size, m.data.options.size)
      options = m.data.options
      colors = m.data.colors
      render()
      return
    default:
      return
  }
}