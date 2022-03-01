const init = (world1, diff1) => {
  for (const i of world1.keys()) {
    const cell = Math.random() > 0.9 ? 1 : 0
    Atomics.store(world1, i, cell)
    Atomics.store(diff1, i, cell === 1 ? i + 1 : -i - 1)
  }
}

const createNeighbours = (cols, rows) => {
  neighbours = [...Array(cols * rows)]
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const [n, s, w, e] = [i - 1, i + 1, j - 1, j + 1]
      neighbours[i * cols + j] =
        [[n, w], [n, j], [n, e], [i, w], [i, e], [s, w], [s, j], [s, e]]
          .map(([i, j]) => (i % rows) * cols + (j % cols))
    }
  }
  return neighbours
}

const step = (world1, world2, diff1, diff2, state, neighbours) => {
  let index = 0
  world1.forEach((cell, i) => {
    const count = neighbours[i].reduce((a, b) => a + world1[b], 0)
    const nextCell = count === 3 ? 1 : count !== 2 ? 0 : cell
    world2[i] = nextCell
    if (cell > nextCell) {
      Atomics.store(diff1, index, -i - 1)
      index += 1
    } else if (cell < nextCell) {
      Atomics.store(diff1, index, i + 1)
      index += 1
    }
  })
  if (index < diff1.length) diff1[index] = 0

  // Unlock render worker
  Atomics.store(state, 1, 1)
  Atomics.notify(state, 1)
  
  // Increment counter
  const n = Atomics.load(state, 3)
  Atomics.store(state, 3, n + 1)

  // Lock self
  Atomics.store(state, 0, 0)
  Atomics.wait(state, 0, 0)

  // Wait for main thread
  Atomics.wait(state, 2, 0)

  step(world2, world1, diff2, diff1, state, neighbours)
}

self.onmessage = (m) => {
  const { buffers, options } = m.data
  const { cols, rows } = options
  const diff1 = new Int32Array(buffers.diff1)
  const diff2 = new Int32Array(buffers.diff2)
  const state = new Int32Array(buffers.state)
  const world1 = new Int32Array(cols * rows).fill(0)
  const world2 = new Int32Array(cols * rows)
  const neighbours = createNeighbours(cols, rows)
  init(world1, diff1)
  step(world1, world2, diff2, diff1, state, neighbours)
}
