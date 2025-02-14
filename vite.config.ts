/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import VueJSX from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'

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
})
