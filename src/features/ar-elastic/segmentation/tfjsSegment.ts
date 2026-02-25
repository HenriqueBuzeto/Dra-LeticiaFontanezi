const MODEL_INPUT_SIZE = 256

let model: import('@tensorflow/tfjs').GraphModel | null = null

export function isSegmentModelLoaded(): boolean {
  return model != null
}

export async function loadSegmentModel(basePath = '/models/elastic-seg'): Promise<boolean> {
  if (model) return true
  try {
    const tf = await import('@tensorflow/tfjs')
    model = await tf.loadGraphModel(`${basePath}/model.json`)
    return true
  } catch (e) {
    console.warn('[elastic-seg] Model load failed:', e)
    return false
  }
}

export async function runSegmentInference(cropImageData: ImageData): Promise<Uint8Array | null> {
  if (!model || cropImageData.width !== MODEL_INPUT_SIZE || cropImageData.height !== MODEL_INPUT_SIZE) {
    return null
  }
  const tf = await import('@tensorflow/tfjs')
  const pixels = cropImageData.data
  const inputTensor = tf.tidy(() => {
    const batch: number[] = []
    for (let i = 0; i < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; i++) {
      batch.push(pixels[i * 4] / 255, pixels[i * 4 + 1] / 255, pixels[i * 4 + 2] / 255)
    }
    return tf.tensor4d(batch, [1, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3])
  })
  try {
    const out = model.predict(inputTensor) as import('@tensorflow/tfjs').Tensor
    const arr = out.squeeze().dataSync()
    inputTensor.dispose()
    out.dispose()
    const mask = new Uint8Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE)
    for (let i = 0; i < mask.length; i++) {
      const v = Number(arr[i])
      mask[i] = Math.round(Math.max(0, Math.min(255, v <= 1 ? v * 255 : v)))
    }
    return mask
  } catch (e) {
    inputTensor.dispose()
    return null
  }
}

export function disposeSegmentModel(): void {
  if (model) {
    model.dispose()
    model = null
  }
}
