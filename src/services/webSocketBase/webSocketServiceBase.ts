import type { WebSocketManager } from './webSocketManager'

export abstract class WebSocketService {
  abstract readonly name: string

  constructor(protected manager: WebSocketManager) {}

  abstract handleAction(action: string, id: string, data: unknown): void

  abstract dispose(): void
}
