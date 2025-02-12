import type { WebshellWSManager } from '../../services/webShell/webshellWSManager'

export interface WebShellResourceInit {
  name: string
  wsUrl?: string
}

export abstract class WebShellResource {
  readonly name: string
  manager?: WebshellWSManager
  protected wsUrl?: string

  constructor(r: WebShellResourceInit) {
    this.name = r.name
    this.wsUrl = r.wsUrl
  }

  abstract fetchWsUrl(): Promise<string>

  async getWsUrl() {
    if (this.wsUrl) return this.wsUrl

    this.wsUrl = await this.fetchWsUrl()
    return this.wsUrl
  }
}
