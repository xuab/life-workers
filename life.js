let world1 = null
let world2 = null
let curr = null
let next = null
let neighbours = null
let alive = null
let dead = null

export const init = (cols, rows) => {
  neighbours = [...Array(cols * rows)]
  world1 = [...Array(cols * rows)]
  world2 = [...Array(cols * rows)]
  ;[curr, next] = [world1, world2]
  alive = []
  dead = []

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const [n, s, w, e] = [i - 1, i + 1, j - 1, j + 1]
      neighbours[i * cols + j] =
        [[n, w], [n, j], [n, e], [i, w], [i, e], [s, w], [s, j], [s, e]]
          .map(([i, j]) => (i % rows) * cols + (j % cols))
    }
  }

  for (let i = 0; i < cols * rows; i ++) {
    const cell = Math.random() > 0.8 ? 1 : 0
    world1[i] = cell
    ;(cell === 1 ? alive : dead).push(i)
  }

  return { alive, dead }
}

export const step = () => {
  alive = []
  dead = []

  curr.forEach((cell, k) => {
    const count = neighbours[k].map((i) => curr[i]).reduce((a, b) => a + b, 0)
    const nextCell = count === 3 ? 1 : count !== 2 ? 0 : cell
    next[k] = nextCell
    if (cell > nextCell) dead.push(k)
    else if (cell < nextCell) alive.push(k)
  })

  ;[curr, next] = [next, curr]

  return { alive, dead }
}