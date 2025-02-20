import type { WebShellWSManager } from '@/services/webshell/webShellWSManager'

export interface WebShellResourceInit {
  id: string
  name: string
  wsUrl?: string
}

export abstract class WebShellResource {
  readonly id: string
  readonly name: string
  manager?: WebShellWSManager

  protected wsUrl?: string

  constructor(r: WebShellResourceInit) {
    this.id = r.id
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
