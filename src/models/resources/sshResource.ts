import { WebShellResource, type WebShellResourceInit } from './webshellResource'
import { sshLogin, getSshWsUrl } from '@/api/webshell'

interface SSHResourceInit extends WebShellResourceInit {
  host: string
  port: number
  username: string
  password: string
}

export class SSHResource extends WebShellResource {
  readonly host: string
  readonly port: number
  readonly username: string
  readonly password: string
  id?: string

  constructor(init: SSHResourceInit) {
    super(init)
    this.host = init.host
    this.port = init.port
    this.username = init.username
    this.password = init.password
  }

  async fetchWsUrl(): Promise<string> {
    const res = await sshLogin({
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
    })

    this.id = res.data.id

    return getSshWsUrl(res.data.id)
  }
}
