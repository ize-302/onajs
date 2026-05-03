import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileRouter } from '@ize-302/onajs'

export default defineConfig({
  plugins: [
    react(),
    fileRouter({ appDir: 'src/app' })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
})
