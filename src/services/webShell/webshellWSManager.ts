import { WebSocketManager, type WebSocketManagerEventMap } from '../webSocketBase/webSocketManager'
import { WebshellPTYService } from './webShellPTYService'
import { WebshellFSService } from './webShellFSService'
import { UploadService } from '../webSocketBase/uploadService'
import { useWebshellUploadStore } from '@/stores/webShellUpload'
import type { UploadSession } from '../webSocketBase/uploadService'
import { WebShellResource } from '@/models/resources/webShellResource'

// 允许服务扩展 WebSocketManager 的事件类型
export interface WebshellWSManagerEventMap extends WebSocketManagerEventMap {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface WebshellWSManager {
  addEventListener<K extends keyof WebshellWSManagerEventMap>(
    type: K,
    listener: (ev: WebshellWSManagerEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class WebshellWSManager extends WebSocketManager {
  readonly ptyService: WebshellPTYService
  readonly fsService: WebshellFSService
  readonly uploadService: UploadService

  constructor(url: string | URL, readonly resource: Readonly<WebShellResource>) {
    super(url)

    this.ptyService = new WebshellPTYService(this)
    this.fsService = new WebshellFSService(this)

    const uploadSessions = useWebshellUploadStore().sessions
    this.uploadService = new UploadService(this, uploadSessions as UploadSession[])

    this.registerService(this.ptyService)
    this.registerService(this.fsService)
    this.registerService(this.uploadService)
  }

  protected override fetchNewUrl(): Promise<string> {
    return this.resource.fetchWsUrl()
  }
}
