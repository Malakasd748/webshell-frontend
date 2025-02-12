import { useTimeoutPoll } from '@vueuse/core'

import { WebSocketService } from '../webSocketBase/webSocketServiceBase'
import type { WebSocketManager } from '../webSocketBase/webSocketManager'

export class WebShellHeartbeatService extends WebSocketService {
  readonly name = 'heartbeat'
  private latency = 0
  private stopHeartbeat: () => void
  private startHeartbeat: () => void

  constructor(protected override manager: WebSocketManager) {
    super(manager)

    const { resume, pause } = useTimeoutPoll(
      async () => {
        const sendTime = Date.now()
        await this.manager.request({ service: this.name, action: 'heartbeat', id: 'heartbeat', data: undefined })
        const receiveTime = Date.now()
        this.latency = receiveTime - sendTime
      },
      5000,
      { immediate: false },
    )

    this.startHeartbeat = resume
    this.stopHeartbeat = pause

    this.startHeartbeat()

    manager.addEventListener('reconnect-start', () => this.stopHeartbeat())
    manager.addEventListener('reconnect-end', ({ detail: { success } }) => {
      if (!success) return
      this.startHeartbeat()
    })
  }

  handleAction(_action: string, _id: string, _data: unknown): void { }

  getLatency(): number {
    return this.latency
  }

  override dispose(): void {
    this.stopHeartbeat()
  }
}
