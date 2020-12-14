let neighbours = null
let world1 = null
let world2 = null
let curr = null
let next = null
let alive1 = null
let alive2 = null
let dead1 = null
let dead2 = null
let lock

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

  let aliveIndex = 0
  let deadIndex = 0
  for (let i = 0; i < cols * rows; i ++) {
    const cell = Math.random() > 0.8 ? 1 : 0
    world1[i] = cell
    if (cell === 1) {
      Atomics.store(alive1, aliveIndex, i)
      aliveIndex += 1
    } else {
      Atomics.store(dead1, deadIndex, i)
      deadIndex += 1
    }
  }
}

const step = () => {
  let aliveIndex = 0
  let deadIndex = 0

  curr.forEach((cell, i) => {
    const count = neighbours[i].reduce((a, b) => a + curr[b], 0)
    const nextCell = count === 3 ? 1 : count !== 2 ? 0 : cell
    next[i] = nextCell

    if (cell > nextCell) {
      Atomics.store(dead1, deadIndex, i)
      deadIndex += 1
    } else if (cell < nextCell) {
      Atomics.store(alive1, aliveIndex, i)
      aliveIndex += 1
    }
  })

  if (aliveIndex < alive1.length) alive1[aliveIndex] = -1
  if (deadIndex < dead1.length) dead1[deadIndex] = -1

  ;[curr, next] = [next, curr]
}

self.addEventListener('message', (m) => {
  switch (m.data.type) {
    case 'step':
      Atomics.wait(lock, 0, 1)
      ;[alive1, alive2] = [alive2, alive1]
      ;[dead1, dead2] = [dead2, dead1]
      step()
      self.postMessage('render')
      return
    case 'init':
      alive1 = new Int32Array(m.data.buffers.alive1)
      alive2 = new Int32Array(m.data.buffers.alive2)
      dead1 = new Int32Array(m.data.buffers.dead1)
      dead2 = new Int32Array(m.data.buffers.dead2)
      lock = new Int32Array(m.data.buffers.lock)
      init(m.data.options.cols, m.data.options.rows)
      self.postMessage('render')
      return
    default:
      return
  }
})
