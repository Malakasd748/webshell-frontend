import { shallowReactive } from 'vue'

import { WebSocketManager } from '../websocketBase/webSocketManager'
import { WebshellShellService } from './webshellShellService'
import { WebShellFSService } from './webshellFSService'
import { WebShellUploadService } from './webshellUploadService'
import { WebShellHeartbeatService } from './webshellHeartbeatService'
import { useWebShellUploadStore } from '@/stores/webshellUpload'
import type { UploadSession } from '../websocketBase/uploadService'
import { WebShellResource } from '@/models/resources/webshellResource'

export class WebShellWSManager extends WebSocketManager {
  shellService: WebshellShellService
  fsService: WebShellFSService
  uploadService: WebShellUploadService
  heartbeatService: WebShellHeartbeatService
  latency?: number

  constructor(url: string | URL, readonly resource: WebShellResource) {
    super(url)

    this.shellService = new WebshellShellService()
    this.fsService = new WebShellFSService()
    this.heartbeatService = new WebShellHeartbeatService()

    const uploadSessions = useWebShellUploadStore().sessions
    this.uploadService = new WebShellUploadService(uploadSessions as UploadSession[])

    const reactiveThis = shallowReactive(this)

    resource.manager = reactiveThis
    reactiveThis.registerService(this.shellService)
    reactiveThis.registerService(this.fsService)
    reactiveThis.registerService(this.uploadService)
    reactiveThis.registerService(this.heartbeatService)

    this.ws.addEventListener('close', () => {
      this.latency = undefined
    })

    return reactiveThis
  }

  protected override fetchNewUrl(): Promise<string> {
    return this.resource.fetchWsUrl()
  }
}
