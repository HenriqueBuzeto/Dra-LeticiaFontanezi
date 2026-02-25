export function createImageData(width: number, height: number): ImageData {
  return new ImageData(width, height)
}

export function copyImageData(src: ImageData): ImageData {
  const out = new ImageData(src.width, src.height)
  out.data.set(src.data)
  return out
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: h * 360, s, v }
}

export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function cropImageData(
  src: ImageData,
  x: number,
  y: number,
  w: number,
  h: number
): ImageData {
  const out = new ImageData(w, h)
  const sw = src.width
  const srcData = src.data
  const outData = out.data
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const sx = Math.min(sw - 1, Math.max(0, Math.floor(x + i)))
      const sy = Math.min(src.height - 1, Math.max(0, Math.floor(y + j)))
      const si = (sy * sw + sx) * 4
      const oi = (j * w + i) * 4
      outData[oi] = srcData[si]
      outData[oi + 1] = srcData[si + 1]
      outData[oi + 2] = srcData[si + 2]
      outData[oi + 3] = srcData[si + 3]
    }
  }
  return out
}

export function morphologicalOpenSingle(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  channel: number
): void {
  const stride = 4
  const tmp = new Uint8ClampedArray(data.length)
  tmp.set(data)
  const get = (d: Uint8ClampedArray, x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 255
    return d[(y * width + x) * stride + channel]
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minV = 255
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          minV = Math.min(minV, get(tmp, x + dx, y + dy))
      const i = (y * width + x) * stride
      data[i] = data[i + 1] = data[i + 2] = minV
      data[i + 3] = tmp[i + 3]
    }
  }
  tmp.set(data)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxV = 0
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          maxV = Math.max(maxV, get(tmp, x + dx, y + dy))
      const i = (y * width + x) * stride
      data[i] = data[i + 1] = data[i + 2] = maxV
      data[i + 3] = tmp[i + 3]
    }
  }
}

export function findContours(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  useAlpha: boolean = true
): { points: { x: number; y: number }[]; area: number }[] {
  const visited = new Uint8Array(width * height)
  const stride = 4
  const at = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0
    const v = data[(y * width + x) * stride + (useAlpha ? 3 : 0)]
    return v > 128 ? 1 : 0
  }
  const contours: { points: { x: number; y: number }[]; area: number }[] = []
  const dx = [0, 1, 1, 1, 0, -1, -1, -1]
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (visited[idx] || at(x, y) === 0) continue
      const points: { x: number; y: number }[] = []
      const stack: [number, number][] = [[x, y]]
      visited[idx] = 1
      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!
        points.push({ x: cx, y: cy })
        for (let d = 0; d < 8; d++) {
          const nx = cx + dx[d]
          const ny = cy + dy[d]
          const nidx = ny * width + nx
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[nidx] && at(nx, ny) === 1) {
            visited[nidx] = 1
            stack.push([nx, ny])
          }
        }
      }
      if (points.length > 0) contours.push({ points, area: points.length })
    }
  }
  return contours
}
