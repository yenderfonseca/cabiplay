import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app is served from https://yenderfonseca.com/cabiplay, so every emitted
// asset URL must carry that prefix. Relative base would break on deep routes
// like /cabiplay/estacion/xtrema-989-fm, where "../" resolves differently.
export default defineConfig({
  plugins: [react()],
  base: '/cabiplay/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets/build',
  },
})
