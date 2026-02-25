export interface Landmark2D {
  x: number
  y: number
  z?: number
}

const UPPER_INNER_LIP = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291]
const LOWER_INNER_LIP = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]

const NUM_BRACKETS_UPPER = 6
const NUM_BRACKETS_LOWER = 6

export interface BracketPoint {
  x: number
  y: number
  angle: number
}

export interface TeethRegion {
  upperPoints: BracketPoint[]
  lowerPoints: BracketPoint[]
  mouthBBox: { x: number; y: number; width: number; height: number }
  centerX: number
  centerY: number
}

let faceMeshInstance: {
  send: (img: HTMLVideoElement | HTMLCanvasElement) => Promise<void>
} | null = null
let lastLandmarksRef: Landmark2D[] | null = null

const MEDIAPIPE_VERSION = '0.4.1633559619'
const CDN_BASES = [
  `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${MEDIAPIPE_VERSION}`,
  `https://unpkg.com/@mediapipe/face_mesh@${MEDIAPIPE_VERSION}`,
]

function makeLocateFile(baseUrl: string) {
  return (path: string) => `${baseUrl}/${path}`
}

export async function initAREngine(): Promise<boolean> {
  if (faceMeshInstance) return true
  if (typeof window === 'undefined') return false

  const { FaceMesh } = await import('@mediapipe/face_mesh')
  const localBase =
    typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}/mediapipe`
      : ''
  const bases = localBase ? [localBase, ...CDN_BASES] : CDN_BASES

  let lastError: unknown = null
  for (const base of bases) {
    try {
      const faceMesh = new FaceMesh({ locateFile: makeLocateFile(base) })
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      })
      await faceMesh.initialize()
      faceMesh.onResults((results: { multiFaceLandmarks?: Landmark2D[][] }) => {
        lastLandmarksRef = results.multiFaceLandmarks?.[0] ?? null
      })
      faceMeshInstance = {
        send: (img) => faceMesh.send({ image: img }),
      }
      return true
    } catch (e) {
      lastError = e
      console.warn('[AR Engine] MediaPipe init failed for base:', base, e)
    }
  }
  console.warn('[AR Engine] All bases failed. Last error:', lastError)
  return false
}

export function sendFrame(video: HTMLVideoElement | HTMLCanvasElement): void {
  if (faceMeshInstance) faceMeshInstance.send(video).catch(() => {})
}

export function getLastLandmarks(): Landmark2D[] | null {
  return lastLandmarksRef
}

export function getTeethRegion(
  landmarks: Landmark2D[] | null,
  width: number,
  height: number
): TeethRegion | null {
  if (!landmarks || landmarks.length < 400) return null

  const get = (i: number) => landmarks[i]

  const upperLips = UPPER_INNER_LIP.map((i) => get(i)).filter(Boolean)
  const lowerLips = LOWER_INNER_LIP.map((i) => get(i)).filter(Boolean)
  if (upperLips.length < 5 || lowerLips.length < 5) return null

  const upperCenterY = upperLips.reduce((s, p) => s + p.y, 0) / upperLips.length
  const lowerCenterY = lowerLips.reduce((s, p) => s + p.y, 0) / lowerLips.length
  const mouthOpenNorm = lowerCenterY - upperCenterY
  const mouthOpenPx = Math.max(4, mouthOpenNorm * height)

  const leftX = Math.min(...upperLips.map((p) => p.x), ...lowerLips.map((p) => p.x)) * width
  const rightX = Math.max(...upperLips.map((p) => p.x), ...lowerLips.map((p) => p.x)) * width
  const mouthWidthPx = Math.max(20, rightX - leftX)
  const centerX = (leftX + rightX) / 2

  const teethSpan = mouthWidthPx * 0.82
  const halfSpan = teethSpan / 2
  const startX = centerX - halfSpan
  const step = teethSpan / (NUM_BRACKETS_UPPER + 1)

  const offsetIntoMouth = mouthOpenPx * 0.35
  const upperTeethY = (upperCenterY * height) + offsetIntoMouth
  const lowerTeethY = (lowerCenterY * height) - offsetIntoMouth

  const upperPoints: BracketPoint[] = []
  const lowerPoints: BracketPoint[] = []
  for (let i = 0; i < NUM_BRACKETS_UPPER; i++) {
    upperPoints.push({
      x: startX + (i + 1) * step,
      y: upperTeethY,
      angle: 0,
    })
  }
  for (let i = 0; i < NUM_BRACKETS_LOWER; i++) {
    lowerPoints.push({
      x: startX + (i + 1) * step,
      y: lowerTeethY,
      angle: 0,
    })
  }

  const minY = Math.min(upperTeethY, lowerTeethY) - mouthOpenPx * 0.3
  const maxY = Math.max(upperTeethY, lowerTeethY) + mouthOpenPx * 0.3
  const mouthBBox = {
    x: Math.max(0, centerX - teethSpan / 2 - 10),
    y: Math.max(0, minY - 5),
    width: Math.min(width, teethSpan + 20),
    height: Math.min(height, maxY - minY + 10),
  }

  return {
    upperPoints,
    lowerPoints,
    mouthBBox,
    centerX,
    centerY: (upperTeethY + lowerTeethY) / 2,
  }
}

const WIRE_COLOR = '#8a8f98'
const BRACKET_METAL = '#9ca3af'
const BRACKET_HIGHLIGHT = '#d1d5db'
const BRACKET_SHADOW = '#6b7280'

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawBracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  bw: number,
  bh: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const hw = bw / 2,
    hh = bh / 2,
    r = Math.min(bw, bh) * 0.2
  drawRoundedRect(ctx, -hw, -hh, bw, bh, r)
  const g = ctx.createLinearGradient(-hw, -hh, hw, hh)
  g.addColorStop(0, BRACKET_HIGHLIGHT)
  g.addColorStop(0.5, BRACKET_METAL)
  g.addColorStop(1, BRACKET_SHADOW)
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = BRACKET_SHADOW
  ctx.lineWidth = 0.8
  ctx.stroke()
  ctx.restore()
}

function drawBracketShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  bw: number,
  bh: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const hw = bw / 2 + 1,
    hh = bh / 2 + 0.8,
    r = Math.min(bw, bh) * 0.28
  ctx.globalAlpha = 0.28
  ctx.fillStyle = '#1a1a1a'
  drawRoundedRect(ctx, -hw, -hh + 1.2, 2 * hw, 2 * hh, r)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawLigature(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  bw: number,
  bh: number,
  color: string
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const ring = Math.max(1, Math.min(bw, bh) * 0.2)
  const hw = bw / 2 + ring * 0.6,
    hh = bh / 2 + ring * 0.6,
    r = Math.min(bw, bh) * 0.25 + ring
  ctx.beginPath()
  drawRoundedRect(ctx, -hw, -hh, 2 * hw, 2 * hh, r)
  ctx.closePath()
  ctx.strokeStyle = color
  ctx.lineWidth = ring
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}

export function drawSimulatedBraces(
  ctx: CanvasRenderingContext2D,
  region: TeethRegion,
  color: string,
  width: number,
  _height: number
): void {
  const { upperPoints, lowerPoints } = region
  const archWidth =
    upperPoints.length >= 2
      ? Math.abs(upperPoints[upperPoints.length - 1].x - upperPoints[0].x)
      : width * 0.2
  const spacing =
    upperPoints.length >= 2 ? Math.abs(upperPoints[1].x - upperPoints[0].x) : archWidth / 6
  const bracketW = Math.min(spacing * 0.68, Math.max(2.6, archWidth * 0.045))
  const bracketH = Math.max(1.6, bracketW * 0.55)

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const drawArch = (points: BracketPoint[]) => {
    if (points.length < 2) return
    for (const p of points) drawBracketShadow(ctx, p.x, p.y, p.angle, bracketW, bracketH)
    ctx.strokeStyle = WIRE_COLOR
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
    ctx.stroke()
    for (const p of points) {
      drawBracket(ctx, p.x, p.y, p.angle, bracketW, bracketH)
      drawLigature(ctx, p.x, p.y, p.angle, bracketW, bracketH, color)
    }
  }

  drawArch(upperPoints)
  drawArch(lowerPoints)
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360
  let r: number, g: number, b: number
  if (s === 0) r = g = b = l
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function parseHexToHS(hex: string): { h: number; s: number; v: number; r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1).replace(/^(.{6}).*/, '$1'), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const { h, s, v } = rgbToHsv(r, g, b)
  return { h, s, v, r, g, b }
}

export function applyElasticRecolor(
  sourceImageData: ImageData,
  mouthBBox: { x: number; y: number; width: number; height: number },
  selectedColorHex: string
): ImageData {
  const { width, height, data } = sourceImageData
  const out = new ImageData(width, height)
  out.data.set(data)
  const target = parseHexToHS(selectedColorHex)
  const isDark = target.v < 0.2
  const x0 = Math.max(0, Math.floor(mouthBBox.x))
  const y0 = Math.max(0, Math.floor(mouthBBox.y))
  const x1 = Math.min(width, Math.ceil(mouthBBox.x + mouthBBox.width))
  const y1 = Math.min(height, Math.ceil(mouthBBox.y + mouthBBox.height))

  const minSaturation = 0.18
  const minValue = 0.15

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const i = (py * width + px) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const { s, v } = rgbToHsv(r, g, b)
      if (s < minSaturation || v < minValue) continue
      const blend = Math.min(1, (s - minSaturation) / 0.4)
      let nr: number, ng: number, nb: number
      if (isDark) {
        nr = target.r
        ng = target.g
        nb = target.b
      } else {
        const rgb = hslToRgb(target.h, target.s, v)
        nr = rgb[0]
        ng = rgb[1]
        nb = rgb[2]
      }
      out.data[i] = Math.round(data[i] * (1 - blend) + nr * blend)
      out.data[i + 1] = Math.round(data[i + 1] * (1 - blend) + ng * blend)
      out.data[i + 2] = Math.round(data[i + 2] * (1 - blend) + nb * blend)
    }
  }
  return out
}
