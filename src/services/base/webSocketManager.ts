import { CacheMap } from '@/utils/cachemap'
import type { WebSocketService } from './webSocketServiceBase'

export interface Message<Action = string, Data = unknown> {
  service: string
  action: Action
  id: string
  data: Data
  error?: string
}

class PromiseMap<T = unknown> extends CacheMap<
  `${string}:${string}:${string}`,
  { resolve(val: T): void, reject(err?: any): void }
> {}

export interface WebSocketManagerEventMap {
  'reconnect-start': CustomEvent<never>
  'reconnect-end': CustomEvent<{ success: boolean }>
}
// Interface declaration for better type hints
export interface WebSocketManager {
  addEventListener<K extends keyof WebSocketManagerEventMap>(
    type: K,
    listener: (ev: WebSocketManagerEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void
  // Overload to shut up TS
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
}
export abstract class WebSocketManager extends EventTarget {
  private _ws: WebSocket
  private promiseMap = new PromiseMap()

  protected services = new Map<string, WebSocketService>()

  get ws() {
    return this._ws as Readonly<WebSocket>
  }

  constructor(url: string | URL) {
    super()
    this._ws = new WebSocket(url)
    this.setupWebSocket(this._ws)
  }

  private setupWebSocket(ws: WebSocket) {
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data) as Message
      const key = `${message.service}:${message.action}:${message.id}` as const
      const promise = this.promiseMap.get(key)

      if (promise) {
        // 这是一个请求的响应
        this.promiseMap.delete(key)
        if (message.error) {
          promise.reject(new Error(message.error))
        }
        else {
          promise.resolve(message.data)
        }
      }
      else {
        // 这是服务器主动发送的消息
        const service = this.services.get(message.service)
        if (!service) {
          console.warn(`Received message for unregistered service: ${message.service}`)
          return
        }
        service.handleAction(message.action, message.id, message.data)
      }
    })

    ws.addEventListener('close', () => {
      for (const { reject } of this.promiseMap.values()) {
        reject(new Error('WebSocket closed'))
      }
    })
  }

  protected abstract fetchNewUrl(): Promise<string>

  private async reconnect() {
    this._ws.close()
    this.dispatchEvent(new CustomEvent('reconnect-start'))
    try {
      const url = await this.fetchNewUrl()
      const newSocket = new WebSocket(url)
      this.setupWebSocket(newSocket)
      this._ws = newSocket

      // 等待新连接建立
      if (newSocket.readyState === WebSocket.CONNECTING) {
        await new Promise<void>((resolve, reject) => {
          newSocket.addEventListener('open', () => resolve(), { once: true })
          newSocket.addEventListener('error', e => reject(e), { once: true })
        })
      }

      this.dispatchEvent(new CustomEvent('reconnect-end', { detail: { success: true } }))
    }
    catch (error) {
      this.dispatchEvent(new CustomEvent('reconnect-end', { detail: { success: false } }))
      throw error
    }
  }

  private async sendWithReconnect(message: string) {
    if (this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(message)
      return
    }
    if (this._ws.readyState === WebSocket.CONNECTING) {
      await new Promise<void>((resolve, reject) => {
        this._ws.addEventListener('open', () => resolve(), { once: true })
        this._ws.addEventListener('error', e => reject(e), { once: true })
      })
      this._ws.send(message)
      return
    }

    // 如果连接已关闭或正在关闭，尝试重连
    await this.reconnect()
    this._ws.send(message)
  }

  /**
   * 注册一个WebSocket服务
   * @throws 如果服务已经注册过
   */
  registerService(service: WebSocketService): void {
    if (this.services.has(service.name)) {
      throw new Error(`Service ${service.name} already registered`)
    }
    this.services.set(service.name, service)
  }

  /**
   * 注销一个WebSocket服务
   * @returns 是否成功注销
   */
  unregisterService(serviceName: string): boolean {
    // 清理该服务相关的所有pending请求
    for (const [key, promise] of this.promiseMap.entries()) {
      if (key.startsWith(`${serviceName}:`)) {
        promise.reject(new Error('Service unregistered'))
        this.promiseMap.delete(key)
      }
    }
    return this.services.delete(serviceName)
  }

  request<A extends string, Req, Res>(message: Message<A, Req>): Promise<Res>
  request<A extends string, Req, Res>(message: Message<A, Req>, noResponse: false): Promise<Res>
  request<A extends string, Req, Res>(message: Message<A, Req>, noResponse: true): Promise<void>
  /** Associate request with response */
  async request<A extends string, Req, Res>(
    message: Message<A, Req>,
    noResponse = false,
  ): Promise<void | Res> {
    // 确保服务已注册
    if (!this.services.has(message.service)) {
      throw new Error(`Service ${message.service} not registered`)
    }

    if (noResponse) {
      await this.sendWithReconnect(JSON.stringify(message))
      return Promise.resolve() // TS 不知道这里对应返回值是void
    }
    else {
      return new Promise<Res>((resolve, reject) => {
        const key = `${message.service}:${message.action}:${message.id}` as const
        this.promiseMap.set(key, {
          resolve,
          reject,
        })

        this.sendWithReconnect(JSON.stringify(message))

        setTimeout(() => reject(new Error(`Request timeout: ${key}`)), this.promiseMap.ttl)
      })
    }
  }
}
