import { WebSocketManager, type WebSocketManagerEventMap } from '../webSocketBase/webSocketManager'
import { WebshellPTYService } from './webShellPTYService'
import { WebShellFSService } from './webShellFSService'
import { UploadService } from '../webSocketBase/uploadService'
import { WebShellHeartbeatService } from './webShellHeartbeatService'
import { useWebShellUploadStore } from '@/stores/webShellUpload'
import type { UploadSession } from '../webSocketBase/uploadService'
import { WebShellResource } from '@/models/resources/webShellResource'

// 允许服务扩展 WebSocketManager 的事件类型
export interface WebShellWSManagerEventMap extends WebSocketManagerEventMap {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface WebShellWSManager {
  addEventListener<K extends keyof WebShellWSManagerEventMap>(
    type: K,
    listener: (ev: WebShellWSManagerEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class WebShellWSManager extends WebSocketManager {
  readonly ptyService: WebshellPTYService
  readonly fsService: WebShellFSService
  readonly uploadService: UploadService
  readonly heartbeatService: WebShellHeartbeatService
  readonly resource: Readonly<WebShellResource>

  constructor(url: string | URL, resource: WebShellResource) {
    super(url)
    this.resource = resource
    resource.manager = this

    this.ptyService = new WebshellPTYService(this)
    this.fsService = new WebShellFSService(this)
    this.heartbeatService = new WebShellHeartbeatService(this)

    const uploadSessions = useWebShellUploadStore().sessions
    this.uploadService = new UploadService(this, uploadSessions as UploadSession[])

    this.registerService(this.ptyService)
    this.registerService(this.fsService)
    this.registerService(this.uploadService)
    this.registerService(this.heartbeatService)
  }

  protected override fetchNewUrl(): Promise<string> {
    return this.resource.fetchWsUrl()
  }

  get latency() {
    return this.heartbeatService.getLatency()
  }
}
