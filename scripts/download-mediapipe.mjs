#!/usr/bin/env node
/**
 * Baixa os arquivos do MediaPipe Face Mesh para public/mediapipe/.
 * Execute: npm run download:mediapipe
 * Assim o Simulador de aparelho funciona mesmo com firewall bloqueando CDN.
 */
import { mkdir, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'mediapipe')
const VERSION = '0.4.1633559619'
const BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${VERSION}`

const FILES = [
  'face_mesh_solution_packed_assets_loader.js',
  'face_mesh_solution_simd_wasm_bin.js',
  'face_mesh_solution_simd_wasm_bin.wasm',
  'face_mesh_solution_wasm_bin.js',
  'face_mesh_solution_wasm_bin.wasm',
  'face_mesh_solution_packed_assets.data',
  'face_mesh.binarypb',
]

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log('Baixando arquivos do MediaPipe Face Mesh para public/mediapipe/ ...')
  for (const file of FILES) {
    const url = `${BASE}/${file}`
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = await res.arrayBuffer()
      const outPath = join(OUT_DIR, file)
      await writeFile(outPath, new Uint8Array(buf))
      console.log('  OK', file)
    } catch (err) {
      console.error('  ERRO', file, err.message)
    }
  }
  console.log('Concluído. Reinicie o servidor (npm run dev) e recarregue a página do Simulador.')
}

main()
