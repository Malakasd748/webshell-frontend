import type { RouteRecordRaw } from 'vue-router'
import WebShell from '@/views/WebShell.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: WebShell,
  },
]
