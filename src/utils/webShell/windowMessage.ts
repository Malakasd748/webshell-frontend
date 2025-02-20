import { useEventListener } from '@vueuse/core'

import type { WebShellResource, WebShellResourceInit } from '@/models/resources/webshellResource'
import { useWebShellTermStore } from '@/stores/webshellTerm'

interface Message {
  action: string
  data: unknown
}

export function webshellNotifyOpenerReady() {
  if (window.opener) {
    const opener = window.opener as Window

    opener.postMessage({ webshell: { action: 'ready' } })
  }
}

/** 确保函数在 vue component 语境下调用 */
export function setupWebshell(factory: (init: unknown) => WebShellResource) {
  useEventListener(window, 'message', (ev: { data?: { webshell?: Message } }) => {
    if (!ev.data?.webshell) return

    const termStore = useWebShellTermStore()

    const { action, data } = ev.data.webshell
    if (action === 'open') {
      void termStore.addTerm(factory(data))
    }
  })
}

/** 确保函数在 vue component 语境下调用 */
export function setupOpener(webshellWindow: Window, data: WebShellResourceInit) {
  useEventListener(
    window,
    'message',
    (ev: { data?: { webshell?: Message } }) => {
      if (!ev.data?.webshell) return

      console.log(ev.data, data)

      const { action } = ev.data.webshell
      if (action === 'ready') {
        openerNotifyWebshellOpen(webshellWindow, data)
      }
    },
    { once: true },
  )
}

export function openerNotifyWebshellOpen(webshellWindow: Window, data: WebShellResourceInit) {
  webshellWindow.postMessage({ webshell: { action: 'open', data } })
}
