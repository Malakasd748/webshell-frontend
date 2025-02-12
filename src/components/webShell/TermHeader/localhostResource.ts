import { WebShellResource } from '@/models/resources/webShellResource'

export class LocalhostResource extends WebShellResource {
  override async fetchWsUrl(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return 'ws://localhost:1234'
  }
}
