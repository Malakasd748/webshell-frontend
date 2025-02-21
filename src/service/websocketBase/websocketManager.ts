/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { CacheMap } from '@/utils/cacheMap'
import type { WebSocketService } from './websocketServiceBase'

export interface Message<Action = string, Data = unknown> {
  service: string
  action: Action
  id: string
  data: Data
  error?: string
}

class PromiseMap<T = unknown> extends CacheMap<
  `${string}:${string}:${string}`,
  { resolve(this: void, val: T): void, reject(this: void, err?: unknown): void }
> {}

export interface WebSocketManagerEventMap {
  'reconnect-start': CustomEvent<never>
  'reconnect-end': CustomEvent<{ success: boolean }>
}

// Interface declaration for better type hints
interface WebSocketManagerEventTarget {
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

class WebSocketManagerEventTarget extends EventTarget { }

export abstract class WebSocketManager {
  private _ws: WebSocket
  private promiseMap = new PromiseMap()
  readonly e = new WebSocketManagerEventTarget()

  protected services = new Map<string, WebSocketService>()

  get ws() {
    return this._ws as Readonly<WebSocket>
  }

  constructor(url: string | URL) {
    this._ws = new WebSocket(url)
    this.setupWebSocket(this._ws)
  }

  private setupWebSocket(ws: WebSocket) {
    ws.addEventListener('message', (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as Message
      const key = `${message.service}:${message.action}:${message.id}` as const
      const promise = this.promiseMap.get(key)

      if (promise) {
        // 这是一个请求的响应
        this.promiseMap.delete(key)
        if (message.error) {
          promise.reject(new Error(message.error))
        } else {
          promise.resolve(message.data)
        }
      } else {
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
    this.e.dispatchEvent(new CustomEvent('reconnect-start'))
    try {
      const url = await this.fetchNewUrl()
      const newSocket = new WebSocket(url)
      this.setupWebSocket(newSocket)
      this._ws = newSocket

      // 等待新连接建立
      if (newSocket.readyState === WebSocket.CONNECTING) {
        await new Promise<void>((resolve, reject) => {
          newSocket.addEventListener('open', () => resolve(), { once: true })
          newSocket.addEventListener('error', () => reject(new Error('websocket error')), { once: true })
        })
      }

      this.e.dispatchEvent(new CustomEvent('reconnect-end', { detail: { success: true } }))
    } catch (error) {
      this.e.dispatchEvent(new CustomEvent('reconnect-end', { detail: { success: false } }))
      throw error
    }
  }

  private messageQueue: string[] = []
  private isReconnecting = false

  private async sendWithReconnect(message: string) {
    if (this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(message)
      return
    }

    if (this._ws.readyState === WebSocket.CONNECTING) {
      await new Promise<void>((resolve, reject) => {
        this._ws.addEventListener('open', () => resolve(), { once: true })
        this._ws.addEventListener('error', () => reject(new Error('websocket error')), { once: true })
      })
      this._ws.send(message)
      return
    }

    // 如果连接已关闭或正在关闭，尝试重连
    this.messageQueue.push(message)
    if (!this.isReconnecting) {
      this.isReconnecting = true
      try {
        await this.reconnect()
        // 发送队列中的所有消息
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift()
          if (msg) {
            this._ws.send(msg)
          }
        }
      } finally {
        this.isReconnecting = false
      }
    }
  }

  /**
   * 注册一个WebSocket服务
   * @throws 如果服务已经注册过
   */
  registerService(service: WebSocketService): void {
    if (this.services.has(service.name)) {
      throw new Error(`Service ${service.name} already registered`)
    }
    service.register(this)
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

  /**
  * Sends a request message over the WebSocket connection.
  *
  * This method sends the provided message to the server using a WebSocket. Depending on the specified
  * parameters, it may expect a response and handle reconnection logic if necessary.
  *
  * @template A - The action type of the message.
  * @template Req - The type of the request payload.
  * @template Res - The type of the expected response payload.
  *
  * @param message - The message object containing service, action, id, and the request data.
  * @param response - A flag indicating whether a response is expected. Defaults to true.
  * @param reconnect - A flag indicating whether to attempt reconnection if needed. Defaults to true.
  *
  * @returns A promise that resolves with the response data if a response is expected, or void otherwise.
  *
  * @throws {Error} If the service specified in the message is not registered.
  */
  request<A extends string, Req, Res>(message: Message<A, Req>): Promise<Res>
  request<A extends string, Req, Res>(message: Message<A, Req>, response: true, reconnect?: boolean): Promise<Res>
  request<A extends string, Req, _Res>(message: Message<A, Req>, response: false, reconnect?: boolean): Promise<void>
  request<A extends string, Req, Res>(
    message: Message<A, Req>,
    response = true,
    reconnect = true,
  ): Promise<void | Res> {
    // 确保服务已注册
    if (!this.services.has(message.service)) {
      throw new Error(`Service ${message.service} not registered`)
    }

    if (!response) {
      if (reconnect) {
        void this.sendWithReconnect(JSON.stringify(message))
      } else {
        this._ws.send(JSON.stringify(message))
      }
      return Promise.resolve()
    } else {
      return new Promise<Res>((resolve, reject) => {
        const key = `${message.service}:${message.action}:${message.id}` as const
        this.promiseMap.set(key, {
          resolve,
          reject,
        })

        if (reconnect) {
          void this.sendWithReconnect(JSON.stringify(message))
        } else {
          this._ws.send(JSON.stringify(message))
        }

        setTimeout(() => reject(new Error(`Request timeout: ${key}`)), this.promiseMap.ttl)
      })
    }
  }
}
