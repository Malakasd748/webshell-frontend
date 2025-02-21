import type { WebSocketManager } from './websocketManager'

export abstract class WebSocketService {
  abstract readonly name: string

  abstract register(manager: WebSocketManager): void

  /**
   * 此函数处理后端主动发出的消息
   */
  abstract handleAction(action: string, id: string, data: unknown): void

  abstract dispose(): void
}
