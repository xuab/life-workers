const SIZE = 4
const COLS = 120
const ROWS = 120
const ALIVE = 'hsl(0, 0%, 90%)'
const DEAD = 'hsl(0, 0%, 10%)'

const initialState = R.map(
  () => Math.random() > 0.8 ? 1 : 0,
  R.range(0, COLS * ROWS),
)

const neighbours = []
for (let i = 0; i < ROWS; i++) {
  for (let j = 0; j < COLS; j++) {
    const [n, s, w, e] = [i - 1, i + 1, j - 1, j + 1]
    neighbours[i * COLS + j] = R.map(
      ([i, j]) => (i % ROWS) * COLS + (j % COLS),
      [[n, w], [n, j], [n, e], [i, w], [i, e], [s, w], [s, j], [s, e]],
    )
  }
}

const step = (state) => state.map((cell, k) => {
  const count = R.sum(neighbours[k].map((i) => state[i]))
  return count === 3 ? 1 : count !== 2 ? 0 : cell
})

const canvas = document.createElement('canvas')
canvas.width = COLS * SIZE
canvas.height = ROWS * SIZE

const root = document.querySelector('#root')
root.style.background = DEAD
root.appendChild(canvas)

const ctx = canvas.getContext('2d')
ctx.scale(SIZE, SIZE)

const render = (state) => state.forEach((cell, i) => {
  ctx.fillStyle = cell === 1 ? ALIVE : DEAD
  ctx.fillRect(Math.floor(i / ROWS), i % ROWS, 1, 1)
})

let state = initialState
;(function loop() {
  render(state)
  state = step(state)
  requestAnimationFrame(loop)
})()
