const render = (diff1, diff2, state, ctx, cols) => {
  requestAnimationFrame(() => {
    // Lock self
    Atomics.store(state, 1, 0)
    Atomics.wait(state, 1, 0)
    render(diff2, diff1, state, ctx, cols)
  })
  
  for (const i of diff1.keys()) {
    const x = diff1[i]
    if (x === 0) break
    const [index, color] = x > 0 ? [x - 1, '#e1e1e1'] : [-x - 1, '#161616']
    ctx.fillStyle = color
    ctx.fillRect(index % cols, Math.floor(index / cols), 1, 1)
  }

  // Unlock life worker
  Atomics.store(state, 0, 1)
  Atomics.notify(state, 0)
}

self.onmessage = (m) => {
  const { buffers, offscreenCanvas, options } = m.data
  const { size, cols } = options

  const diff1 = new Int32Array(buffers.diff1)
  const diff2 = new Int32Array(buffers.diff2)
  const state = new Int32Array(buffers.state)

  const ctx = offscreenCanvas.getContext('2d')
  ctx.scale(size, size)

  // Wait life worker
  Atomics.wait(state, 1, 0)
  render(diff1, diff2, state, ctx, cols)
}