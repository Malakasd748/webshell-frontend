import { WebshellResource } from '../webshellResource';

export class LocalhostResource extends WebshellResource {
  override async fetchWsUrl(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return 'ws://localhost:1234';
  }
}
