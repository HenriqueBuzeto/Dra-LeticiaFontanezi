import type { FaceMouthResult, Point2D, BoundingBox } from './types'

const MOUTH_LANDMARK_INDICES = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80,
  81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95,
]

export interface FaceMeshAPI {
  send(image: HTMLVideoElement | HTMLCanvasElement): Promise<void>
  onResults(cb: (results: { multiFaceLandmarks?: { x: number; y: number; z?: number }[][] }) => void): void
}

let faceMeshInstance: FaceMeshAPI | null = null
let pendingResolve: ((landmarks: { x: number; y: number; z?: number }[] | null) => void) | null = null

export async function initFaceMesh(): Promise<FaceMeshAPI | null> {
  if (faceMeshInstance) return faceMeshInstance
  if (typeof window === 'undefined') return null

  try {
    const { FaceMesh } = await import('@mediapipe/face_mesh')
    const faceMesh = new FaceMesh({
      locateFile: (path: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${path}`
      },
    })

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    await faceMesh.initialize()
    faceMesh.onResults((results: { multiFaceLandmarks?: { x: number; y: number; z?: number }[][] }) => {
      const resolve = pendingResolve
      pendingResolve = null
      if (resolve) resolve(results.multiFaceLandmarks?.[0] ?? null)
    })
    faceMeshInstance = {
      send: (image) => faceMesh.send({ image }),
      onResults: () => {},
    }
    return faceMeshInstance
  } catch (e) {
    console.warn('[AR Layer1] MediaPipe Face Mesh init failed:', e)
    return null
  }
}

function isMouthOpen(landmarks: { x: number; y: number }[], width: number, height: number): boolean {
  const upper = landmarks[13] ?? landmarks[0]
  const lower = landmarks[14] ?? landmarks[17]
  if (!upper || !lower) return false
  const dy = Math.abs((lower.y - upper.y) * height)
  const openThreshold = Math.min(width, height) * 0.02
  return dy >= openThreshold
}

export function processFaceMeshLandmarks(
  landmarks: { x: number; y: number; z?: number }[] | null,
  frameWidth: number,
  frameHeight: number
): FaceMouthResult | null {
  if (!landmarks || landmarks.length < 100) return null

  const points: Point2D[] = []
  let minX = 1,
    minY = 1,
    maxX = 0,
    maxY = 0

  for (const i of MOUTH_LANDMARK_INDICES) {
    const lm = landmarks[i]
    if (!lm) continue
    const x = lm.x * frameWidth
    const y = lm.y * frameHeight
    points.push({ x, y })
    minX = Math.min(minX, lm.x)
    minY = Math.min(minY, lm.y)
    maxX = Math.max(maxX, lm.x)
    maxY = Math.max(maxY, lm.y)
  }

  if (points.length < 6) return null

  const mouthBBox: BoundingBox = {
    x: Math.max(0, (minX - 0.02) * frameWidth),
    y: Math.max(0, (minY - 0.02) * frameHeight),
    width: Math.min(frameWidth, (maxX - minX + 0.04) * frameWidth),
    height: Math.min(frameHeight, (maxY - minY + 0.04) * frameHeight),
  }

  const mouthOpen = isMouthOpen(landmarks, frameWidth, frameHeight)
  const area = mouthBBox.width * mouthBBox.height
  const minArea = (frameWidth * frameHeight) * 0.001
  const confidence = area >= minArea && mouthOpen ? 0.95 : mouthOpen ? 0.7 : 0.3

  return {
    mouthPolygon: points,
    mouthBBox,
    mouthOpen,
    confidence,
  }
}

export function runLayer1(
  mesh: FaceMeshAPI,
  image: HTMLVideoElement | HTMLCanvasElement,
  width: number,
  height: number
): Promise<FaceMouthResult | null> {
  return new Promise((resolve) => {
    pendingResolve = (landmarks) => {
      resolve(processFaceMeshLandmarks(landmarks, width, height))
    }
    mesh.send(image).catch(() => {
      if (pendingResolve) {
        pendingResolve(null)
        pendingResolve = null
      }
      resolve(null)
    })
  })
}
