import type { RouteRecordRaw } from 'vue-router'
import WebShell from '@/views/WebshellView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: WebShell,
  },
]
