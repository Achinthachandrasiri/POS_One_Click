import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/setup.js'],
    environmentMatchGlobs: [
      ['tests/handlers/**', 'node'],
      ['tests/models/**', 'node'],
      ['tests/hooks/**', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      crypto: 'node:crypto'  
    }
  }
})
