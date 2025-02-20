import { WebShellResource, type WebShellResourceInit } from './webshellResource'

interface LocalhostResourceInit extends WebShellResourceInit {
  port?: number
}

export class LocalhostResource extends WebShellResource {
  private port: number

  constructor(init: LocalhostResourceInit) {
    super(init)
    this.port = init.port ?? 1234
  }

  async fetchWsUrl(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return `ws://localhost:${this.port}/shell/local`
  }
}
