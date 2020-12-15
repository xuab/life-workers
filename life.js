let neighbours = null
let world1 = null
let world2 = null
let curr = null
let next = null
let diff1 = null
let diff2 = null
let locks = null

const init = (cols, rows) => {
  neighbours = [...Array(cols * rows)]
  world1 = [...Array(cols * rows)]
  world2 = [...Array(cols * rows)]
  ;[curr, next] = [world1, world2]

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const [n, s, w, e] = [i - 1, i + 1, j - 1, j + 1]
      neighbours[i * cols + j] =
        [[n, w], [n, j], [n, e], [i, w], [i, e], [s, w], [s, j], [s, e]]
          .map(([i, j]) => (i % rows) * cols + (j % cols))
    }
  }

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
  console.log('[LIFE] init done')
  ;[diff1, diff2] = [diff2, diff1]
  step()
}

const step = () => {
  Atomics.wait(locks, 0, 0)

  let index = 0
  curr.forEach((cell, i) => {
    const count = neighbours[i].reduce((a, b) => a + curr[b], 0)
    const nextCell = count === 3 ? 1 : count !== 2 ? 0 : cell
    next[i] = nextCell
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
  ;[curr, next] = [next, curr]
  ;[diff1, diff2] = [diff2, diff1]
  setTimeout(step)
}

self.addEventListener('message', (m) => {
  switch (m.data.type) {
    case 'init':
      diff1 = new Int32Array(m.data.buffers.diff1)
      diff2 = new Int32Array(m.data.buffers.diff2)
      locks = new Int32Array(m.data.buffers.locks)
      init(m.data.options.cols, m.data.options.rows)
      return
    default:
      return
  }
})
