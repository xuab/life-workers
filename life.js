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

const init = (world1, diff1) => {
  // init world
  for (let i = 0; i < world1.length; i ++) {
    const cell = Math.random() > 0.8 ? 1 : 0
    world1[i] = cell
  }

  // init diff cells
  let index = 0
  for (let i = 0; i < world1.length; i ++) {
    Atomics.store(diff1, index, world1[i] === 1 ? i + 1 : -i - 1)
    index += 1
  }
}

const step = (world1, world2, diff1, diff2, locks, neighbours) => {
  // compute new world and diff cells
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

  // lock step
  Atomics.store(locks, 0, 0)

  // unlock render
  Atomics.store(locks, 1, 1)
  Atomics.notify(locks, 1)

  // wait for step unlock
  Atomics.wait(locks, 0, 0)
  step(world2, world1, diff2, diff1, locks, neighbours)
}

self.onmessage = (m) => {
  const { buffers, options } = m.data
  const { cols, rows } = options
  const diff1 = new Int32Array(buffers.diff1)
  const diff2 = new Int32Array(buffers.diff2)
  const locks = new Int32Array(buffers.locks)
  const world1 = [...Array(cols * rows)].fill(0)
  const world2 = [...Array(cols * rows)]

  init(world1, diff1)
  const neighbours = createNeighbours(cols, rows)
  step(world1, world2, diff2, diff1, locks, neighbours)
}
