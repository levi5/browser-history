import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep the generated extension readable while debugging the loaded build.
    minify: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        options: resolve(__dirname, "options.html"),
        background: resolve(__dirname, "src/background.ts")
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") return "background.js"
          return "[name].js"
        }
      }
    }
  }
})
