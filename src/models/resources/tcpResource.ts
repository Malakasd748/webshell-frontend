import { WebShellResource, type WebShellResourceInit } from './webshellResource'
import { getTcpWsUrl } from '@/api/webshell'

interface TCPResourceInit extends WebShellResourceInit {
  host: string
  port: number
}

export class TCPResource extends WebShellResource {
  readonly host: string
  readonly port: number

  constructor(init: TCPResourceInit) {
    super(init)
    this.host = init.host
    this.port = init.port
  }

  async fetchWsUrl(): Promise<string> {
    return getTcpWsUrl(this.host, this.port)
  }
}