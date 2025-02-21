import { useTimeoutPoll } from '@vueuse/core'

import { WebSocketService } from '../websocketBase/websocketServiceBase'
import type { WebShellWSManager } from './webShellWSManager'

export class WebShellHeartbeatService extends WebSocketService {
  readonly name = 'heartbeat'

  private manager?: WebShellWSManager
  private stopHeartbeat = () => {}
  private startHeartbeat = () => {}

  constructor() {
    super()
  }

  register(manager: WebShellWSManager): void {
    this.manager = manager
    const { resume, pause } = useTimeoutPoll(
      async () => {
        if (!this.manager) throw new Error('HearbeatService not registered')

        const sendTime = Date.now()
        await this.manager.request({ service: this.name, action: this.name, id: this.name, data: undefined }, true, false)
        const receiveTime = Date.now()
        this.manager.latency = receiveTime - sendTime
      },
      5000,
      { immediate: false },
    )

    this.startHeartbeat = resume
    this.stopHeartbeat = pause

    if (manager.ws.readyState === WebSocket.OPEN) {
      this.startHeartbeat()
    } else {
      manager.ws.addEventListener('open', () => this.startHeartbeat())
    }

    manager.ws.addEventListener('close', () => this.stopHeartbeat())
    manager.e.addEventListener('reconnect-end', ({ detail: { success } }) => {
      if (!success) return
      this.startHeartbeat()
    })
  }

  handleAction(_action: string, _id: string, _data: unknown): void { }

  override dispose(): void {
    this.stopHeartbeat()
  }
}
