let options = null
let neighbours = null
let world1 = null
let world2 = null
let diff1 = null
let diff2 = null
let locks = null

const initNeighbours = () => {
  const { cols, rows } = options
  neighbours = [...Array(cols * rows)]
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const [n, s, w, e] = [i - 1, i + 1, j - 1, j + 1]
      neighbours[i * cols + j] =
        [[n, w], [n, j], [n, e], [i, w], [i, e], [s, w], [s, j], [s, e]]
          .map(([i, j]) => (i % rows) * cols + (j % cols))
    }
  }
}

const initWorld = () => {
  const { cols, rows } = options
  world1 = [...Array(cols * rows)]
  world2 = [...Array(cols * rows)]

  let index = 0
  for (let i = 0; i < diff1.length; i ++) {
    const cell = Math.random() > 0.8 ? 1 : 0
    world1[i] = cell
    Atomics.store(diff1, index, cell === 1 ? i + 1 : -i - 1)
    index += 1
  }
  Atomics.store(locks, 0, 0)
  Atomics.store(locks, 1, 1)
  Atomics.notify(locks, 1)
  ;[diff1, diff2] = [diff2, diff1]
}

const step = () => {
  Atomics.wait(locks, 0, 0)

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

  Atomics.store(locks, 0, 0)
  Atomics.store(locks, 1, 1)
  Atomics.notify(locks, 1)
  ;[diff1, diff2] = [diff2, diff1]
  ;[world1, world2] = [world2, world1]
  requestAnimationFrame(step)
}

self.onmessage = (m) => {
  switch (m.data.type) {
    case 'init':
      diff1 = new Int32Array(m.data.buffers.diff1)
      diff2 = new Int32Array(m.data.buffers.diff2)
      locks = new Int32Array(m.data.buffers.locks)
      options = m.data.options
      initNeighbours()
      initWorld()
      step()
      return
    default:
      return
  }
}
