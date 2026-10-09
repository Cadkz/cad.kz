/**
 * Номера страниц для показа: первая, последняя и две соседних с текущей, пропуски — null.
 * 1 … 5 6 [7] 8 9 … 69
 */
export function pageWindow(page: number, pages: number, around = 2): (number | null)[] {
  const result: (number | null)[] = []
  for (let n = 1; n <= pages; n++) {
    const near = Math.abs(n - page) <= around
    if (n === 1 || n === pages || near) result.push(n)
    else if (result[result.length - 1] !== null) result.push(null)
  }
  return result
}
