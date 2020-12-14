let neighbours = null
let world1 = null
let world2 = null
let curr = null
let next = null
let state1 = null
let state2 = null
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

  let index = 0
  for (let i = 0; i < cols * rows; i ++) {
    const cell = Math.random() > 0.8 ? 1 : 0
    world1[i] = cell
    Atomics.store(state1, index, cell === 1 ? i : -i)
    index += 1
  }
}

const step = () => {
  let index = 0

  curr.forEach((cell, i) => {
    const count = neighbours[i].reduce((a, b) => a + curr[b], 0)
    const nextCell = count === 3 ? 1 : count !== 2 ? 0 : cell
    next[i] = nextCell

    if (cell > nextCell) {
      Atomics.store(state1, index, -i)
      index += 1
    } else if (cell < nextCell) {
      Atomics.store(state1, index, i)
      index += 1
    }
  })

  if (index < state1.length) state1[index] = 0

  ;[curr, next] = [next, curr]
}

self.addEventListener('message', (m) => {
  switch (m.data.type) {
    case 'step':
      Atomics.wait(lock, 0, 1)
      ;[state1, state2] = [state2, state1]
      step()
      self.postMessage('render')
      return
    case 'init':
      state1 = new Int32Array(m.data.buffers.state1)
      state2 = new Int32Array(m.data.buffers.state2)
      lock = new Int32Array(m.data.buffers.lock)
      init(m.data.options.cols, m.data.options.rows)
      self.postMessage('render')
      return
    default:
      return
  }
})
