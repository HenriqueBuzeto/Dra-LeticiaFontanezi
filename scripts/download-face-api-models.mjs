#!/usr/bin/env node
/**
 * Baixa os pesos do face-api.js para public/models/.
 * Execute: npm run download:face-api-models
 * Assim o Simulador AR funciona mesmo com firewall bloqueando o CDN.
 */
import { mkdir, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'models')
const BASE = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights'

const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
]

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log('Baixando pesos do face-api.js para public/models/ ...')
  for (const file of FILES) {
    const url = `${BASE}/${file}`
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = await res.arrayBuffer()
      await writeFile(join(OUT_DIR, file), new Uint8Array(buf))
      console.log('  OK', file)
    } catch (err) {
      console.error('  ERRO', file, err.message)
    }
  }
  console.log('Concluído. Recarregue a página do Simulador (o app tenta /models primeiro).')
}

main()
