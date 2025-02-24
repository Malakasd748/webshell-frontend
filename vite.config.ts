/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import VueJSX from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'

const env = loadEnv('development', import.meta.dirname)
const apiBase = env.VITE_API_BASE

export default defineConfig({
  plugins: [vue(), VueJSX(), UnoCSS()],
  resolve: {
    alias: {
      '@/': resolve(import.meta.dirname, 'src') + '/',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  server: {
    port: 5176,
    proxy: {
      [apiBase]: {
        target: 'http://localhost:1234',
        changeOrigin: true,
        rewrite: path => path.replace(new RegExp(`^${apiBase}`), ''),
        ws: true,
      },
    },
  },
})
