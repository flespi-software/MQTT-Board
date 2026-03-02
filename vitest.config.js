import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['tests/e2e/**', 'node_modules/**']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
