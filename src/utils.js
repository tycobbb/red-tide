export function repeat(n, list) {
  const len = list.length
  const res = new Array(len * n)

  for (let i = 0; i < n; i++) {
    res.splice(i * len, len, ...list)
  }

  return res
}
