import type { WebshellWSManager } from './services/webshellWSManager'

export interface WebshellResourceInit {
  name: string
  wsUrl?: string
}

export abstract class WebshellResource {
  readonly name: string
  manager?: WebshellWSManager
  protected wsUrl?: string

  constructor(r: WebshellResourceInit) {
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
