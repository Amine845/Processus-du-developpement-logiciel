import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Test React and Node modules without Electron's renderer require shims.
export default defineConfig({
  plugins: [react()],
  test: { environment: 'node' },
})
