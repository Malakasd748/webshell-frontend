import { launchShell } from '@/api/webshell'
import { WebshellResource, type WebshellResourceInit } from './webshellResource'

export interface HpcResourceInit extends WebshellResourceInit {
  id: string
}

export class HpcResource extends WebshellResource {
  readonly id: string

  constructor(r: HpcResourceInit) {
    super(r)
    this.id = r.id
  }

  async fetchWsUrl() {
    const { data } = await launchShell({ resource_type: 'hpc', resource_id: this.id })
    if (data.success !== 'yes') {
      throw new Error('获取 websocket 地址失败')
    }

    return data.ws_url
  }
}
