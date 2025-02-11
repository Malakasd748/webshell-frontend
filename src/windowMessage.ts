import { useEventListener } from '@vueuse/core'

import { HpcResource, type HpcResourceInit } from './hpcResource'
import { useWebshellTermStore } from './stores/term'

interface Message {
  action: string
  data: any
}

export function webshellNotifyOpenerReady() {
  if (window.opener) {
    const opener = window.opener as Window

    opener.postMessage({ webshell: { action: 'ready' } })
  }
}

/** 确保函数在 vue component 语境下调用 */
export function setupWebshell() {
  useEventListener(window, 'message', (ev) => {
    if (!ev.data.webshell) return

    const termStore = useWebshellTermStore()

    const { action, data } = ev.data.webshell as Message
    if (action === 'open') {
      const resource = data as HpcResourceInit
      termStore.addTerm(new HpcResource(resource))
    }
  })
}

/** 确保函数在 vue component 语境下调用 */
export function setupOpener(webshellWindow: Window, data: HpcResourceInit) {
  useEventListener(
    window,
    'message',
    (ev) => {
      if (!ev.data.webshell) return

      console.log(ev.data, data)

      const { action } = ev.data.webshell as Message
      if (action === 'ready') {
        openerNotifyWebshellOpen(webshellWindow, data)
      }
    },
    { once: true },
  )
}

export function openerNotifyWebshellOpen(webshellWindow: Window, data: HpcResourceInit) {
  webshellWindow.postMessage({ webshell: { action: 'open', data } })
}
