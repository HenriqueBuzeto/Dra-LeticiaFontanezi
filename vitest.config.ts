import { defineConfig } from 'vitest/config'
import path from 'path'

/** Config de testes. Dev/build é Next.js (sem Vite). */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
