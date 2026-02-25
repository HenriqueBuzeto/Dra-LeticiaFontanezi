export function resizeImageData(
  src: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const out = new ImageData(targetWidth, targetHeight)
  const sw = src.width
  const sh = src.height
  const s = src.data
  const o = out.data
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const sx = (x / targetWidth) * sw
      const sy = (y / targetHeight) * sh
      const ix = Math.floor(sx)
      const iy = Math.floor(sy)
      const fx = sx - ix
      const fy = sy - iy
      const i00 = (Math.min(iy, sh - 1) * sw + Math.min(ix, sw - 1)) * 4
      const i10 = (Math.min(iy, sh - 1) * sw + Math.min(ix + 1, sw - 1)) * 4
      const i01 = (Math.min(iy + 1, sh - 1) * sw + Math.min(ix, sw - 1)) * 4
      const i11 = (Math.min(iy + 1, sh - 1) * sw + Math.min(ix + 1, sw - 1)) * 4
      const oi = (y * targetWidth + x) * 4
      for (let c = 0; c < 4; c++) {
        const v00 = s[i00 + c]
        const v10 = s[i10 + c]
        const v01 = s[i01 + c]
        const v11 = s[i11 + c]
        o[oi + c] = Math.round(
          v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy
        )
      }
    }
  }
  return out
}

export function resizeMask(
  maskData: Uint8Array | Uint8ClampedArray,
  maskW: number,
  maskH: number,
  targetW: number,
  targetH: number
): Uint8Array {
  const out = new Uint8Array(targetW * targetH)
  const step = maskW * maskH > 0 ? (maskData.length / (maskW * maskH)) : 1
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const sx = (x / targetW) * maskW
      const sy = (y / targetH) * maskH
      const ix = Math.min(Math.floor(sx), maskW - 1)
      const iy = Math.min(Math.floor(sy), maskH - 1)
      const si = (iy * maskW + ix) * step
      const v = maskData[Math.floor(si)]
      out[y * targetW + x] = v
    }
  }
  return out
}
