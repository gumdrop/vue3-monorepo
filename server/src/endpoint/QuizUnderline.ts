import { OPS } from 'pdfjs-dist/legacy/build/pdf.mjs'

export interface UnderlineRect {
  x: number
  y: number
  w: number
  h: number
}

interface TextItemLike {
  str: string
  transform: number[]
  width: number
}

interface OperatorList {
  fnArray: number[]
  argsArray: unknown[][]
}

interface PdfPage {
  getOperatorList: () => Promise<OperatorList>
}

// Thin horizontal rectangles drawn just below a text baseline are underlines
// (Word renders underlines as filled rectangles; table borders sit farther from
// the baseline and are filtered out by the caller's vertical window).
export async function underlineRectsForPage(page: PdfPage): Promise<UnderlineRect[]> {
  const ops = await page.getOperatorList()
  const rects: UnderlineRect[] = []

  for (let i = 0; i < ops.fnArray.length; i++) {
    if (ops.fnArray[i] !== OPS.constructPath) continue

    const flat = ops.argsArray[i][1]?.[0] as ArrayLike<number> | undefined
    if (!flat || typeof flat.length !== 'number') continue

    const subpaths: Array<Array<{ x: number; y: number }>> = []
    let current: Array<{ x: number; y: number }> = []

    for (let j = 0; j < flat.length; ) {
      const op = flat[j]
      if (op === 0) {
        if (current.length) subpaths.push(current)
        current = [{ x: flat[j + 1], y: flat[j + 2] }]
        j += 3
      } else if (op === 1) {
        current.push({ x: flat[j + 1], y: flat[j + 2] })
        j += 3
      } else if (op === 2) {
        current.push({ x: flat[j + 5], y: flat[j + 6] })
        j += 7
      } else if (op === 4) {
        if (current.length) subpaths.push(current)
        current = []
        j += 1
      } else {
        j += 1
      }
    }
    if (current.length) subpaths.push(current)

    for (const sub of subpaths) {
      if (sub.length < 2) continue
      const xs = sub.map((p) => p.x)
      const ys = sub.map((p) => p.y)
      const x = Math.min(...xs)
      const y = Math.min(...ys)
      const w = Math.max(...xs) - x
      const h = Math.max(...ys) - y
      if (w > 2 && h > 0 && h < 1.5) rects.push({ x, y, w, h })
    }
  }

  return rects
}

// Wraps the underlined words within a single text item in <u>...</u> markers.
export function markUnderlinesInItem(
  item: TextItemLike,
  underlines: UnderlineRect[],
): string {
  const str = item.str
  const x0 = item.transform[4]
  const baseline = item.transform[5]
  const width = item.width

  if (!str || width <= 0) return str

  const relevant = underlines.filter(
    (r) =>
      r.y < baseline &&
      baseline - r.y > 0.5 &&
      baseline - r.y < 4 &&
      r.x < x0 + width &&
      r.x + r.w > x0,
  )

  if (relevant.length === 0) return str

  const charWidth = width / str.length
  let result = ''
  let x = x0

  for (const token of str.split(/(\s+)/)) {
    const tokenWidth = token.length * charWidth
    let overlap = 0
    for (const r of relevant) {
      const ox0 = Math.max(x, r.x)
      const ox1 = Math.min(x + tokenWidth, r.x + r.w)
      if (ox1 > ox0) overlap += ox1 - ox0
    }

    if (token.trim() && tokenWidth > 0 && overlap / tokenWidth >= 0.5) {
      result += `<u>${token}</u>`
    } else {
      result += token
    }
    x += tokenWidth
  }

  return result
}
