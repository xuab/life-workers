const render = (diff1, diff2, locks, ctx, options, colors) => {
  // draw diff cells
  let i = 0
  while (i < diff1.length && diff1[i] !== 0) {
    const x = diff1[i]
    const [index, color] = x > 0 ? [x - 1, colors.alive] : [-x - 1, colors.dead]
    ctx.fillStyle = color
    ctx.fillRect(index % options.cols, Math.floor(index / options.cols), 1, 1)
    i += 1
  }

  // notify stats
  self.postMessage('tick')

  // lock render
  Atomics.store(locks, 1, 0)

  // unlock step
  Atomics.store(locks, 0, 1)
  Atomics.notify(locks, 0)

  requestAnimationFrame(() => {
    // wait for render/loop unlock
    Atomics.wait(locks, 1, 0)
    Atomics.wait(locks, 2, 0)

    render(diff2, diff1, locks, ctx, options, colors)
  })
}

self.onmessage = (m) => {
  const { buffers, offscreenCanvas, options, colors } = m.data
  const diff1 = new Int32Array(buffers.diff1)
  const diff2 = new Int32Array(buffers.diff2)
  const locks = new Int32Array(buffers.locks)
  const ctx = offscreenCanvas.getContext('2d')
  ctx.scale(options.size, options.size)

  // lock render and wait for unlock
  Atomics.store(locks, 1, 1)
  Atomics.wait(locks, 1, 0)

  render(diff1, diff2, locks, ctx, options, colors)
}