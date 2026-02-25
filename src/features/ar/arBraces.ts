import * as faceapi from 'face-api.js'

const CDN_WEIGHTS = [
  'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights',
  'https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/weights',
]
let modelsLoaded = false

const LIGATURE_KEY_COLOR = { r: 254, g: 0, b: 255 }
const KEY_COLOR_TOLERANCE = 40

const ASSET_BASE = '/ar-assets'
const ASSET_NAMES = ['braces-upper.png', 'braces-lower.png'] as const
const ASSET_SINGLE = 'braces.png'

let cachedUpper: HTMLImageElement | null = null
let cachedLower: HTMLImageElement | null = null
let cachedSingle: HTMLImageElement | null = null

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

export function loadBracesAssets(): Promise<{
  upper: HTMLImageElement | null
  lower: HTMLImageElement | null
  single: HTMLImageElement | null
}> {
  if (typeof window === 'undefined')
    return Promise.resolve({ upper: null, lower: null, single: null })
  if (cachedUpper && cachedLower)
    return Promise.resolve({ upper: cachedUpper, lower: cachedLower, single: cachedSingle })
  return Promise.all([
    loadImage(`${ASSET_BASE}/${ASSET_NAMES[0]}`).catch(() => null),
    loadImage(`${ASSET_BASE}/${ASSET_NAMES[1]}`).catch(() => null),
    loadImage(`${ASSET_BASE}/${ASSET_SINGLE}`).catch(() => null),
  ]).then(([upper, lower, single]) => {
    cachedUpper = upper
    cachedLower = lower
    cachedSingle = single
    return { upper, lower, single }
  })
}

export async function loadFaceModels(): Promise<boolean> {
  if (modelsLoaded) return true
  if (typeof window === 'undefined') return false
  const bases = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FACE_API_MODELS)
    ? [process.env.NEXT_PUBLIC_FACE_API_MODELS]
    : ['/models', ...CDN_WEIGHTS]
  for (const base of bases) {
    try {
      await Promise.all([
        faceapi.loadTinyFaceDetectorModel(base),
        faceapi.loadFaceLandmarkModel(base),
      ])
      modelsLoaded = true
      return true
    } catch (e) {
      console.warn('[AR Braces] Base falhou:', base, e)
    }
  }
  return false
}

function parseColorToRgba(color: string): { r: number; g: number; b: number; a: number } {
  if (color.startsWith('rgba')) {
    const m = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*([\d.]+)?\s*\)/)
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] != null ? Math.round(parseFloat(m[4]) * 255) : 255 }
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const n = parseInt(hex, 16)
    if (hex.length === 6) return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 }
    if (hex.length === 8) return { r: (n >> 24) & 255, g: (n >> 16) & 255, b: (n >> 8) & 255, a: n & 255 }
  }
  return { r: 255, g: 255, b: 255, a: 255 }
}

function isKeyColor(r: number, g: number, b: number): boolean {
  const dr = Math.abs(r - LIGATURE_KEY_COLOR.r)
  const dg = Math.abs(g - LIGATURE_KEY_COLOR.g)
  const db = Math.abs(b - LIGATURE_KEY_COLOR.b)
  return dr <= KEY_COLOR_TOLERANCE && dg <= KEY_COLOR_TOLERANCE && db <= KEY_COLOR_TOLERANCE
}

function drawPngBracesWithColorReplace(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  elasticColor: string
): void {
  const w = Math.max(1, Math.round(destW))
  const h = Math.max(1, Math.round(destH))
  let off: HTMLCanvasElement | null = null
  try {
    off = document.createElement('canvas')
    off.width = w
    off.height = h
    const offCtx = off.getContext('2d')
    if (!offCtx) return
    offCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h)
    const imageData = offCtx.getImageData(0, 0, w, h)
    const data = imageData.data
    const target = parseColorToRgba(elasticColor)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      if (a > 10 && isKeyColor(r, g, b)) {
        data[i] = target.r
        data[i + 1] = target.g
        data[i + 2] = target.b
        data[i + 3] = Math.round((target.a / 255) * a)
      }
    }
    offCtx.putImageData(imageData, 0, 0)
    ctx.drawImage(off, destX, destY, destW, destH)
  } finally {
    off = null
  }
}

const WIRE_COLOR = '#9ca3af'
const WIRE_WIDTH = 1.4
const BRACKET_METAL = '#a1a5ae'
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
  bracketW: number,
  bracketH: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const hw = bracketW / 2
  const hh = bracketH / 2
  const r = Math.min(bracketW, bracketH) * 0.2
  drawRoundedRect(ctx, -hw, -hh, bracketW, bracketH, r)
  const gradient = ctx.createLinearGradient(-hw, -hh, hw, hh)
  gradient.addColorStop(0, BRACKET_HIGHLIGHT)
  gradient.addColorStop(0.5, BRACKET_METAL)
  gradient.addColorStop(1, BRACKET_SHADOW)
  ctx.fillStyle = gradient
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
  bracketW: number,
  bracketH: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const hw = bracketW / 2 + 1
  const hh = bracketH / 2 + 0.8
  const r = Math.min(bracketW, bracketH) * 0.28
  ctx.globalAlpha = 0.32
  ctx.fillStyle = '#1a1a1a'
  drawRoundedRect(ctx, -hw, -hh + 1.5, 2 * hw, 2 * hh, r)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawLigatureOnly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  bracketW: number,
  bracketH: number,
  elasticColor: string
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const ringW = Math.max(1.2, Math.min(bracketW, bracketH) * 0.22)
  const hw = bracketW / 2 + ringW * 0.6
  const hh = bracketH / 2 + ringW * 0.6
  const r = Math.min(bracketW, bracketH) * 0.25 + ringW
  ctx.beginPath()
  drawRoundedRect(ctx, -hw, -hh, 2 * hw, 2 * hh, r)
  ctx.closePath()
  ctx.strokeStyle = elasticColor
  ctx.lineWidth = ringW
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}

function drawArchPerTooth(
  ctx: CanvasRenderingContext2D,
  points: ToothPoint[],
  bracketW: number,
  bracketH: number,
  elasticColor: string
): void {
  if (points.length < 2) return

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const pt of points) {
    drawBracketShadow(ctx, pt.x, pt.y, pt.angle, bracketW, bracketH)
  }
  ctx.strokeStyle = WIRE_COLOR
  ctx.lineWidth = WIRE_WIDTH
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.stroke()
  for (const pt of points) {
    drawBracket(ctx, pt.x, pt.y, pt.angle, bracketW, bracketH)
    drawLigatureOnly(ctx, pt.x, pt.y, pt.angle, bracketW, bracketH, elasticColor)
  }
}

function drawProceduralBracesOnTeeth(
  ctx: CanvasRenderingContext2D,
  teeth: TeethRegion,
  elasticColor: string
): void {
  const { width: teethW, upperPoints, lowerPoints } = teeth
  const spacing = upperPoints.length >= 2
    ? Math.abs(upperPoints[1].x - upperPoints[0].x)
    : teethW / 6
  const bracketW = Math.min(spacing * 0.7, Math.max(2.8, teethW * 0.048))
  const bracketH = Math.max(1.8, bracketW * 0.55)

  drawArchPerTooth(ctx, upperPoints, bracketW, bracketH, elasticColor)
  drawArchPerTooth(ctx, lowerPoints, bracketW, bracketH, elasticColor)
}

interface ToothPoint {
  x: number
  y: number
  angle: number
}

const NUM_UPPER_TEETH = 6
const NUM_LOWER_TEETH = 6

interface TeethRegion {
  centerX: number
  centerY: number
  width: number
  height: number
  upperArchY: number
  lowerArchY: number
  upperPoints: ToothPoint[]
  lowerPoints: ToothPoint[]
}

function getTeethRegionFromLandmarks(landmarks: faceapi.FaceLandmarks68): TeethRegion | null {
  const positions = landmarks.positions
  if (!positions || positions.length < 68) return null

  const p60 = positions[60]
  const p61 = positions[61]
  const p62 = positions[62]
  const p63 = positions[63]
  const p64 = positions[64]
  const p65 = positions[65]
  const p66 = positions[66]
  const p67 = positions[67]
  if (!p60 || !p61 || !p62 || !p63 || !p64 || !p65 || !p66 || !p67) return null

  const upperLipY = (p60.y + p61.y + p62.y + p63.y) / 4
  const lowerLipY = (p64.y + p65.y + p66.y + p67.y) / 4
  const mouthOpenH = Math.max(8, lowerLipY - upperLipY)

  const leftX = (p60.x + p64.x) / 2
  const rightX = (p63.x + p67.x) / 2
  const mouthWidth = Math.max(15, rightX - leftX)
  const centerX = (leftX + rightX) / 2
  const teethSpan = mouthWidth * 0.88

  const upperTeethY = upperLipY + mouthOpenH * 0.52
  const lowerTeethY = lowerLipY - mouthOpenH * 0.52

  const upperPoints: ToothPoint[] = []
  const lowerPoints: ToothPoint[] = []
  const step = teethSpan / (NUM_UPPER_TEETH + 1)
  const startX = centerX - teethSpan / 2

  for (let i = 0; i < NUM_UPPER_TEETH; i++) {
    const x = startX + (i + 1) * step
    upperPoints.push({ x, y: upperTeethY, angle: 0 })
  }
  for (let i = 0; i < NUM_LOWER_TEETH; i++) {
    const x = startX + (i + 1) * step
    lowerPoints.push({ x, y: lowerTeethY, angle: 0 })
  }

  const upperArchY = upperTeethY
  const lowerArchY = lowerTeethY
  const teethWidth = teethSpan
  const teethHeight = Math.max(10, lowerTeethY - upperTeethY)
  const centerY = (upperTeethY + lowerTeethY) / 2

  return {
    centerX,
    centerY,
    width: teethWidth,
    height: teethHeight,
    upperArchY,
    lowerArchY,
    upperPoints,
    lowerPoints,
  }
}

function getTeethRegionFallback(landmarks: faceapi.FaceLandmarks68): TeethRegion | null {
  const mouth = landmarks.getMouth()
  if (!mouth || mouth.length < 12) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  mouth.forEach((p) => {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  })
  const mouthW = maxX - minX
  const mouthH = maxY - minY
  if (mouthW < 8 || mouthH < 6) return null
  const centerX = (minX + maxX) / 2
  const teethSpan = mouthW * 0.82
  const step = teethSpan / (NUM_UPPER_TEETH + 1)
  const startX = centerX - teethSpan / 2
  const upperTeethY = minY + mouthH * 0.52
  const lowerTeethY = maxY - mouthH * 0.52
  const upperPoints: ToothPoint[] = []
  const lowerPoints: ToothPoint[] = []
  for (let i = 0; i < NUM_UPPER_TEETH; i++) {
    upperPoints.push({ x: startX + (i + 1) * step, y: upperTeethY, angle: 0 })
  }
  for (let i = 0; i < NUM_LOWER_TEETH; i++) {
    lowerPoints.push({ x: startX + (i + 1) * step, y: lowerTeethY, angle: 0 })
  }
  return {
    centerX,
    centerY: (upperTeethY + lowerTeethY) / 2,
    width: teethSpan,
    height: Math.max(10, lowerTeethY - upperTeethY),
    upperArchY: upperTeethY,
    lowerArchY: lowerTeethY,
    upperPoints,
    lowerPoints,
  }
}

export function drawBracesOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: faceapi.FaceLandmarks68,
  elasticColor: string,
  _width: number,
  _height: number
): void {
  const teeth = getTeethRegionFromLandmarks(landmarks) ?? getTeethRegionFallback(landmarks)
  if (!teeth) return

  const { centerX, width: teethW, height: teethH, upperArchY, lowerArchY } = teeth
  if (teethW < 5 || teethH < 5) return

  ctx.save()

  if (cachedUpper && cachedLower) {
    const scale = 0.95
    const drawW = teethW * scale
    const upperH = (cachedUpper.naturalHeight / cachedUpper.naturalWidth) * drawW
    const lowerH = (cachedLower.naturalHeight / cachedLower.naturalWidth) * drawW
    const destX = centerX - drawW / 2
    const upperDestY = upperArchY - upperH / 2
    const lowerDestY = lowerArchY - lowerH / 2

    drawPngBracesWithColorReplace(ctx, cachedUpper, destX, upperDestY, drawW, upperH, elasticColor)
    drawPngBracesWithColorReplace(ctx, cachedLower, destX, lowerDestY, drawW, lowerH, elasticColor)
  } else if (cachedSingle) {
    const scale = 0.95
    const drawW = teethW * scale
    const drawH = (cachedSingle.naturalHeight / cachedSingle.naturalWidth) * drawW
    const destX = centerX - drawW / 2
    const destY = teeth.centerY - drawH / 2
    drawPngBracesWithColorReplace(ctx, cachedSingle, destX, destY, drawW, drawH, elasticColor)
  } else {
    drawProceduralBracesOnTeeth(ctx, teeth, elasticColor)
  }

  ctx.restore()
}

const tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.5,
})

export async function detectFaceLandmarks(
  input: HTMLVideoElement | HTMLCanvasElement
): Promise<faceapi.FaceLandmarks68 | null> {
  if (!modelsLoaded) return null
  try {
    const detections = await faceapi
      .detectAllFaces(input, tinyFaceDetectorOptions)
      .withFaceLandmarks()
    const first = detections[0]
    if (!first?.landmarks) return null
    return first.landmarks as faceapi.FaceLandmarks68
  } catch {
    return null
  }
}

export function getMouthBBoxFromLandmarks(
  landmarks: faceapi.FaceLandmarks68,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } | null {
  const mouth = landmarks.getMouth()
  if (!mouth || mouth.length < 6) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  mouth.forEach((p) => {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  })
  const margin = 20
  const x = Math.max(0, minX - margin)
  const y = Math.max(0, minY - margin)
  const w = Math.min(width - x, maxX - minX + 2 * margin)
  const h = Math.min(height - y, maxY - minY + 2 * margin)
  if (w < 10 || h < 10) return null
  return { x, y, width: w, height: h }
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
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
  h /= 360
  if (s === 0) return [Math.round(l * 255), Math.round(l * 255), Math.round(l * 255)]
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
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
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
      const r = data[i], g = data[i + 1], b = data[i + 2]
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
        nr = rgb[0]; ng = rgb[1]; nb = rgb[2]
      }
      out.data[i] = Math.round(data[i] * (1 - blend) + nr * blend)
      out.data[i + 1] = Math.round(data[i + 1] * (1 - blend) + ng * blend)
      out.data[i + 2] = Math.round(data[i + 2] * (1 - blend) + nb * blend)
    }
  }
  return out
}
