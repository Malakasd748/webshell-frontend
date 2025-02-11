import { defineConfig } from 'vite'
import { resolve } from 'path'
import Vue from '@vitejs/plugin-vue'
import VueJSX from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [Vue(), VueJSX()],
  resolve: {
    alias: {
      '^@/': resolve(import.meta.dirname, 'src') + '/',
    },
  },
})
