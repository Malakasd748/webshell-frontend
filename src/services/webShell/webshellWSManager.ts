import { shallowReactive } from 'vue'

import { WebSocketManager } from '../webSocketBase/webSocketManager'
import { WebshellPTYService } from './webShellPTYService'
import { WebShellFSService } from './webShellFSService'
import { WebShellUploadService } from './webShellUploadService'
import { WebShellHeartbeatService } from './webShellHeartbeatService'
import { useWebShellUploadStore } from '@/stores/webShellUpload'
import type { UploadSession } from '../webSocketBase/uploadService'
import { WebShellResource } from '@/models/resources/webShellResource'

export class WebShellWSManager extends WebSocketManager {
  ptyService: WebshellPTYService
  fsService: WebShellFSService
  uploadService: WebShellUploadService
  heartbeatService: WebShellHeartbeatService
  latency?: number

  constructor(url: string | URL, readonly resource: WebShellResource) {
    super(url)

    this.ptyService = new WebshellPTYService()
    this.fsService = new WebShellFSService()
    this.heartbeatService = new WebShellHeartbeatService()

    const uploadSessions = useWebShellUploadStore().sessions
    this.uploadService = new WebShellUploadService(uploadSessions as UploadSession[])

    const reactiveThis = shallowReactive(this)

    resource.manager = reactiveThis
    reactiveThis.registerService(this.ptyService)
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
